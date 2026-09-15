# Setup Guide — Without GAS (Google Sheets API + Drive API)

Panduan lengkap setup arsitektur baru tanpa Google Apps Script.
Menggunakan **Google Sheets API v4** + **Google Drive API v3** via Service Account.

---

## Arsitektur

```
Frontend (Next.js)
    |
API Routes (Next.js / Vercel)
    |
lib/appsscript.ts (dispatcher lokal)
    |
lib/domain/* (logika bisnis)
    |
lib/google/* (Google Sheets API + Drive API)
    |
Google Spreadsheets (per cabang) + Google Drive (folder PDF)
```

**Yang berubah:**
- Tidak ada lagi deployment Google Apps Script
- Tidak ada consent screen / clasp / 404 timeout
- Seluruh logika bisnis dijalankan sebagai TypeScript di Vercel

**Yang tetap:**
- Struktur spreadsheet sama (Master_Item, SO_Transaksi, Laporan_PDF, dll.)
- Data tetap di Google Spreadsheets (per cabang terpisah)
- PDF tetap tersimpan di Google Drive
- Kontrak API `{ success, data?, error? }` tetap identik

---

## 1. Buat Service Account di Google Cloud Console

### 1.1 Buat Project GCP

1. Buka https://console.cloud.google.com
2. Klik project dropdown > **New Project**
3. Nama: `stokis-backend` (bebas)
4. Klik **Create**

### 1.2 Aktifkan API

Aktifkan dua API berikut di project GCP:

- **Google Sheets API**
  https://console.cloud.google.com/apis/library/sheets.googleapis.com

- **Google Drive API**
  https://console.cloud.google.com/apis/library/drive.googleapis.com

Klik **Enable** pada masing-masing.

### 1.3 Buat Service Account

1. Buka https://console.cloud.google.com/iam-admin/serviceaccounts
2. Klik **Create Service Account**
3. Nama: `stokis-service` (bebas)
4. Klik **Create and Continue**
5. Role: **Skip** (tidak perlu role IAM)
6. Klik **Done**

### 1.4 Generate Key (JSON)

1. Klik service account yang baru dibuat
2. Tab **Keys** > **Add Key** > **Create new key**
3. Pilih **JSON** > **Create**
4. File JSON akan terdownload. **Simpan di tempat aman** - ini adalah kredensial akses.

### 1.5 Catat Email Service Account

Setelah membuat service account, catat email-nya. Format:

```
stokis-service@project-id.iam.gserviceaccount.com
```

Email ini akan digunakan untuk:
- Setting env `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- Share spreadsheet & folder Drive ke email ini

---

## 2. Share Spreadsheet & Folder ke Service Account

Service Account **tidak bisa** mengakses spreadsheet/folder yang tidak di-share kepadanya.
Anda perlu **share manual** setiap spreadsheet cabang + registry + folder Drive.

### 2.1 Share Spreadsheet

Untuk setiap spreadsheet (registry + tiap cabang):

1. Buka spreadsheet di Google Sheets
2. Klik **Share** (tombol pojok kanan atas)
3. Masukkan email Service Account (dari langkah 1.5)
4. Pilih permission: **Editor**
5. Klik **Send**

### 2.2 Share Folder Drive

Untuk setiap folder PDF cabang:

1. Buka folder di Google Drive
2. Klik kanan > **Share**
3. Masukkan email Service Account
4. Pilih permission: **Editor**
5. Klik **Send**

### 2.3 Script Batch Share (Opsional)

Jika ada banyak spreadsheet/folder, gunakan Google Apps Script berikut
untuk share batch (jalankan sekali dari akun pemilik spreadsheet):

```javascript
function batchShare() {
  const sa = 'stokis-service@PROJECT_ID.iam.gserviceaccount.com';

  const spreadsheetIds = [
    'REGISTRY_SPREADSHEET_ID',
    'SPREADSHEET_ID_CABANG_1',
    // ... tambahkan semua spreadsheet
  ];

  const folderIds = [
    'FOLDER_ID_CABANG_1',
    // ... tambahkan semua folder
  ];

  spreadsheetIds.forEach(id => {
    Drive.Permissions.insert(
      { role: 'writer', type: 'user', emailAddress: sa },
      id,
      { sendNotificationEmail: false }
    );
    Logger.log('Shared: ' + id);
  });

  folderIds.forEach(id => {
    Drive.Permissions.insert(
      { role: 'writer', type: 'user', emailAddress: sa },
      id,
      { sendNotificationEmail: false, supportsAllDrives: true }
    );
    Logger.log('Shared folder: ' + id);
  });
}
```

---

## 3. Struktur Registry Spreadsheet

Registry spreadsheet adalah **source of truth** untuk mapping cabang ke spreadsheet + folder.

### Sheet: Daftar_Cabang

| Kolom | Header       | Contoh                         |
|-------|-------------|--------------------------------|
| A     | Cabang_ID   | CBG1234AB                      |
| B     | Nama_Cabang | Cabang Jakarta Pusat           |
| C     | Alamat      | Jl. Sudirman No. 1            |
| D     | Spreadsheet_ID | 1a2b3c4d... (Google Sheets ID) |
| E     | Folder_Drive_ID | 1x2y3z... (Google Drive Folder ID) |
| F     | PIC_Nama    | Budi                           |
| G     | Nomor_WA_Cabang | 08123456789                 |
| H     | Aktif       | TRUE                           |
| I     | Created_At  | 2025-01-15                     |

### Sheet: Settings_Global

| Kolom A (Key)       | Kolom B (Value)                          |
|---------------------|------------------------------------------|
| Folder_Drive_Induk  | 1x2y3z... (Folder induk di Drive)        |

### Sheet: Template_Referensi

| Kolom A (baris 2)                |
|----------------------------------|
| TEMPLATE_SPREADSHEET_ID          |

### Sheet: Users

| Kolom | Header    | Catatan                      |
|-------|-----------|------------------------------|
| A     | User_ID   | Format: USR + token          |
| B     | Username  | Unique, case-insensitive     |
| C     | PIN       | Teks biasa (plaintext)          |
| D     | Nama      | Nama lengkap                 |
| E     | Role      | admin / petugas              |
| F     | Cabang_ID | ID cabang terkait            |
| G     | Aktif     | TRUE / FALSE                 |
| H     | Created_At | Timestamp                   |

---

## 4. Struktur Spreadsheet Cabang

Setiap cabang punya spreadsheet sendiri dengan sheet-sheet berikut.

### Sheet: Master_Item

| Kolom | Header             |
|-------|-------------------|
| A     | Item_ID           |
| B     | Nama_Barang       |
| C     | Area              |
| D     | Satuan            |
| E     | Konversi_Isi      |
| F     | Konversi_Keterangan |
| G     | Threshold         |
| H     | Aktif             |
| I     | Created_At        |

### Sheet: SO_Transaksi

| Kolom | Header            |
|-------|------------------|
| A     | Transaksi_ID     |
| B     | Timestamp        |
| C     | Tanggal_Operasional |
| D     | Shift            |
| E     | Item_ID          |
| F     | Nama_Barang      |
| G     | Area             |
| H     | Step1            |
| I     | Step2            |
| J     | Total            |
| K     | Petugas          |
| L     | Sesi_ID          |
| M     | Keterangan       |

### Sheet: Laporan_PDF

| Kolom | Header            |
|-------|------------------|
| A     | Laporan_ID       |
| B     | Sesi_ID          |
| C     | Tanggal_Operasional |
| D     | Shift            |
| E     | Petugas          |
| F     | Tanggal_Dibuat   |
| G     | Link_PDF         |
| H     | Jumlah_Kritis    |
| I     | Jumlah_Hampir_Habis |
| J     | Status           |

### Sheet: Petugas

| Kolom | Header   |
|-------|---------|
| A     | Petugas_ID |
| B     | Nama    |
| C     | Nomor_WA |
| D     | Aktif   |

---

## 5. Environment Variables

### 5.1 Variabel yang Dibutuhkan

| Variable | Keterangan | Contoh |
|----------|-----------|--------|
| `STOKIS_API_KEY` | Secret key untuk signing session (min 32 char) | `stk_a2f79d39a8f24077af8ab723bbef727af5243d67` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Email Service Account GCP | `stokis-service@proj.iam.gserviceaccount.com` |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Private key dari JSON key (dengan newline) | `-----BEGIN PRIVATE KEY-----\nMIIE...` |
| `REGISTRY_SPREADSHEET_ID` | ID spreadsheet registry (Daftar_Cabang, Users, dll.) | `1aBcDeFgHiJkLmNoPqRsTuVwXyZ` |

### 5.2 Variabel yang Tidak Lagi Diperlukan

| Variable | Keterangan |
|----------|-----------|
| `APPS_SCRIPT_URL` | **Opsional** — diperlukan untuk upload XLSX ke Drive via GAS. Tanpa ini, laporan tetap bisa dilihat via web view. |
| `FOLDER_DRIVE_INDUK` | **Opsional** - bisa diatur di Settings_Global sheet |

### 5.3 Setting di Vercel

1. Buka Dashboard Vercel > Project `stokis` > Settings > Environment Variables
2. Tambahkan 4 variabel di atas untuk environment **Production**
3. Untuk `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, paste isi private key dari JSON.
   Pastikan newline terbentuk dengan benar (Vercel otomatis handle multiline).

### 5.4 Update .env.local (untuk development)

```bash
STOKIS_API_KEY=stk_a2f79d39a8f24077af8ab723bbef727af5243d67
GOOGLE_SERVICE_ACCOUNT_EMAIL=stokis-service@proj.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----"
REGISTRY_SPREADSHEET_ID=1aBcDeFgHiJkLmNoPqRsTuVwXyZ
```

> **Perhatian:** Jangan commit `.env.local` ke repository.

---

## 6. Mendapatkan ID dari Google

### 6.1 Spreadsheet ID

Buka spreadsheet di browser. URL-nya berbentuk:

```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```

`SPREADSHEET_ID` adalah bagian setelah `/d/` dan sebelum `/edit`.

### 6.2 Folder Drive ID

Buka folder di Google Drive. URL-nya berbentuk:

```
https://drive.google.com/drive/folders/FOLDER_ID
```

`FOLDER_ID` adalah bagian setelah `/folders/`.

---

## 7. Flow Aplikasi

### 7.1 Login

1. User membuka `/login`
2. Memasukkan Username + PIN
3. Backend memanggil `lib/domain/users-service.ts` -> `login()`
4. PIN dibandingkan langsung (plaintext) dengan yang tersimpan di sheet `Users`
5. Jika cocok, session token dibuat dan diset sebagai cookie

### 7.2 Submit Stock Opname

1. User mengisi form SO di `/so/input`
2. Frontend memanggil `POST /api/so` dengan payload `{ cabangId, sesiId, items, ... }`
3. Backend memanggil `lib/domain/so-service.ts` -> `submitSO()`
4. Validasi payload -> append rows ke sheet `SO_Transaksi`
5. Frontend memanggil `POST /api/so/[laporanId]/save-laporan` (membuat record di `Laporan_PDF`)
6. Frontend memanggil `POST /api/so/[laporanId]/pdf` (generate PDF + upload ke Drive)
7. PDF di-upload ke Drive folder cabang, link disimpan di `Laporan_PDF.Link_PDF`

### 7.3 Rate Limit

Sheets API quota: 60 request/menit/user, 300 request/menit/project.
Dengan 20 cabang x 12 SO/hari, ini aman selama:
- Batch write (sudah dipakai: `appendRows` multi-baris per sesi)
- Cache registry (sudah dipakai: `resolveCabang` cache per cabang)
- Tidak ada read-all berulang tanpa caching

---

## 8. Troubleshooting

### Error: "REGISTRY_SPREADSHEET_ID belum dikonfigurasi"

Pastikan env `REGISTRY_SPREADSHEET_ID` di-set di Vercel dan `.env.local`.

### Error: "GOOGLE_SERVICE_ACCOUNT_EMAIL dan GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY wajib dikonfigurasi"

Pastikan kedua env Google Service Account di-set. Private key harus dalam format yang benar
(dengan `-----BEGIN PRIVATE KEY-----` dan `-----END PRIVATE KEY-----`).

### Error: "CABANG_TIDAK_DITEMUKAN"

Pastikan `Cabang_ID` di request cocok dengan yang ada di sheet `Daftar_Cabang` registry.

### Error: "Spreadsheet_ID kosong"

Pastikan kolom `Spreadsheet_ID` di sheet `Daftar_Cabang` terisi untuk cabang tersebut.

### Error 403 dari Google Sheets API

Service Account belum di-share ke spreadsheet. Lihat [Bagian 2](#2-share-spreadsheet--folder-ke-service-account).

### Error 403 dari Google Drive API

Service Account belum di-share ke folder Drive. Pastikan folder sudah di-share
dengan permission **Editor** ke email service account.

---

## 9. File Structure (Branch `without-gas`)

```
lib/
  google/
    client.ts       # JWT client (Sheets + Drive) dari Service Account
    sheets.ts       # CRUD dasar Google Sheets API
    registry.ts     # Resolver cabang + registry
    drive.ts        # Upload PDF ke Google Drive
  domain/
    ids.ts          # Generator ID + validasi
    so.ts           # Konstanta kolom SO + calculateStatus
    so-validation.ts # Validasi payload SO
    errors.ts       # ApiError + helpers
    so-service.ts   # submitSO, getPreviousSO
    laporan-service.ts # saveLaporan, searchLaporan, WA link, PDF link update
    cabang-service.ts  # CRUD cabang + buat cabang baru (copy template)
    master-item-service.ts # CRUD master item
    petugas-service.ts     # CRUD petugas
    users-service.ts       # Login + CRUD users
    dashboard-service.ts   # Dashboard harian & mingguan
  appsscript.ts     # Dispatcher lokal (switch action -> service TS)
  env.ts            # Validasi environment variables
```

---

## 10. Rollback

Jika perlu kembali ke GAS (branch `master`):

```bash
git checkout master
```

Branch `without-gas` tetap tersimpan di GitHub untuk referensi.

---

## Catatan Penting

1. **Jangan hapus deployment GAS** sampai branch `without-gas` terverifikasi di production
2. **Share spreadsheet/folder** ke service account SEBELUM deploy ke Vercel
3. **Private key** jangan pernah di-commit - hanya di env Vercel dan `.env.local`
4. **Testing**: mulai dengan 1 cabang pilot dulu sebelum mengaktifkan semua cabang
5. **Backup**: pastikan ada backup spreadsheet sebelum testing production
