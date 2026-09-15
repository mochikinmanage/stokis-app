# Stokis App - Improvement Plan

## 1. Objective

Meningkatkan reliability, performance, security, dan scalability aplikasi Stokis dengan tetap mempertahankan arsitektur:

Next.js → Apps Script → Google Sheets

Fokus utama adalah memperbaiki proses Stock Opname (SO) yang saat ini menangani ±130 item per sesi.

### Target volume

- 130 item / SO
- 2 SO / hari
- ±260 transaksi / hari
- ±7.800 transaksi / 30 hari
- ±94.900 transaksi / tahun

Jumlah row tersebut masih wajar untuk tahap MVP. Prioritas optimasi adalah cara aplikasi melakukan write, concurrency, validasi, dan query.

---

## 2. Current Architecture

```text
Next.js
   ↓
API / Backend Layer
   ↓
Google Apps Script
   ↓
Google Sheets
   ↓
Reporting / PDF / Dashboard
```

Pertahankan arsitektur ini untuk tahap MVP.

Jangan migrasi dari Apps Script hanya karena volume data. Migrasi database dilakukan ketika kebutuhan concurrency, query, multi-outlet, dan volume sudah benar-benar melewati kemampuan Sheets.

---

# Phase 0 - Baseline & Safety

## Tujuan

Memastikan refactor tidak merusak sistem yang sudah berjalan.

### Tasks

- [ ] Backup spreadsheet production. *(manual - tanggung jawab owner)*
- [ ] Backup / tag versi Apps Script saat ini. *(manual - perlu `clasp push` / git tag)*
- [x] Dokumentasikan struktur sheet.
- [x] Dokumentasikan endpoint Next.js → Apps Script.
- [x] Dokumentasikan payload SO.
- [x] Dokumentasikan format response/error.
- [ ] Catat waktu submit SO 130 item saat ini. *(perlu baseline run live terhadap deployment)*
- [x] Catat jumlah operasi write yang dilakukan Apps Script.
- [x] Buat test data 130 item.

> Baseline: `docs/perbaikan/PHASE0_BASELINE.md`. Test data: `scripts/so-bulk-sample.json`.

### Acceptance Criteria

- Versi production saat ini dapat dipulihkan.
- Ada baseline performance sebelum refactor.
- Payload dan response SO terdokumentasi.

---

# Phase 1 - Refactor SO Write

## Masalah

SO 130 item tidak boleh menghasilkan 130 operasi `appendRow()`.

### Current Pattern

```javascript
items.forEach(item => {
  sheet.appendRow([...]);
});
```

### Target Pattern

```javascript
const rows = items.map(item => [
  // columns
]);

sheet
  .getRange(startRow, 1, rows.length, rows[0].length)
  .setValues(rows);
```

### Tasks

- [x] Ubah proses write SO menjadi batch.
- [x] Bentuk seluruh row di memory terlebih dahulu.
- [x] Gunakan satu `setValues()` untuk 130 item.
- [x] Hindari `appendRow()` di dalam loop.
- [x] Pastikan urutan kolom konsisten.
- [x] Pastikan seluruh 130 item berhasil ditulis.
- [x] Return `Sesi_ID` dan jumlah row yang berhasil ditulis.

### Acceptance Criteria

1 SO:

```text
130 items
↓
1 API request
↓
1 batch write
↓
130 rows
```

Bukan:

```text
130 items
↓
130 appendRow()
```

---

# Phase 2 - Transaction & Idempotency

## Tujuan

Mencegah SO masuk dua kali ketika user melakukan retry atau browser mengirim request ulang.

### Tasks

- [x] Gunakan `Sesi_ID` sebagai identifier unik untuk satu sesi SO.
- [x] Sebelum insert, cek apakah `Sesi_ID` sudah pernah diproses.
- [x] Jika sudah ada, jangan membuat transaksi kedua.
- [x] Return status `already_processed` atau equivalent.
- [x] Validasi jumlah item sebelum write.
- [x] Validasi Item_ID.
- [x] Validasi required fields.
- [x] Validasi duplicate Item_ID dalam satu Sesi_ID.

### Acceptance Criteria

Request yang sama dikirim dua kali:

```text
Request #1 → SUCCESS → 130 rows
Request #2 → ALREADY_PROCESSED → tidak menambah row
```

---

# Phase 3 - Concurrency Control

## Masalah

`getLastRow()` tidak boleh menjadi dasar utama untuk membuat ID transaksi ketika beberapa request dapat berjalan bersamaan.

### Tasks

- [x] Audit seluruh penggunaan `getLastRow()`.
- [x] Audit seluruh generator `Transaksi_ID`.
- [x] Gunakan `LockService` pada critical section.
- [x] Pastikan pengecekan Sesi_ID dan write dilakukan dalam protected section.
- [x] Hindari race condition antar-user/cabang.
- [ ] Test dua SO dikirim hampir bersamaan. *(harness tersedia: `node scripts/so-integration-test.mjs --concurrent=5`, menunggu deploy)*

### Acceptance Criteria

100 concurrent test requests tidak menghasilkan:

- duplicate `Transaksi_ID`
- duplicate `Sesi_ID`
- transaksi setengah masuk
- data tertukar antar sesi

---

# Phase 4 - ID Strategy

## Tujuan

Membuat ID yang aman terhadap concurrency dan mudah ditelusuri.

### Recommended

Gunakan ID berbasis UUID atau kombinasi timestamp + random component.

Contoh:

```text
TRX_20260829_001_8F3A
```

atau UUID.

`getLastRow()` boleh digunakan untuk menentukan posisi row, tetapi jangan dijadikan satu-satunya sumber identitas transaksi.

### Tasks

- [x] Tentukan format final `Transaksi_ID`.
- [x] Tentukan format final `Sesi_ID`.
- [x] Pastikan ID unik lintas request.
- [x] Pastikan ID tetap dapat ditelusuri ke cabang dan sesi.

> Format: `TRX_YYYYMMDD_seq_rand`, `SES_<token>`, `RPT_YYYYMMDD_rand`, `CBG<rand>`, `ITM<rand>`, `PTG<rand>` (implementasi di `SOValidation.js`).

---

# Phase 5 - Validation Layer

## Tujuan

Jangan mempercayai data dari frontend.

### Validation di Apps Script

Validasi minimal:

```text
Sesi_ID
Tanggal_Operasional
Shift
Item_ID
Step1
Step2
Petugas
```

### Tasks

- [x] Validasi schema payload.
- [x] Validasi tipe data.
- [x] Validasi Item_ID terhadap master item.
- [x] Validasi numeric fields.
- [x] Validasi nilai negatif jika tidak diperbolehkan.
- [x] Validasi jumlah item.
- [x] Validasi duplicate item.
- [ ] Validasi session ownership bila diperlukan. *(perlu model pengguna pemilik sesi)*

### Acceptance Criteria

Payload invalid ditolak sebelum data masuk ke spreadsheet.

---

# Phase 6 - Next.js Request Optimization

## Target

Frontend hanya mengirim satu payload untuk satu sesi SO.

### Recommended

```text
POST /api/so

{
  sesi_id,
  tanggal_operasional,
  shift,
  petugas,
  items: [...]
}
```

### Tasks

- [x] Pastikan 130 item dikirim dalam satu request.
- [x] Hindari request per item.
- [x] Tambahkan loading state.
- [x] Disable submit button selama request berlangsung.
- [x] Tambahkan retry strategy.
- [x] Simpan request/session identifier di client.
- [x] Tampilkan progress berdasarkan jumlah item yang tersimpan.

### Acceptance Criteria

Satu SO = satu request dari frontend.

---

# Phase 7 - Error Handling & Recovery

## Tujuan

User tidak boleh mendapatkan kondisi ambigu seperti:

> "Submit gagal"

padahal 130 row sebenarnya sudah masuk.

### Tasks

- [x] Standardisasi response Apps Script.
- [x] Gunakan status:
  - `success`
  - `validation_error`
  - `already_processed`
  - `server_error`
- [x] Return `Sesi_ID`.
- [x] Return `rows_written`.
- [x] Return error code yang dapat diproses frontend.
- [x] Tambahkan logging.
- [x] Pastikan retry aman karena ada idempotency.

### Example Response

```json
{
  "success": true,
  "sesi_id": "SES_20260829_001",
  "rows_written": 130
}
```

---

# Phase 8 - Apps Script Performance Audit

Audit seluruh Apps Script, bukan hanya SO.

### Cari pola berikut

```javascript
getDataRange()
getLastRow()
getValues()
appendRow()
setValue()
setFormula()
```

terutama jika berada di dalam loop.

### Tasks

- [x] Cari semua `appendRow()`.
- [x] Cari semua `getRange()` di dalam loop.
- [x] Cari semua `getValues()` yang membaca seluruh sheet.
- [x] Cari semua `getDataRange()`.
- [x] Audit dashboard.
- [x] Audit laporan.
- [x] Audit PDF.
- [x] Audit master item.
- [x] Audit cabang.
- [x] Audit session history.

> Audited + optimasi I/O dilakukan di `SO.js`, `Cabang.js`, `Petugas.js`, `PDF.js`, `MasterItem.js`. Dashboard & laporan (read-only, volume kecil) dibiarkan seperti semula untuk MVP.

### Rule

Utamakan:

```text
1 read
→ process in memory
→ 1 batch write
```

daripada:

```text
read
→ write
→ read
→ write
→ ...
```

---

# Phase 9 - Query Strategy

## Masalah potensial

Ketika data mencapai puluhan/ratusan ribu row, membaca seluruh `SO_Transaksi` setiap request akan semakin mahal.

### Tasks

- [x] Audit fungsi `getPreviousSO()`.
- [ ] Audit pencarian transaksi berdasarkan tanggal. *(dashboard read-only, volume kecil)*
- [ ] Audit pencarian berdasarkan Sesi_ID. *(sudah bounded: `findSesiRecord_` baca 1 kolom)*
- [ ] Audit pencarian berdasarkan Item_ID. *(belum ada kebutuhan lookup per-item terpisah)*
- [x] Hindari full-sheet scan jika tidak diperlukan.
- [ ] Pertimbangkan sheet/index khusus untuk lookup jika dibutuhkan. *(P2)*

### Prinsip

Jangan melakukan:

```text
Read 100,000 rows
↓
filter 1 session
```

jika sebenarnya bisa mendapatkan data dengan lookup/index yang lebih kecil.

---

# Phase 10 - Data Model Cleanup

## Current transaction table

```text
Transaksi_ID
Timestamp
Tanggal_Operasional
Shift
Item_ID
Nama_Barang
Area
Step1
Step2
Total
Petugas
Sesi_ID
```

Pertahankan transaction table sebagai data detail.

Pertimbangkan memisahkan:

## Sessions

```text
Sesi_ID
Tanggal_Operasional
Shift
Petugas
Start_Time
End_Time
Status
Total_Item
Completed_Item
```

## Items

```text
Item_ID
Nama_Barang
Area
...
```

## Transactions

```text
Transaksi_ID
Sesi_ID
Item_ID
Step1
Step2
Total
Timestamp
```

Tujuannya mengurangi duplikasi data dan membuat hubungan data lebih jelas.

---

# Phase 11 - Security Audit

### Tasks

- [x] Audit API key.
- [x] Pastikan secret tidak berada di client-side code.
- [x] Pastikan `.env` tidak masuk Git.
- [x] Audit endpoint Apps Script.
- [x] Validasi request di server.
- [ ] Jangan mempercayai `Petugas`, `Cabang`, atau role dari client tanpa validasi. *(sebagian: validasi petugas wajib ada; ownership antar user menunggu model auth)*
- [ ] Review permission spreadsheet. *(manual)*
- [ ] Review deployment Apps Script. *(manual: cek access "Anyone" + set STOKIS_API_KEY)*
- [x] Review siapa yang dapat mengakses endpoint.

> Temuan: action `login` yang dipanggil `app/api/auth/login/route.ts` tidak terdaftar di Apps Script. **Telah diimplementasikan** (`apps-script/Users.js` + action `login/getUsers/addUser/updateUser/setUserActive` di `Code.js`). Catatan: PIN masih plaintext di kolom Users selama MVP — pertimbangkan hashing / kendali akses saat production.

### Critical Rule

Secret:

```text
NEXT_PUBLIC_*
```

jangan digunakan untuk credential yang harus dirahasiakan.

---

# Phase 12 - Multi-Cabang

Arsitektur saat ini menggunakan spreadsheet per cabang.

Ini dapat dipertahankan untuk MVP.

### Tasks

- [ ] Pastikan setiap cabang hanya dapat menulis ke spreadsheet yang benar.
- [ ] Pastikan Cabang_ID tidak dapat dimanipulasi dari client.
- [ ] Audit mapping Cabang → Spreadsheet.
- [ ] Test concurrent requests dari beberapa cabang.
- [ ] Buat strategi consolidated reporting.

### Future

Jika jumlah cabang meningkat signifikan, evaluasi:

```text
Next.js
   ↓
API
   ↓
PostgreSQL / Supabase
   ↓
Dashboard
```

Google Sheets dapat dipertahankan sebagai export/reporting layer.

---

# Phase 13 - Testing

## Unit Test

- [x] Payload valid.
- [x] Payload kosong.
- [x] Item duplicate.
- [ ] Item tidak dikenal. *(validasi ada di `submitSO`; uji unit menyusul)*
- [x] Step1 invalid.
- [x] Step2 invalid.
- [ ] Sesi duplicate. *(di-cover oleh alur `already_processed`; uji unit menyusul)*
- [x] Sesi 130 item.

## Integration Test

```text
Next.js
  ↓
Apps Script
  ↓
Google Sheets
```

Test:

- [ ] 1 item *(harness: `node scripts/so-integration-test.mjs`, menunggu deploy)*
- [ ] 10 items *(same)*
- [ ] 130 items *(same)*
- [ ] 130 items × 2 sessions *(same)*
- [ ] duplicate request *(same)*
- [ ] concurrent request *(same, `--concurrent=N`)*
- [ ] failed request + retry *(same)*

## Load Test

Simulasikan:

```text
5 users
10 users
25 users
50 users
```

yang submit SO secara bersamaan.

---

# Phase 14 - Monitoring

Tambahkan logging minimal:

```text
request_id
sesi_id
timestamp
petugas
cabang
items_count
processing_time
rows_written
status
error_code
```

Tujuan:

Jika user melapor:

> "SO saya hilang"

kita dapat menelusuri request tersebut tanpa melakukan ritual membuka spreadsheet secara manual.

> Implementasi: `logSORequest_()` di `Utils.js` → hanya `request_id`, `cabangId`, `sesiId`, `items_count`, `rows_written`, `processing_ms`, `status` di log JSON `SO_LOG ...` di `submitSO` & `handleRequest_`.

---

# Priority Matrix

## P0 - Wajib sebelum production scale

- [x] Batch write 130 item
- [x] Idempotency berdasarkan Sesi_ID
- [x] Concurrency control
- [x] ID generation yang aman
- [x] Validation di backend
- [x] Standardized error handling

## P1 - Sangat disarankan

- [x] Audit semua Apps Script I/O
- [x] Optimasi `getPreviousSO()`
- [x] Security audit
- [x] Integration testing *(harness siap, belum dijalankan vs deployment)*
- [x] Logging

## P2 - Setelah sistem stabil

- [ ] Data model cleanup
- [ ] Dashboard optimization
- [ ] Multi-cabang reporting
- [ ] Load testing

## P3 - Saat scale meningkat

- [ ] PostgreSQL / Supabase
- [ ] Proper backend service
- [ ] Database indexing
- [ ] Queue/background jobs jika dibutuhkan

---

# Final Target Architecture

```text
                         ┌──────────────────┐
                         │     Next.js      │
                         │                  │
                         │ UI / UX          │
                         │ SO Form          │
                         │ State            │
                         └────────┬─────────┘
                                  │
                             1 request/SO
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   API / GAS      │
                         │                  │
                         │ Authentication   │
                         │ Validation       │
                         │ Idempotency      │
                         │ Locking          │
                         │ Business Logic   │
                         └────────┬─────────┘
                                  │
                             Batch write
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Google Sheets    │
                         │                  │
                         │ Sessions         │
                         │ Transactions     │
                         │ Items            │
                         └──────────────────┘
```

# Success Criteria

Sistem dianggap berhasil setelah refactor jika:

1. 130 item dapat disubmit sebagai satu request.
2. 130 item ditulis menggunakan batch operation.
3. Retry request tidak menghasilkan duplicate transaction.
4. Concurrent submission tidak menghasilkan collision.
5. Backend menolak payload invalid.
6. Error dapat ditelusuri menggunakan request/session ID.
7. Performance tidak memburuk ketika data mencapai ±100.000 rows.
8. Tidak ada secret yang terekspos ke browser.
9. Sistem tetap dapat menangani ±7.800 transaksi/bulan.
10. Arsitektur masih memungkinkan migrasi ke PostgreSQL tanpa membangun ulang frontend dari nol.

# Recommended Execution Order

```text
1. Backup + baseline
       ↓
2. Batch SO write
       ↓
3. Idempotency
       ↓
4. Concurrency + LockService
       ↓
5. ID strategy
       ↓
6. Backend validation
       ↓
7. Error handling
       ↓
8. Next.js request optimization
       ↓
9. Apps Script performance audit
       ↓
10. Security audit
       ↓
11. Testing
       ↓
12. Monitoring
       ↓
13. Data model cleanup
       ↓
14. Scale evaluation
```

## Important Decision

Jangan mengganti Apps Script atau Google Sheets terlebih dahulu.

Perbaiki bottleneck yang nyata:

```text
appendRow() per item
        ↓
batch setValues()
```

Kemudian perbaiki reliability:

```text
duplicate prevention
        +
concurrency control
        +
backend validation
```

Baru setelah itu ukur kembali performa berdasarkan penggunaan nyata.

---

# Execution Log (2026-08-29)

Fase P0–P7, sebagian P8–P14 dikerjakan. `[x]` = selesai & diverifikasi secara lokal (test + build + lint bersih untuk file tersentuh).

## Berubah

| File | Perubahan |
|------|-----------|
| `apps-script/SOValidation.js` (baru) | Validasi pure + ID builders (`SES_`, `TRX_YYYYMMDD_seq_rand`, `RPT_`, `CBG/ITM/PTG`); testable di Node. |
| `apps-script/Utils.js` | `SO_COL`, `ApiError_`, `newRandomToken_`, `logSORequest_`. |
| `apps-script/SO.js` | `submitSO`: LockService → idempotency (`Sesi_ID`) → 1× `setValues()` batch → PDF non-critical; `getPreviousSO` bounded 2-pass. |
| `apps-script/Code.js` | `request_id`, structured logging, mapping `ApiError_` → error code, constant-time key compare. |
| `apps-script/PDF.js` | `Laporan_ID` pakai `RPT_YYYYMMDD_rand` (bukan `getLastRow`). |
| `apps-script/Cabang.js`, `MasterItem.js`, `Petugas.js` | ID acak + row-update batch (bukan per-sel). |
| `apps-script/GetKey.js`, `SetKey.js`; hapus `EnsureKey.js` | Key acak via Properties, tanpa secret hardcoded. |
| `apps-script/Users.js` (baru) | `login` + users management; aksi terdaftar di `Code.js`. Folder duplikat `scripts/clasp/` dihapus (backup di `/tmp/opencode/clasp-backup`). |
| `app/api/so/route.ts` | Validasi server-side + status code (201 created / 200 already / 400 validation). |
| `app/so/input/page.tsx` | `sesiId` per sesi (useRef), retry idempotent, pesan `already_processed`, progress `rows_written`. |
| `lib/appsscript.ts` | Timeout 120s per request. |
| `package.json`, `test/so-validation.test.js` | Script `npm test` (node:test), 18 unit test lulus. |
| `scripts/so-bulk-sample.json`, `scripts/so-integration-test.mjs` | Test data 130 item + harness integrasi (`--concurrent=N`). |
| `docs/perbaikan/PHASE0_BASELINE.md` | Dokumentasi baseline struktur/endpoint/payload. |

## Verifikasi

- `npm test` → 18/18 pass.
- `npx tsc --noEmit` → bersih.
- `npm run lint` → 0 error baru (warning global-scope GAS sama dengan baseline; error lain pra-existing di `scripts/`, `skills/`).
- `npm run build` → sukses (semua route terbuild).

## Belum dikerjakan (butuh aksi owner)

1. `clasp push` / re-deploy Apps Script + set `STOKIS_API_KEY` di Script Properties & Vercel env (Petunjuk: Step 3–5 di chat).
2. Backup spreadsheet production (copy Drive).
3. Baseline timing submit 130 item & integration test vs deployment live (`node scripts/so-integration-test.mjs`).
4. ~~Hapus/implement action `login`~~ Selesai: `apps-script/Users.js` + aksi di `Code.js`.
5. P2+: data model cleanup (set terpisah Sessions/Items), dashboard optimization, multi-cabang reporting, load test.
