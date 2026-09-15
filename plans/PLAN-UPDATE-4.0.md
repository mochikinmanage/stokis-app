# PLAN UPDATE 4.0 — Tipe Input Kombinatorial + Auto-fill Removal + Freeze Columns

> **Tanggal:** 16 September 2026
> **Branch:** `main`
> **Status:** Rencana (belum implementasi)

---

## Daftar Isi

1. [Ringkasan Perubahan](#1-ringkasan-perubahan)
2. [Masalah yang Ditemukan](#2-masalah-yang-ditemukan)
3. [Perubahan 1: Hapus Auto-fill + Validasi Wajib Isi](#3-perubahan-1-hapus-auto-fill--validasi-wajib-isi)
4. [Perubahan 2: Freeze Columns](#4-perubahan-2-freeze-columns)
5. [Perubahan 3: Sistem Tipe Input Kombinatorial](#5-perubahan-3-sistem-tipe-input-kombinatorial)
6. [Spec Tipe Input per Tipe](#6-spec-tipe-input-per-tipe)
7. [Kombinasi yang Didukung](#7-kombinasi-yang-didukung)
8. [Detail Implementasi per File](#8-detail-implementasi-per-file)
9. [Urutan Pengerjaan](#9-urutan-pengerjaan)
10. [Testing & Verification](#10-testing--verification)

---

## 1. Ringkasan Perubahan

| # | Perubahan | Prioritas | File Terdampak |
|---|---|---|---|
| 1 | Hapus auto-fill dari previous SO + validasi wajib isi | High | `app/so/input/page.tsx` |
| 2 | Freeze kolom No, Nama Barang, Satuan di laporan web view | Medium | `app/laporan/view/.../page.tsx`, `view.css` |
| 3 | Sistem tipe input kombinatorial (input UI + laporan) | High | 7 file |

---

## 2. Masalah yang Ditemukan

### 2.1 Auto-fill Bug

**Lokasi:** `app/so/input/page.tsx`

Ketika user tidak mengisi kolom S1/S2/statusIsi/tglRefill/tglPakai, sistem otomatis mengisi dengan data SO sebelumnya. Ini menyebabkan:
- Item berubah sendiri di laporan (data sebelumnya masuk tanpa user sadar)
- Laporan menunjukkan data yang bukan input user hari ini

**Penyebab:**
- `buildPayloadItems()` baris 894-895: fallback `prev?.step1 ?? 0` saat S1 kosong
- `buildPayloadItems()` baris 898: fallback `prev?.keterangan`
- `buildPayloadItems()` baris 902: fallback `prev?.tglRefill`
- `buildPayloadItems()` baris 907-908: fallback `prev?.statusIsi`
- `buildPayloadItems()` baris 912: fallback `prev?.tglPakai`
- `SOItemRow` baris 334-338: effective value fallback di UI display

### 2.2 Tipe Input Tidak Konsisten

**Temuan:**
- Hanya `"boolean,date"` yang didukung end-to-end
- `"dual,boolean"` → UI hanya tampilkan boolean, S1/S2 hilang
- `"dual,date"` → UI hanya tampilkan date, S1/S2 hilang
- `getGroup()` di `laporan-view.ts` dan `getReportTypes()[0]` di `report-item-type.ts` **tidak konsisten** untuk compound types
- XLSX template hanya render primary type (types[0]) — secondary type hilang
- Whitelist di `master-item-service.ts` hanya izinkan 7 value

### 2.3 Kolom Tidak Freeze

**Temuan:**
- Web view laporan saat ini: No, Nama Barang, Satuan, Threshold semua sticky
- User ingin: hanya No, Nama Barang, Satuan yang freeze (Threshold scrollable)

---

## 3. Perubahan 1: Hapus Auto-fill + Validasi Wajib Isi

### 3.1 Hapus Auto-fill

**File:** `app/so/input/page.tsx`

| Lokasi | Saat Ini | Sesudah |
|---|---|---|
| Baris 334-338 (SOItemRow) | `effStatus = statusIsiVal !== undefined ? statusIsiVal : (prev?.statusIsi \|\| '')` | `effStatus = statusIsiVal \|\| ''` |
| Baris 337-338 | `effRefill = (count?.tglRefill \|\| '') \|\| (prev?.tglRefill \|\| '')` | `effRefill = count?.tglRefill \|\| ''` |
| Baris 338 | `effPakai = (count?.tglPakai \|\| '') \|\| (prev?.tglPakai \|\| '')` | `effPakai = count?.tglPakai \|\| ''` |
| Baris 894 | `step1 = step1Str === '' ? (prev?.step1 ?? 0) : step1Num` | `step1 = step1Str === '' ? 0 : step1Num` |
| Baris 895 | `step2 = step2Str === '' ? (prev?.step2 ?? 0) : step2Num` | `step2 = step2Str === '' ? 0 : step2Num` |
| Baris 898 | `keterangan = c.keterangan.trim() \|\| prevKeterangan` | `keterangan = c.keterangan.trim()` |
| Baris 902 | `tglRefill = tglRefillInput \|\| prev?.tglRefill \|\| ''` | `tglRefill = tglRefillInput \|\| ''` |
| Baris 907-908 | `statusIsi = ... \|\| (prev?.statusIsi ?? '')` | `statusIsi = c.statusIsi \|\| ''` |
| Baris 912 | `tglPakai = tglPakaiInput \|\| prev?.tglPakai \|\| ''` | `tglPakai = tglPakaiInput \|\| ''` |

### 3.2 Tambah Validasi Wajib Isi

**Lokasi:** `app/so/input/page.tsx`, sebelum `buildPayloadItems()` dipanggil (~baris 1030)

```typescript
// Validasi: semua field wajib diisi
const emptyItems: string[] = [];
items.forEach((it) => {
  const c = counts[it.Item_ID];
  const tipe = parseTipeInput(it.Tipe_Input);
  const primary = tipe[0]; // primary type = tipe pertama
  
  if (primary === 'dual' || primary === 'single') {
    if (!c?.step1?.trim()) emptyItems.push(`${it.Nama_Barang}: S1 kosong`);
    if (primary === 'dual' && !c?.step2?.trim()) emptyItems.push(`${it.Nama_Barang}: S2 kosong`);
  }
  if (tipe.includes('boolean')) {
    if (!c?.statusIsi) emptyItems.push(`${it.Nama_Barang}: Status Isi belum dipilih`);
  }
  if (tipe.includes('date')) {
    if (!c?.tglRefill?.trim()) emptyItems.push(`${it.Nama_Barang}: Tgl Refill kosong`);
  }
  if (tipe.includes('expiry')) {
    // expiry uses step1 as tglKedaluwarsa in some contexts
    // but stored as Tgl_Kedaluwarsa — check input field
  }
});

if (emptyItems.length > 0) {
  setErrorMsg(`Wajib isi semua kolom:\n${emptyItems.slice(0, 5).join('\n')}${emptyItems.length > 5 ? `\n... dan ${emptyItems.length - 5} lainnya` : ''}`);
  return;
}
```

### 3.3 UI Feedback

- Tambahkan visual indicator (merah border) pada field yang belum diisi
- Error message spesifik: "S1 wajib diisi" / "Status Isi wajib dipilih" / dll
- Tombol submit tetap enabled, tapi validasi block submit jika ada kosong

---

## 4. Perubahan 2: Freeze Columns

### 4.1 CSS Classes

**File:** `app/laporan/view/[laporanId]/view.css`

Tambah:
```css
/* Freeze columns — sticky horizontal */
.rv-td-freeze-1 {
  position: sticky;
  left: 0;
  z-index: 12;
  background: #FFFFFF;
}
.rv-td-freeze-2 {
  position: sticky;
  left: 36px;  /* width kolom No */
  z-index: 11;
  background: #FFFFFF;
}
.rv-td-freeze-3 {
  position: sticky;
  left: 190px; /* 36 + width Nama Barang */
  z-index: 10;
  background: #FFFFFF;
  border-right: 1px solid #EAEAEA;
}

/* Hover state — background match */
.rv-tr:hover .rv-td-freeze-1,
.rv-tr:hover .rv-td-freeze-2,
.rv-tr:hover .rv-td-freeze-3 {
  background: #FBFBFA;
}

/* Header versions */
.rv-th-freeze-1 { position: sticky; left: 0; z-index: 15; background: #F7F6F3; }
.rv-th-freeze-2 { position: sticky; left: 36px; z-index: 14; background: #F7F6F3; }
.rv-th-freeze-3 { position: sticky; left: 190px; z-index: 13; background: #F7F6F3; border-right: 1px solid #EAEAEA; }
```

### 4.2 HTML Changes

**File:** `app/laporan/view/[laporanId]/page.tsx`

**Header (`<th>`):**
```diff
- <th className="rv-th rv-th-sticky" style={{ width: 36 }}>No</th>
+ <th className="rv-th rv-th-freeze-1" style={{ width: 36 }}>No</th>

- <th className="rv-th rv-th-sticky" style={{ minWidth: 150 }}>Nama Barang</th>
+ <th className="rv-th rv-th-freeze-2" style={{ minWidth: 150 }}>Nama Barang</th>

- <th className="rv-th rv-th-sticky" style={{ width: 56 }}>Satuan</th>
+ <th className="rv-th rv-th-freeze-3" style={{ width: 56 }}>Satuan</th>

- <th className="rv-th rv-th-sticky" style={{ width: 60 }}>Thresh.</th>
+ <th className="rv-th" style={{ width: 60 }}>Thresh.</th>  {/* TIDAK freeze */}
```

**Data (`<td>`):**
```diff
- <td className="rv-td rv-td-sticky rv-td-center">{no}</td>
+ <td className="rv-td rv-td-freeze-1 rv-td-center">{no}</td>

- <td className="rv-td rv-td-sticky">
+ <td className="rv-td rv-td-freeze-2">

- <td className="rv-td rv-td-sticky rv-td-muted">{item.satuan || '-'}</td>
+ <td className="rv-td rv-td-freeze-3 rv-td-muted">{item.satuan || '-'}</td>

- <td className="rv-td rv-td-sticky rv-td-center rv-td-mono">{item.threshold ?? '-'}</td>
+ <td className="rv-td rv-td-center rv-td-mono">{item.threshold ?? '-'}</td>
```

**Perlu di-update di SEMUA `<th>` dan `<td>` yang saat ini pakai `rv-th-sticky` / `rv-td-sticky`** — termasuk semua type-specific table headers (regular, boolean, date, expiry, text).

---

## 5. Perubahan 3: Sistem Tipe Input Kombinatorial

### 5.1 Prinsip

> Setiap tipe input membawa **karakteristik input UI** dan **struktur kolom laporan** masing-masing.
> Jika item punya 2+ tipe, UI dan laporan menampilkan **semua** karakteristik tersebut.
> **Status = primary type saja** (tipe pertama dalam string kombinasi).

### 5.2 Karakteristik per Tipe

#### Input UI Karakteristik

| Tipe | Input Fields | Badge Status |
|---|---|---|
| **dual** | S1 (number), S2 (number), Total (auto) | Threshold-based |
| **single** | S1 (number), Total (auto) — S2 hidden | Threshold-based |
| **boolean** | Status Isi (dropdown: Penuh/Dipakai/Habis) | Status Isi badge |
| **date** | Tgl Refill (date), Tgl Pakai (date) | Threshold-based |
| **expiry** | Tgl Kedaluwarsa (date) | Threshold-based |
| **text** | Keterangan (textarea) | — |

#### Report Kolom Karakteristik

| Tipe | Kolom Laporan | Status Logic |
|---|---|---|
| **dual** | S1 Prev, S2 Prev, Tot Prev, S1, S2, Total, Pemakaian, Status, Keterangan | `total <= threshold` → KRITIS |
| **single** | S1 Prev, Tot Prev, S1, Total, Pemakaian, Status, Keterangan | `total <= threshold` → KRITIS |
| **boolean** | Nilai Saat Ini, Status Isi, Tgl Isi, Tgl Pakai, Keterangan | Habis/Dipakai/Penuh |
| **date** | Tgl Tercatat, Hari Berlalu, Status, Keterangan | `hariBerlalu >= threshold` → KRITIS |
| **expiry** | Tgl Kedaluwarsa, Sisa Hari, Status, Keterangan | `sisaHari <= threshold` → KRITIS |
| **text** | Keterangan | — |

#### Status = Primary Type

| Kombinasi | Primary | Status Logic |
|---|---|---|
| `dual` | dual | Threshold |
| `single` | single | Threshold |
| `boolean` | boolean | Status Isi |
| `date` | date | Hari Berlalu |
| `expiry` | expiry | Sisa Hari |
| `text` | text | — |
| `dual,boolean` | dual | Threshold |
| `dual,date` | dual | Threshold |
| `boolean,date` | boolean | Status Isi |
| `single,boolean` | single | Threshold |
| `single,date` | single | Threshold |
| `dual,boolean,date` | dual | Threshold |

---

## 6. Spec Tipe Input per Tipe

### 6.1 Dual

**Input UI:**
```
┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ S1 Prev │ S2 Prev │ Tot Prev│  S1     │  S2     │  Tot    │
│ (ro)    │ (ro)    │ (ro)    │ (input) │ (input) │ (auto)  │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```
- S1, S2: input type number
- Tot = S1 + S2 (otomatis)
- Status badge: `total <= threshold` → KRITIS (merah), `total <= threshold*2` → HAMPIR HABIS (kuning), else AMAN (hijau)

**Report:**
```
| No | Nama | Satuan | Thresh | S1 Prev | S2 Prev | Tot Prev | S1 | S2 | Total | Pemakaian | Status | Keterangan |
```

### 6.2 Single

**Input UI:**
```
┌─────────┬─────────┬─────────┬─────────┐
│ S1 Prev │ Tot Prev│  S1     │  Tot    │
│ (ro)    │ (ro)    │ (input) │ (auto)  │
└─────────┴─────────┴─────────┴─────────┘
```
- S1: input type number
- S2: **hidden**
- Tot = S1
- Status badge: same as dual

**Report:**
```
| No | Nama | Satuan | Thresh | S1 Prev | S2 Prev | Tot Prev | S1 | S2 | Total | Pemakaian | Status | Keterangan |
```
- S1 Prev: diisi, S2 Prev: kosong, Tot Prev: diisi
- S1: diisi, S2: kosong, Total: = S1
- Atau: kolom E-I di-merge (single total)

### 6.3 Boolean

**Input UI:**
```
┌─────────────────┬─────────────────┐
│ Status Sebelumnya│ Nilai Saat Ini  │
│ (ro: Penuh/...) │ (select dropdown)│
└─────────────────┴─────────────────┘
```
- Dropdown options: Penuh, Dipakai, Habis
- Badge: Penuh → hijau, Dipakai → kuning, Habis → merah
- **Tidak ada** S1/S2 input

**Report:**
```
| No | Nama | Satuan | Thresh | Nilai Saat Ini | Status Isi | Tgl Isi | Tgl Pakai | Keterangan |
```
- Status Isi: teks Habis/Dipakai/Penuh (bukan threshold)

### 6.4 Date

**Input UI:**
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Refill Sebelumnya│ Pakai Sebelumnya│ Tgl Refill      │ Tgl Pakai       │
│ (ro)            │ (ro)            │ (date input)    │ (date input)    │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```
- Tgl Refill, Tgl Pakai: input type date
- **Tidak ada** S1/S2 input

**Report:**
```
| No | Nama | Satuan | Thresh (Hari) | Tgl Tercatat | Hari Berlalu | Status | Keterangan |
```
- Status: `hariBerlalu >= threshold` → KRITIS, `>= 70%` → HAMPIR HABIS

### 6.5 Expiry

**Input UI:**
```
┌─────────────────┬─────────────────┐
│ Exp Sebelumnya  │ Tgl Kedaluwarsa │
│ (ro)            │ (date input)    │
└─────────────────┴─────────────────┘
```
- Tgl Kedaluwarsa: input type date
- **Tidak ada** S1/S2 input

**Report:**
```
| No | Nama | Satuan | Tgl Kedaluwarsa | Sisa Hari | Status | Keterangan |
```
- Status: `sisaHari <= threshold` → KRITIS, else AMAN

### 6.6 Text

**Input UI:**
```
┌───────────────────────────────────┐
│ Keterangan (textarea)             │
└───────────────────────────────────┘
```
- Keterangan: textarea
- **Tidak ada** S1/S2 input, **tidak ada** status badge

**Report:**
```
| No | Nama | Satuan | Keterangan |
```
- Tidak ada Status

---

## 7. Kombinasi yang Didukung

### 7.1 Semua Kombinasi Valid (2-tipe)

| Kombinasi | Input UI Gabungan | Report Kolom Gabungan |
|---|---|---|
| `dual,boolean` | S1+S2+Status dropdown | Dual cols + Boolean cols (Status Isi) |
| `dual,date` | S1+S2+Tgl Refill+Tgl Pakai | Dual cols + Date cols |
| `dual,expiry` | S1+S2+Tgl Kedaluwarsa | Dual cols + Expiry cols |
| `dual,text` | S1+S2+Keterangan | Dual cols + Keterangan |
| `single,boolean` | S1+Status dropdown | Single cols + Boolean cols |
| `single,date` | S1+Tgl Refill+Tgl Pakai | Single cols + Date cols |
| `single,expiry` | S1+Tgl Kedaluwarsa | Single cols + Expiry cols |
| `single,text` | S1+Keterangan | Single cols + Keterangan |
| `boolean,date` | Status dropdown+Tgl Refill+Tgl Pakai | Boolean cols + Date cols |
| `boolean,expiry` | Status dropdown+Tgl Kedaluwarsa | Boolean cols + Expiry cols |
| `boolean,text` | Status dropdown+Keterangan | Boolean cols + Keterangan |
| `date,expiry` | Tgl Refill+Tgl Pakai+Tgl Kedaluwarsa | Date cols + Expiry cols |
| `date,text` | Tgl Refill+Tgl Pakai+Keterangan | Date cols + Keterangan |
| `text,expiry` | Keterangan+Tgl Kedaluwarsa | Expiry cols + Keterangan |

### 7.2 Kombinasi 3-tipe

| Kombinasi | Input UI Gabungan | Report Kolom Gabungan |
|---|---|---|
| `dual,boolean,date` | S1+S2+Status dropdown+Tgl Refill+Tgl Pakai | Dual+Boolean+Date cols |
| `dual,boolean,expiry` | S1+S2+Status dropdown+Tgl Kedaluwarsa | Dual+Boolean+Expiry cols |
| `single,boolean,date` | S1+Status dropdown+Tgl Refill+Tgl Pakai | Single+Boolean+Date cols |

### 7.3 Tidak Valid

| Kombinasi | Alasan |
|---|---|
| `dual,single` | Mutual exclusive — `dual` menang, `single` diabaikan |
| `single,dual` | Sama — `dual` menang |

---

## 8. Detail Implementasi per File

### 8.1 `lib/domain/master-item-service.ts`

**Baris 88 — Expand whitelist:**
```typescript
// Saat ini:
const allowed = ['dual', 'single', 'boolean', 'date', 'text', 'expiry', 'boolean,date'];

// Sesudah: generate semua kombinasi valid
const BASE_TYPES = ['dual', 'single', 'boolean', 'date', 'text', 'expiry'];
const allowed = [
  ...BASE_TYPES,
  // 2-type combos (excluding dual+single)
  ...BASE_TYPES.flatMap((a) =>
    BASE_TYPES.filter((b) => b !== a && !(a === 'dual' && b === 'single') && !(a === 'single' && b === 'dual'))
      .map((b) => `${a},${b}`)
  ),
  // 3-type combo (most common)
  'dual,boolean,date',
];
```

**Baris 90 — Normalisasi:**
```typescript
// Saat ini: strict equality
const normalized = allowed.includes(val) ? val : 'dual';

// Sesudah: normalize dulu (lowercase, trim, sort, dedupe), lalu validate
const parts = val.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
// Remove duplicates, resolve dual/single conflict
const unique = [...new Set(parts)];
const hasDual = unique.includes('dual');
const hasSingle = unique.includes('single');
const cleaned = unique.filter(t => !(t === 'single' && hasDual));
const normalized = cleaned.join(',');
// Validate against allowed list
const finalVal = allowed.includes(normalized) ? normalized : 'dual';
```

### 8.2 `app/master-item/page.tsx`

**Baris 52-60 — Update TIPE_OPTIONS:**
```typescript
const TIPE_OPTIONS = [
  // Single types
  { value: 'dual', label: 'Dual (S1+S2)', group: 'Tunggal' },
  { value: 'single', label: 'Single (S1)', group: 'Tunggal' },
  { value: 'boolean', label: 'Boolean (Status Isi)', group: 'Tunggal' },
  { value: 'date', label: 'Date (Tgl Refill/Pakai)', group: 'Tunggal' },
  { value: 'text', label: 'Text (Keterangan)', group: 'Tunggal' },
  { value: 'expiry', label: 'Expiry (Tgl Kedaluwarsa)', group: 'Tunggal' },
  // 2-type combos
  { value: 'dual,boolean', label: 'Dual + Boolean', group: 'Kombinasi' },
  { value: 'dual,date', label: 'Dual + Date', group: 'Kombinasi' },
  { value: 'dual,expiry', label: 'Dual + Expiry', group: 'Kombinasi' },
  { value: 'single,boolean', label: 'Single + Boolean', group: 'Kombinasi' },
  { value: 'single,date', label: 'Single + Date', group: 'Kombinasi' },
  { value: 'boolean,date', label: 'Boolean + Date', group: 'Kombinasi' },
  { value: 'boolean,expiry', label: 'Boolean + Expiry', group: 'Kombinasi' },
  { value: 'dual,boolean,date', label: 'Dual + Boolean + Date', group: 'Kombinasi 3' },
];
```

**Baris 62-70 — Update tipeBadgeColor:**
```typescript
function tipeBadgeColor(t?: string) {
  if (!t) return 'bg-base-200 text-base-content/60';
  // Compound: badge pertama dari primary type
  const primary = t.split(',')[0].trim();
  if (primary === 'boolean') return 'bg-info/15 text-info';
  if (primary === 'date') return 'bg-secondary/15 text-secondary';
  if (primary === 'expiry') return 'bg-error/15 text-error';
  if (primary === 'text') return 'bg-accent/15 text-accent';
  return 'bg-base-200 text-base-content/60'; // dual, single
}
```

### 8.3 `app/so/input/page.tsx`

**Baris 329-332 — Type detection (TIDAK BERUBAH):**
```typescript
const tipeInput: InputTipe[] = parseTipeInput(item.Tipe_Input);
const isDual = hasTipe(tipeInput, 'dual');
const isBoolean = hasTipe(tipeInput, 'boolean');
const isDate = hasTipe(tipeInput, 'date');
```

**Tambah:**
```typescript
const isSingle = hasTipe(tipeInput, 'single');
const isExpiry = hasTipe(tipeInput, 'expiry');
const isText = hasTipe(tipeInput, 'text');
const primary = tipeInput[0]; // primary type untuk status badge
```

**Baris 357-373 — Status badge:**
```diff
- {isBoolean ? (
+ {primary === 'boolean' ? (
    // boolean status badge (Penuh/Dipakai/Habis)
  ) : (
    // threshold-based badge
  )}
```

**Baris 376-451 — Input blocks (UBAH dari exclusive → additive):**
```diff
- {(isBoolean || isDate) && (
-   <div className={`grid grid-cols-2 gap-1 ${...}`}>
-     {isBoolean && (...)}
-     {isDate && (...)}
-   </div>
- )}
- {!isBoolean && !isDate && (
-   <div className={`grid gap-1 ${isDual ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-2 sm:grid-cols-4'}`}>
-     // S1/S2 inputs
-   </div>
- )}

+ {/* Numeric block: muncul jika ada dual ATAU single */}
+ {(isDual || isSingle) && (
+   <div className={`grid gap-1 ${isDual ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-2 sm:grid-cols-4'}`}>
+     {/* S1 prev, S2 prev (if isDual), Tot prev, S1 input, S2 input (if isDual), Tot */}
+   </div>
+ )}
+
+ {/* Boolean block: muncul jika ada boolean */}
+ {isBoolean && (
+   <div className="grid grid-cols-2 gap-1 sm:grid-cols-2">
+     {/* Status Sebelumnya, Nilai Saat Ini dropdown */}
+   </div>
+ )}
+
+ {/* Date block: muncul jika ada date */}
+ {isDate && (
+   <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
+     {/* Refill Sebelumnya, Tgl Refill, Pakai Sebelumnya, Tgl Pakai */}
+   </div>
+ )}
+
+ {/* Expiry block: muncul jika ada expiry — NEW */}
+ {isExpiry && (
+   <div className="grid grid-cols-2 gap-1 sm:grid-cols-2">
+     {/* Exp Sebelumnya, Tgl Kedaluwarsa input */}
+   </div>
+ )}
+
+ {/* Text block: muncul jika ada text — NEW */}
+ {isText && (
+   <div className="grid grid-cols-1 gap-1">
+     {/* Keterangan textarea */}
+   </div>
+ )}
```

### 8.4 `lib/domain/laporan-view.ts`

**Baris 72-81 — getGroup() → getGroups():**
```diff
- function getGroup(tipeInput: string): InputTypeGroup {
-   const t = (tipeInput || '').toLowerCase();
-   if (t.includes('boolean')) return 'boolean';
-   if (t.includes('single')) return 'single';
-   if (t.includes('date')) return 'date';
-   if (t.includes('expiry')) return 'expiry';
-   if (t.includes('text')) return 'text';
-   if (t.includes('utilitas')) return 'utilitas';
-   return 'dual';
- }

+ function getGroups(tipeInput: string): InputTypeGroup[] {
+   const parts = (tipeInput || '').toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
+   if (parts.length === 0) return ['dual'];
+   const groups: InputTypeGroup[] = [];
+   // dual/single: mutually exclusive
+   if (parts.includes('dual')) groups.push('dual');
+   else if (parts.includes('single')) groups.push('single');
+   // additive types
+   if (parts.includes('boolean')) groups.push('boolean');
+   if (parts.includes('date')) groups.push('date');
+   if (parts.includes('expiry')) groups.push('expiry');
+   if (parts.includes('text')) groups.push('text');
+   return groups.length > 0 ? groups : ['dual'];
+ }
```

**ViewItem interface:**
```diff
- group: InputTypeGroup;
+ groups: InputTypeGroup[];
```

**Status computation:**
```diff
- // Saat ini: status berdasarkan group
- if (group === 'dual' || group === 'single') { ... }
- else if (group === 'boolean') { ... }

+ // Sesudah: status berdasarkan primary type (groups[0])
+ const primary = groups[0];
+ if (primary === 'dual' || primary === 'single') { ... }
+ else if (primary === 'boolean') { ... }
```

**subGroupItems():**
```diff
- function subGroupItems(items: ViewItem[]): SubGroup[] {
-   // ...assigns each item to ONE group
- }

+ function subGroupItems(items: ViewItem[]): SubGroup[] {
+   // Item bisa masuk ke MULTIPLE sub-groups
+   const map = new Map<InputTypeGroup, ViewItem[]>();
+   for (const it of items) {
+     for (const g of it.groups) {
+       if (!map.has(g)) map.set(g, []);
+       map.get(g)!.push(it);
+     }
+   }
+   return typeOrder.filter((t) => map.has(t)).map((t) => ({ type: t, items: map.get(t)! }));
+ }
```

### 8.5 `lib/google/template-xlsx.ts`

**getItemType() → getItemTypes():**
```diff
- function getItemType(it: XlsxItem): ReportItemType {
-   const types = getReportTypes(it.tipeInput);
-   return types[0];
- }

+ function getItemTypes(it: XlsxItem): ReportItemType[] {
+   return getReportTypes(it.tipeInput);
+ }
```

**Grouping (baris 303-319):**
```diff
- areaItems.forEach((it) => {
-   const primary = getItemType(it);
-   // ...route to ONE sub-group
- });

+ areaItems.forEach((it) => {
+   const types = getItemTypes(it);
+   types.forEach((type) => {
+     if (type === 'dual' || type === 'single') {
+       ensureSub('regular'); subGroups.get('regular')!.push(it);
+     } else if (type === 'boolean') {
+       ensureSub('utilgas'); subGroups.get('utilgas')!.push(it);
+     } else if (type === 'date') {
+       ensureSub('date'); subGroups.get('date')!.push(it);
+     } else if (type === 'text') {
+       ensureSub('text'); subGroups.get('text')!.push(it);
+     } else if (type === 'expiry') {
+       ensureSub('expiry'); subGroups.get('expiry')!.push(it);
+     }
+   });
+ });
```

### 8.6 `lib/domain/report-item-type.ts`

**Tidak perlu perubahan** — `getReportTypes()` sudah benar. Hanya perlu update comment.

### 8.7 `lib/domain/so.ts`

**Tidak perlu perubahan** — `parseTipeInput()` dan `hasTipe()` sudah benar.

---

## 9. Urutan Pengerjaan

| # | Task | File | Estimasi |
|---|---|---|---|
| 1 | Freeze columns | `view.css`, `page.tsx` | 15 menit |
| 2 | Hapus auto-fill | `app/so/input/page.tsx` | 30 menit |
| 3 | Tambah validasi wajib isi | `app/so/input/page.tsx` | 30 menit |
| 4 | Expand whitelist | `lib/domain/master-item-service.ts` | 15 menit |
| 5 | Update dropdown master-item | `app/master-item/page.tsx` | 20 menit |
| 6 | SO Input multi-block rendering | `app/so/input/page.tsx` | 60 menit |
| 7 | Web view multi-group | `lib/domain/laporan-view.ts`, `page.tsx` | 45 menit |
| 8 | XLSX multi-table | `lib/google/template-xlsx.ts` | 60 menit |

**Total estimasi:** ~4.5 jam

---

## 10. Testing & Verification

### Automated
```bash
npm run lint    # 0 error, baseline warnings
npm test        # 21/21 pass
npm run build   # success
```

### Manual Testing Checklist

#### Auto-fill Removal
- [ ] Input SO tanpa isi S1 → submit gagal dengan error "S1 wajib diisi"
- [ ] Input SO isi S1=0, S2=0 → submit berhasil, laporan menampilkan 0
- [ ] Input SO dengan data sebelumnya → data sebelumnya TIDAK auto-fill ke input

#### Tipe Input Kombinatorial
- [ ] Buat item dengan tipe `dual,boolean` di Master Item
- [ ] Buka SO Input → item tampilkan S1+S2+Status dropdown (3 blok)
- [ ] Isi S1=10, S2=5, Status=Penuh → submit
- [ ] Buka laporan → item tampil di tabel regular (dual) DAN tabel boolean
- [ ] Status di tabel regular = threshold-based (bukan Habis/Dipakai/Penuh)
- [ ] Status Isi di tabel boolean = Penuh

#### Freeze Columns
- [ ] Buka laporan web view di browser
- [ ] Scroll horizontal → kolom No, Nama Barang, Satuan tetap terlihat (freeze)
- [ ] Threshold kolom ikut scroll (tidak freeze)
- [ ] Di mobile → card layout tidak freeze (hanya desktop table)

#### Compound Types Lengkap
- [ ] `single,date` → S1+Tgl Refill+Tgl Pakai di input
- [ ] `boolean,expiry` → Status dropdown+Tgl Kedaluwarsa di input
- [ ] `dual,boolean,date` → S1+S2+Status+Tgl Refill+Tgl Pakai di input
- [ ] Semua kombinasi tampil benar di laporan

---

## Appendix: File Change Summary

| File | Perubahan |
|---|---|
| `app/so/input/page.tsx` | Hapus auto-fill, tambah validasi, multi-block rendering |
| `app/laporan/view/[laporanId]/page.tsx` | Freeze columns (No/Nama/Satuan) |
| `app/laporan/view/[laporanId]/view.css` | Tambah freeze CSS classes |
| `lib/domain/laporan-view.ts` | `getGroup()` → `getGroups()`, multi-group, primary status |
| `lib/domain/master-item-service.ts` | Expand whitelist ke semua kombinasi |
| `app/master-item/page.tsx` | Update dropdown + badge |
| `lib/google/template-xlsx.ts` | `getItemType()` → `getItemTypes()`, multi-table render |
| `lib/domain/report-item-type.ts` | Update comment (no code change) |
| `lib/domain/so.ts` | No change |
