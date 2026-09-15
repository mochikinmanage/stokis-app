# Phase 0 - Baseline & Safety

Dokumentasi keadaan sistem sebelum refactor migrasi SO (per `plan-perbaikan.md`).

Referensi eksekusi: `docs/perbaikan/CHECKLIST.md`.
Commit baseline terakhir (sebelum perubahan ini): `9071ed0`.

---

## 1. Struktur Spreadsheet per Cabang

Template dibuat oleh `apps-script/SetupPhase1.js` (`runSetupPhase1`).

### `Master_Item`

```
Item_ID | Nama_Barang | Area | Satuan | Konversi_Isi | Konversi_Keterangan | Threshold | Aktif | Tanggal_Dibuat
```

### `SO_Transaksi`

```
Transaksi_ID | Timestamp | Tanggal_Operasional | Shift | Item_ID | Nama_Barang | Area | Step1 | Step2 | Total | Petugas | Sesi_ID | Keterangan
```

*Header template asli hanya 12 kolom; kolom ke-13 `Keterangan` ditambahkan oleh `appendRow` di `submitSO`.*

### `Laporan_PDF`

```
Laporan_ID | Sesi_ID | Tanggal_Operasional | Shift | Petugas | Waktu_Dibuat | Link_PDF | Jumlah_Kritis | Jumlah_Hampir_Habis | Status_Kirim_WA
```

### `Petugas`

```
Petugas_ID | Nama | Nomor_WA | Aktif
```

### `Settings`

```
Key | Value
```

Kunci: `Daftar_Shift`, `Kelipatan_Threshold_Hampir_Habis`, `Daftar_Area`.

---

## 2. Registry (satu spreadsheet global)

- `Daftar_Cabang`: `Cabang_ID | Nama_Cabang | Alamat | Spreadsheet_ID | Folder_Drive_ID | PIC_Nama | Nomor_WA_Cabang | Aktif | Tanggal_Dibuat`
- `Template_Referensi`: `Template_Spreadsheet_ID | Template_Versi | Terakhir_Diperbarui`
- `Settings_Global`: `Key | Value` (termasuk `Folder_Drive_Induk`)

Script Properties yang dipakai:
- `REGISTRY_SPREADSHEET_ID`
- `STOKIS_API_KEY`
- `FOLDER_DRIVE_INDUK`

---

## 3. Endpoint Next.js → Apps Script

Handler tunggal: `Code.js` `doGet/doPost` → `handleRequest_`.

Request JSON:

```json
{
  "x-api-key": "<STOKIS_API_KEY>",
  "action": "<nama-action>",
  "cabangId": "CBG001",
  "payload": { }
}
```

Response standar (saat ini):

```json
{ "success": true, "data": { } }
{ "success": false, "error": { "code": "...", "message": "..." } }
```

Daftar action (definisi di `Code.js`):

| Action | Fitur | File GAS |
|--------|-------|----------|
| `getCabangList`, `createCabang`, `updateCabang`, `setCabangActive` | Cabang | `Cabang.js` / `Registry.js` |
| `getMasterItems`, `addItem`, `updateThreshold`, `setItemActive` | Master item | `MasterItem.js` |
| `getPetugasList`, `addPetugas`, `updatePetugas`, `setPetugasActive` | Petugas | `Petugas.js` |
| `submitSO`, `getPreviousSO` | SO | `SO.js` + `PDF.js` |
| `searchLaporan`, `getShareWhatsAppLink`, `updateStatusKirimWA` | Laporan | `Laporan.js` |
| `getDashboardHarian`, `getDashboardMingguan` | Dashboard | `Dashboard.js` |

> Catatan audit: action `login` yang dipanggil `app/api/auth/login/route.ts` **tidak terdefinisi** di Apps Script. Akan bernilai `ACTION_TIDAK_DIKENAL`.

---

## 4. Payload SO (saat ini)

Dikirim dari `app/so/input/page.tsx` → `POST /api/so` → `submitSO`.

```json
{
  "cabangId": "CBG001",
  "tanggalOperasional": "2026-08-29",
  "shift": "Opening",
  "petugas": "Nama Petugas",
  "items": [
    {
      "itemId": "ITM00001",
      "step1": 3,
      "step2": 1,
      "keterangan": ""
    }
  ]
}
```

Catatan: saat ini `items` dikirim dari frontend beserta field ekstra (`namaBarang`, `threshold`, `prevStep1`, dst.) yang diabaikan backend.

## 5. Format Response SO (saat ini)

```json
{ "success": true, "data": { "sesiId": "SES1A2B3C4D", "laporanId": "RPT00007" } }
```

Tidak ada `rows_written`, tidak ada `status`, tidak ada idempotency.

---

## 6. Baseline Performance / Pola I/O

Sumber: `rg "appendRow|getDataRange|getLastRow|setValue|getValues" apps-script/`

- `SO.js submitSO`: **1× `appendRow()` per item** di dalam `items.forEach` → terburuk untuk skenario 130 item (P0).
  - `Transaksi_ID` berbasis `getLastRow()` → rawan konflik concurrency (P0).
- `PDF.js generatePDF_`: `appendRow()` tunggal di `Laporan_PDF`; `Laporan_ID` berbasis `getLastRow()`.
- `Cabang.js createCabang`: `Cabang_ID` berbasis `getLastRow()`; `appendRow()` tunggal di `Daftar_Cabang`.
- `MasterItem.js addItem`: `Item_ID` berbasis `getLastRow()`; `appendRow()` tunggal.
- `Petugas.js addPetugas`: `Petugas_ID` berbasis `getLastRow()`; `appendRow()` tunggal.
- `getPreviousSO`: `getDataRange()` full-sheet scan (di-loop saat ini dipanggil dari dalam `submitSO`).
- `Cabang/MasterItem/Petugas/Laporan`: `update*`/`set*Active` memakai `getDataRange()` + `setValue()` per kolom (1 sel) — bukan loop.
- Dashboard: full-sheet read lalu filter in-memory (pola "1 read → filter" — dapat diterima; optimasi lanjutan P2).

## 7. Baseline Versi

- Aplikasi: Next.js 16.3.3, React 19.2.8, TypeScript 5.
- Apps Script runtime: V8 (`appsscript.json`).
- Test data 130 item: lihat `scripts/so-bulk-sample.json` (dibuat di Phase 13) / seed `seed-data.json`.