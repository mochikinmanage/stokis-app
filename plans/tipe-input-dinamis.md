# Spesifikasi: Tipe Input Dinamis per Item (Master_Item)

Status: Draft
Terkait: `Master_Item`, `SO_Transaksi`, `app/so/input/page.tsx`, `lib/domain/so.ts`, `lib/domain/so-validation.ts`, `lib/domain/master-item-service.ts`, `lib/domain/so-service.ts`, `apps-script/MasterItem.js`, `apps-script/SO.js`

## 1. Masalah

Saat ini semua item di Master_Item dipaksa pakai 1 pola input yang sama:
`Step1` (number) + `Step2` (number) + `Keterangan` (text bebas, opsional).

Beberapa item tidak cocok dengan pola ini, contoh: tabung gas (3kg/12kg) yang
tidak direstock harian dan tidak dihitung sebagai kuantitas — yang relevan
justru status isi/kosong dan tanggal kejadian (refill, mulai pakai).

## 2. Solusi

Tambah kolom `Tipe_Input` di sheet `Master_Item`, berisi string
comma-separated (pola sama seperti `cabangId`/`Role` di Users — lihat
`lib/auth.ts:71-74`). Form input SO membaca kolom ini dan merender field
sesuai kombinasi tipe yang terdaftar per item.

### 2.1 Tipe yang didukung

| Tipe | Field yang dirender |
|---|---|
| `single` | 1 input number (pakai `Step1`, `Step2` diabaikan/selalu 0) |
| `dual` | 2 input number (`Step1` + `Step2`) — perilaku default/existing |
| `boolean` | toggle 2 state: Isi / Kosong |
| `date` | 2 date picker: `Tgl_Refill`, `Tgl_Pakai` |

Kombinasi valid dipisah koma, contoh:
- `single` → cuma Step1
- `dual` → Step1 + Step2 (default kalau kolom kosong, untuk backward compat)
- `boolean,date` → toggle Isi/Kosong + Tgl_Refill + Tgl_Pakai (dipakai tabung gas)

Item tanpa `Tipe_Input` diisi (kolom kosong) → fallback ke `dual` (perilaku
saat ini, tidak ada breaking change untuk item existing).

## 3. Perubahan Skema Sheet

### 3.1 Master_Item (tambah 1 kolom di akhir)

```
Item_ID | Nama_Barang | Area | Satuan | Konversi_Isi | Konversi_Keterangan | Threshold | Aktif | Tanggal_Dibuat | Tipe_Input
```

Contoh isi:
```
ITM_001 | Sendok Besi         | Dapur | pcs  | ... | ... | 20 | TRUE | ... | single
ITM_002 | Cling Pembersih     | Dapur | btl  | ... | ... | 3  | TRUE | ... | dual
ITM_003 | Gas 3Kg Tabung 1    | Dapur | tbg  | ... | ... |    | TRUE | ... | boolean,date
ITM_004 | Gas 3Kg Tabung 2    | Dapur | tbg  | ... | ... |    | TRUE | ... | boolean,date
```

Catatan: `Master_Item` dibaca via `sheetToObjects` (header-driven, lihat
`lib/domain/master-item-service.ts:23`) — kolom baru otomatis terbaca tanpa
ubah index. Hanya fungsi **write** (`addItem`) yang perlu disentuh.

### 3.2 SO_Transaksi (tambah 3 kolom di akhir)

Sheet ini ditulis via **array positional** (`appendRows`, lihat
`lib/domain/so-service.ts:142-156`), beda dari Master_Item — urutan kolom
harus tetap dan konsisten dengan `SO_COL`.

```
... | Keterangan | Status_Isi | Tgl_Refill | Tgl_Pakai
```

`Status_Isi`: `'Isi' | 'Kosong' | ''` (string, bukan boolean asli — konsisten
dengan sheet lain yang simpan status sebagai string, mis. `StatusType`)
`Tgl_Refill`, `Tgl_Pakai`: string `YYYY-MM-DD` atau `''`

Item bertipe `single`/`dual` tanpa boolean/date → 3 kolom ini kosong.

## 4. Perubahan Kode

### 4.1 `lib/domain/so.ts`

```ts
export const SO_COL = {
  Transaksi_ID: 1,
  Timestamp: 2,
  Tanggal_Operasional: 3,
  Shift: 4,
  Item_ID: 5,
  Nama_Barang: 6,
  Area: 7,
  Step1: 8,
  Step2: 9,
  Total: 10,
  Petugas: 11,
  Sesi_ID: 12,
  Keterangan: 13,
  Status_Isi: 14,   // NEW
  Tgl_Refill: 15,   // NEW
  Tgl_Pakai: 16,    // NEW
} as const;
```

Tambah helper parse tipe input (pola sama `assertCabangAccess`,
`lib/auth.ts:71-74`):

```ts
export type InputTipe = 'single' | 'dual' | 'boolean' | 'date';

export function parseTipeInput(raw: unknown): InputTipe[] {
  const s = String(raw || '').trim().toLowerCase();
  if (!s) return ['dual']; // fallback backward-compat
  return s
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean) as InputTipe[];
}

export function hasTipe(tipeInput: InputTipe[], tipe: InputTipe): boolean {
  return tipeInput.includes(tipe);
}
```

Extend `SOItem` interface:

```ts
export interface SOItem {
  itemId: string;
  step1: number;
  step2: number;
  total: number;
  keterangan: string;
  statusIsi?: 'Isi' | 'Kosong' | '';   // NEW
  tglRefill?: string;                    // NEW, YYYY-MM-DD
  tglPakai?: string;                     // NEW, YYYY-MM-DD
}
```

### 4.2 `lib/domain/master-item-service.ts`

`MasterItemPayload`: tambah `Tipe_Input?: string`.

`addItem()`: tambah 1 elemen ke array append —

```ts
await appendRows(spreadsheetId, 'Master_Item', [[
  itemId,
  payload.Nama_Barang,
  payload.Area,
  payload.Satuan,
  payload.Konversi_Isi || '',
  payload.Konversi_Keterangan || '',
  parseThreshold(payload.Threshold),
  true,
  new Date(),
  payload.Tipe_Input || '', // NEW
]]);
```

### 4.3 `apps-script/MasterItem.js` (paralel/legacy — ubah bareng)

```js
function addItem(cabangId, payload) {
  const { spreadsheet } = resolveCabangSpreadsheet_(cabangId);
  const sheet = getSheetByName_(spreadsheet, 'Master_Item');
  const itemId = buildItemId_(newRandomToken_(6));
  sheet.appendRow([
    itemId, payload.Nama_Barang, payload.Area, payload.Satuan,
    payload.Konversi_Isi || '', payload.Konversi_Keterangan || '',
    Number(payload.Threshold) || 0, true, new Date(),
    payload.Tipe_Input || '', // NEW
  ]);
  return { itemId };
}
```

### 4.4 `app/so/input/page.tsx`

**Interface `MasterItem`** (baris ~34-40): tambah `Tipe_Input: string`.

**Interface `PreviousSO`**: tambah `statusIsi`, `tglRefill`, `tglPakai`.

**Interface `SOItemPayload`**: tambah `statusIsi`, `tglRefill`, `tglPakai`,
`prevStatusIsi`, `prevTglRefill`, `prevTglPakai`.

**State `counts`**: extend value type untuk simpan `statusIsi` (`boolean |
undefined` — `undefined` = belum disentuh user, beda dari `false`),
`tglRefill`, `tglPakai` (string).

**Render item** (baris ~1044+): sebelum render blok Step1/Step2, parse
tipe:

```ts
import { parseTipeInput, hasTipe } from '@/lib/domain/so';
// ...
const tipeInput = parseTipeInput(item.Tipe_Input);
```

Percabangan render:
- `hasTipe(tipeInput, 'single')` → render 1 input number (Step1 saja,
  sembunyikan blok Step2)
- `hasTipe(tipeInput, 'dual')` → render blok Step1+Step2 seperti sekarang
  (tidak berubah)
- `hasTipe(tipeInput, 'boolean')` → render toggle Isi/Kosong (2 tombol atau
  switch), gantikan blok angka
- `hasTipe(tipeInput, 'date')` → render 2 date input: "Tgl Refill" dan "Tgl
  Pakai ke Kompor"

Kombinasi `boolean,date` dipakai berdampingan (toggle + 2 date picker dalam
1 card item), bukan saling menggantikan.

**`handleCountChange`**: extend union field untuk terima
`'statusIsi' | 'tglRefill' | 'tglPakai'`.

### 4.5 Logic Auto-fill & Auto-status (inti perubahan behavior)

Di `buildPayloadItems()` (baris 526-556), tambahkan cabang logic setelah
blok step1/step2 existing (pola sama: kosong → fallback ke `prev`):

```ts
const buildPayloadItems = (): SOItemPayload[] => {
  return items.map((it) => {
    const c = counts[it.Item_ID] || {};
    const prev = previousSO[it.Item_ID] || previousSO[it.Nama_Barang] || previousSO[it.Nama_Barang.trim()];

    // ... existing step1/step2/keterangan logic tidak berubah ...

    // NEW — boolean/date, independen per item (loop items.map sudah
    // menjamin ini: restock 1 tabung TIDAK menyentuh state tabung lain)
    const tglRefillInput = (c.tglRefill || '').trim();
    const tglRefill = tglRefillInput || prev?.tglRefill || '';

    // Auto-status: kalau Tgl_Refill DIISI BARU hari ini → status otomatis Isi.
    // Kalau tidak, ikut input manual toggle, atau carry dari prev.
    let statusIsi: 'Isi' | 'Kosong' | '';
    if (tglRefillInput) {
      statusIsi = 'Isi'; // auto — refill baru = pasti isi
    } else if (c.statusIsi !== undefined) {
      statusIsi = c.statusIsi ? 'Isi' : 'Kosong'; // manual override staff
    } else {
      statusIsi = prev?.statusIsi ?? ''; // auto-carry dari SO sebelumnya
    }

    const tglPakaiInput = (c.tglPakai || '').trim();
    const tglPakai = tglPakaiInput || prev?.tglPakai || ''; // manual, auto-carry

    return {
      // ...existing fields...
      statusIsi,
      tglRefill,
      tglPakai,
      prevStatusIsi: prev?.statusIsi ?? null,
      prevTglRefill: prev?.tglRefill ?? null,
      prevTglPakai: prev?.tglPakai ?? null,
    };
  });
};
```

**Poin kunci behavior (konfirmasi requirement):**
1. Tiap item diproses independen dalam `items.map()` — restock tabung A
   tidak memengaruhi tabung B/C/D sama sekali (state terpisah per
   `Item_ID` di `counts` & `previousSO`).
2. Arah dependency: `Tgl_Refill diisi → Status_Isi = Isi (auto)`.
   **Bukan sebaliknya** — status tidak pernah menentukan tanggal.
3. `Tgl_Pakai` murni manual, independen dari `Tgl_Refill` dan `Status_Isi`,
   auto-carry kalau tidak diisi ulang.
4. Kalau hari ini tidak ada perubahan sama sekali untuk item boolean/date
   (staff tidak sentuh toggle maupun date picker), semua 3 field auto-fill
   dari sesi SO terakhir (`prev`) — konsisten dengan perilaku step1/step2
   yang sudah ada.

### 4.6 `lib/domain/so-validation.ts`

Tambah validasi conditional per tipe (butuh akses `Tipe_Input` dari master
item — saat ini validator tidak fetch master, perlu extend signature atau
validasi tipe dilakukan di `so-service.ts` setelah lookup `masterMap`):

- `statusIsi` (jika ada) harus salah satu dari `'Isi' | 'Kosong' | ''`
- `tglRefill`/`tglPakai` (jika ada) harus format `YYYY-MM-DD` atau string
  kosong — reuse `isValidTanggal` dari `lib/domain/ids.ts`
- Item bertipe `single`: `step2` wajib 0 (abaikan input Step2 dari client,
  jangan percaya blind — normalize di server, sama seperti `normalizeCount`
  sekarang)

### 4.7 `lib/domain/so-service.ts`

`submitSO()` — extend row building (baris 142-156) untuk push 3 kolom
baru sesuai urutan `SO_COL`:

```ts
rows.push([
  transaksiId, timestamp, tanggal, shift, it.itemId,
  master.Nama_Barang, master.Area, it.step1, it.step2, it.total,
  petugas, sesiId, it.keterangan,
  it.statusIsi || '',   // NEW
  it.tglRefill || '',   // NEW
  it.tglPakai || '',    // NEW
]);
```

### 4.8 `apps-script/SO.js` (paralel/legacy — cek & selaraskan)

Perlu ditinjau apakah ada row-building manual serupa (append ke sheet SO)
yang juga harus disesuaikan urutan kolomnya. Belum dibaca detail — cek
sebelum implementasi.

## 5. Yang Belum Diputuskan / Perlu Dikonfirmasi

1. **UI toggle boolean**: 2 tombol (Isi/Kosong) atau switch on/off? Perlu
   state "belum disentuh" (null) agar auto-carry bisa bedakan dari
   "sengaja diset Kosong".
2. **Validasi item bertipe `single`**: apakah Step2 dari existing draft
   lama (localStorage) perlu dibersihkan otomatis kalau tipe item berubah
   dari `dual` ke `single`?
3. **Laporan XLSX** (`lib/domain/xlsx-report.ts`): perlu kolom tambahan di
   laporan untuk item boolean/date (saat ini kolom laporan diasumsikan
   S1/S2/Total untuk semua baris) — belum dianalisis, kemungkinan perlu
   render berbeda per tipe di laporan juga.
4. **`getStatusBadge`**: item bertipe boolean/date tidak punya `Threshold`
   relevan — badge KRITIS/AMAN saat ini dihitung dari `total` vs
   `threshold`, perlu badge terpisah untuk status Isi/Kosong (bukan pakai
   badge stok yang sama).

## 6. Ringkasan File yang Berubah

| File | Perubahan |
|---|---|
| `Master_Item` (sheet) | +1 kolom: `Tipe_Input` |
| `SO_Transaksi` (sheet) | +3 kolom: `Status_Isi`, `Tgl_Refill`, `Tgl_Pakai` |
| `lib/domain/so.ts` | +`SO_COL` entries, +`parseTipeInput`/`hasTipe`, extend `SOItem` |
| `lib/domain/master-item-service.ts` | extend `MasterItemPayload`, `addItem()` |
| `apps-script/MasterItem.js` | extend `addItem()` (paralel) |
| `app/so/input/page.tsx` | extend interfaces, render percabangan, extend `buildPayloadItems()` |
| `lib/domain/so-validation.ts` | validasi conditional per tipe |
| `lib/domain/so-service.ts` | extend row building di `submitSO()` |
| `apps-script/SO.js` | cek & selaraskan (belum ditinjau) |
| `lib/domain/xlsx-report.ts` | belum dianalisis — kemungkinan perlu render kolom tambahan |
