# Stokis - Multi-Branch Stock Opname System

Stokis is a modern, serverless Next.js web application designed to streamline daily stock opname (inventory counting) operations across multiple branch locations. It integrates directly with Google Sheets as its primary database and uses Google Drive for automated XLSX report generation and storage, eliminating the need for traditional database servers.

> **Branch `without-gas`**: Versi terbaru tanpa Google Apps Script. Seluruh logika bisnis dijalankan sebagai TypeScript di Vercel, langsung mengakses Google Sheets API + Drive API via Service Account.

---

## What is Stokis?

**Stokis** (Stock Opname System) adalah sistem pencatatan stock opname untuk multi-cabang. Fitur utama:

| Fitur | Deskripsi |
|-------|-----------|
| **Input SO** | Form pencatatan per item dengan Step 1 & Step 2 counting |
| **Previous SO Comparison** | Bandingkan stok sekarang vs sebelumnya |
| **Threshold Monitoring** | Status otomatis: Kritis / Hampir Habis / Aman |
| **XLSX Reports** | Generate berkas Excel (.xlsx) dengan tabel perbandingan SO sebelumnya vs sekarang, status warna otomatis, dan tanggal dd/mm/yyyy |
| **WhatsApp Template** | Copy template pesan WA untuk laporan |
| **Dashboard** | Grafik harian & mingguan (bar/line/area) |
| **Master Item** | Kelola item, threshold, dan area penempatan |
| **Multi-Branch** | Support unlimited cabang dengan isolasi data otomatis |

---

## Why Stokis Exists

Banyak bisnis retail/kafe/F&B kesulitan dengan:
- **Manual tracking** - Spreadsheet berantakan antar lokasi
- **Reporting lambat** - PDF harus dibuat manual
- **Data terfragmentasi** - Tidak ada view konsolidasi
- **Tidak ada alert** - Stock kritis tidak terdeteksi

Stokis menyelesaikan ini dengan:
- **Google Sheets sebagai database** - Gratis, real-time, familiar
- **Auto-clone template** - Tambah cabang dalam hitungan detik
- **XLSX Auto-generate** - Langsung buat berkas Excel bergaya Mochikin (ExcelJS) & simpan ke Drive folder per cabang
- **Visual dashboard** - Langsung lihat mana item kritis

---

## Tech Stack

```
Frontend:     Next.js 16 + React 19 + Tailwind CSS 4 + TypeScript
Animations:  Framer Motion + Custom Quantum Pulse Loader
Charts:      Recharts (Bar/Line/Area toggle)
Icons:       Lucide React
Backend:     Next.js API Routes → lib/domain/* → lib/google/*
Database:    Google Sheets API v4 (per cabang)
File Storage: Google Drive API v3 (XLSX reports)
Excel Engine: ExcelJS (styled sheets with headers, color badges, freeze panes)
Auth:        Custom PIN-based auth (admin/petugas)
```

---

## How to Start from Zero

### Prerequisites
- Node.js 18+ & npm
- Google Account (untuk Sheets & Drive)
- Google Cloud Project (untuk Service Account)
- Code editor (VS Code recommended)

### Step 1: Clone & Install
```bash
git clone https://github.com/myGroomy/stokis.git
cd stokis
git checkout without-gas
npm install
```

### Step 2: Buat Service Account di Google Cloud Console

1. **Buka Google Cloud Console**
   - https://console.cloud.google.com

2. **Buat Project baru**
   - Klik project dropdown > **New Project**
   - Nama: `stokis-backend` (bebas)
   - Klik **Create**

3. **Aktifkan API**
   - Buka https://console.cloud.google.com/apis/library/sheets.googleapis.com → **Enable**
   - Buka https://console.cloud.google.com/apis/library/drive.googleapis.com → **Enable**

4. **Buat Service Account**
   - Buka https://console.cloud.google.com/iam-admin/serviceaccounts
   - Klik **Create Service Account**
   - Nama: `stokis-service` (bebas)
   - Klik **Create and Continue** > Skip role > **Done**

5. **Generate Key (JSON)**
   - Klik service account > Tab **Keys** > **Add Key** > **Create new key**
   - Pilih **JSON** > **Create**
   - File JSON akan terdownload

6. **Catat Email Service Account**
   - Format: `stokis-service@project-id.iam.gserviceaccount.com`
   - Email ini akan digunakan untuk share spreadsheet & folder

### Step 3: Buat Registry Spreadsheet

Buat Google Sheet baru sebagai **registry** (source of truth):

| Sheet | Kolom |
|-------|-------|
| **Daftar_Cabang** | Cabang_ID, Nama_Cabang, Alamat, Spreadsheet_ID, Folder_Drive_ID, PIC_Nama, Nomor_WA_Cabang, Aktif, Created_At |
| **Settings_Global** | Key, Value (contoh: Folder_Drive_Induk) |
| **Template_Referensi** | Kolom A baris 2: Template_Spreadsheet_ID |
| **Users** | User_ID, Username, PIN, Nama, Role, Cabang_ID, Aktif, Created_At |

Copy **Spreadsheet ID** dari URL:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```

### Step 4: Buat Spreadsheet Cabang & Folder Drive

Untuk setiap cabang:
1. Buat Google Sheet baru (atau copy dari template) dengan sheet: `Master_Item`, `SO_Transaksi`, `Laporan_PDF`, `Petugas`
2. Buat folder di Drive untuk menyimpan PDF cabang tersebut
3. Isi `Spreadsheet_ID` dan `Folder_Drive_ID` di sheet `Daftar_Cabang` di registry

### Step 5: Share Spreadsheet & Folder ke Service Account

**Penting:** Service Account tidak bisa akses spreadsheet/folder yang tidak di-share kepadanya.

Untuk setiap spreadsheet (registry + cabang) dan folder Drive:
1. Buka spreadsheet/folder
2. Klik **Share**
3. Masukkan email Service Account (dari Step 2.6)
4. Permission: **Editor**
5. Klik **Send**

### Step 6: Environment Variables

Buat `.env.local` di root folder:
```env
STOKIS_API_KEY=stk_a2f79d39a8f24077af8ab723bbef727af5243d67
GOOGLE_SERVICE_ACCOUNT_EMAIL=stokis-service@project-id.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----"
REGISTRY_SPREADSHEET_ID=1aBcDeFgHiJkLmNoPqRsTuVwXyZ
```

> **Note:** Untuk production, set env vars di Vercel Dashboard > Settings > Environment Variables.

### Step 7: Deploy Google Apps Script (untuk Upload XLSX ke Drive)

Service Account tidak punya storage quota di Google Drive. Untuk mengupload file XLSX laporan ke Drive folder cabang, aplikasi menggunakan Google Apps Script (GAS) yang berjalan di akun Google user.

1. **Buka Google Apps Script**
   - https://script.google.com → **New Project**

2. **Copy semua file** dari folder `apps-script/` ke editor GAS:
   - `Code.js`, `Utils.js`, `Registry.js`, `Cabang.js`, `MasterItem.js`, `Petugas.js`, `Users.js`, `SO.js`, `SOValidation.js`, `Laporan.js`, `Dashboard.js`, `PDF.js`, `GetKey.js`, `SetKey.js`, `SetupPhase1.js`, `TestPhase2.js`
   - Set file `appsscript.json` → ganti isi dengan `apps-script/appsscript.json`

3. **Set API Key di Script Properties**
   - Di editor GAS: **Project Settings** (gear icon) → **Script Properties**
   - Tambah property: `STOKIS_API_KEY` = nilai yang sama dengan env `STOKIS_API_KEY` di `.env.local`
   - Atau jalankan fungsi `setApiKey()` dari `SetKey.js` sekali

4. **Deploy sebagai Web App**
   - Klik **Deploy** > **New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Klik **Deploy**
   - Copy **Web app URL** (format: `https://script.google.com/macros/s/.../exec`)

5. **Set Environment Variable**
   - Di `.env.local` (development):
     ```env
     APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfyc.../exec
     ```
   - Di Vercel (production): tambahkan `APPS_SCRIPT_URL` di Environment Variables

> **Fallback:** Jika GAS upload gagal (timeout, error, dll), aplikasi otomatis menyimpan link web view (`/laporan/view/{id}?cabang=...`) sebagai fallback. User tetap bisa melihat laporan di browser dan download XLSX dari situ.

### Step 8: Run Development Server
```bash
npm run dev
```
Buka http://localhost:3000

---

## Deployment Guide (Vercel)

Aplikasi ini dapat di-deploy dengan mudah ke **Vercel** karena arsitekturnya murni serverless (Next.js App Router).

### 1. Persiapan Repository
Pastikan seluruh perubahan telah dipush ke repository GitHub/GitLab Anda.

### 2. Hubungkan ke Vercel
1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Klik **Add New...** > **Project**
3. Pilih repository `stokis`
4. Framework Preset: **Next.js**

### 3. Konfigurasi Environment Variables
Di bagian **Environment Variables**, tambahkan variabel berikut:

| Key | Value Contoh | Deskripsi |
|-----|--------------|-----------|
| `STOKIS_API_KEY` | `stk_a2f79d3...` | Key rahasia untuk sesi auth (min 32 karakter) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `stokis-service@xxx.iam.gserviceaccount.com` | Email Service Account GCP |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | `"-----BEGIN PRIVATE KEY-----\n..."` | Private Key dari file JSON GCP (pastikan newline `\n` ter-escape dengan benar) |
| `REGISTRY_SPREADSHEET_ID` | `1aBcDeFgHiJk...` | ID Google Sheet Registry utama |
| `APPS_SCRIPT_URL` | `https://script.google.com/macros/s/AKfyc.../exec` | Web app URL dari Google Apps Script (upload XLSX ke Drive) |
| `APP_URL` | `https://stokis-yourproject.vercel.app` | (Opsional) URL publik aplikasi untuk link fallback |

### 4. Deploy
1. Klik **Deploy**
2. Tunggu proses build selesai (~1-2 menit)
3. Aplikasi siap digunakan di URL publik Vercel!

> **Penting untuk Production:** Pastikan seluruh spreadsheet cabang dan registry Google Sheets sudah di-share ke `GOOGLE_SERVICE_ACCOUNT_EMAIL` dengan hak akses **Editor**.

---

## User Guide

### Login
- **Admin**: Username & PIN (6 digit) - akses semua fitur
- **Petugas**: Username & PIN - akses input SO & laporan

### Input Stock Opname
1. Pilih cabang di navbar
2. Pilih tanggal & shift (Opening/Closing)
3. Isi Step 1 & Step 2 per item
4. (Opsional) Tambah keterangan untuk item tertentu
5. Klik "Simpan & Buat Laporan"
6. Review popup ringkasan > Konfirmasi
7. Berkas XLSX otomatis dibuat dan tersimpan ke Google Drive

### Lihat Laporan
1. Menu **Laporan** - list semua SO per cabang
2. Klik tombol **XLSX** untuk mengunduh/membuka file Excel
3. Klik tombol **WhatsApp** > Salin template pesan yang sudah berisi link XLSX
4. Paste ke WhatsApp group/manager

### Dashboard
- **Harian**: Grafik distribusi status (Kritis/Hampir Habis/Aman)
- **Mingguan**: Tren aktivitas per hari dengan toggle Bar/Line/Area chart

### Master Item (Admin Only)
- Tambah/edit item dengan threshold
- Search & filter by area
- Inline edit threshold langsung di tabel

---

## Architecture

```
┌─────────────────────┐
│   Next.js App       │
│   (Frontend)        │
└──────────┬──────────┘
           │
┌──────────▼──────────┐     ┌─────────────────────────┐
│  API Routes         │────▶│  lib/domain/*           │
│  (Next.js Server)   │     │  (Logika Bisnis)        │
└─────────────────────┘     └──────────┬──────────────┘
                                       │
                            ┌──────────▼──────────────┐
                            │  lib/google/*           │
                            │  (Google Sheets API +   │
                            │   Drive API)            │
                            └──────────┬──────────────┘
                                       │
                   ┌───────────────────┼───────────────────┐
                   │                   │                   │
        ┌──────────▼──────────┐ ┌──────▼──────┐ ┌─────────▼────────┐
        │  Google Sheets API  │ │ Google Drive │ │  Service Account │
        │  (per cabang)       │ │ (PDF)        │ │  (JWT Auth)      │
        └─────────────────────┘ └─────────────┘ └──────────────────┘
```

**Flow Request:**
1. Frontend → API Route (Next.js)
2. API Route → Domain Service (`lib/domain/*`) → Google Sheets API
3. Untuk upload XLSX → Google Apps Script → Google Drive

---

## Project Structure

```
stokis/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes (SO, laporan, master-item, dll.)
│   ├── so/input/             # Input SO page
│   ├── so/konfirmasi/        # Confirmation page
│   ├── laporan/              # Laporan list + view + edit
│   ├── dashboard/            # Analytics pages
│   ├── master-item/          # Master item admin
│   ├── cabang/               # Branch admin
│   ├── petugas/              # User management
│   └── login/                # Login page
├── components/               # React components
├── lib/
│   ├── google/               # Google API layer (client, sheets, registry, drive)
│   ├── domain/               # Business logic (so, laporan, cabang, master-item, dll.)
│   └── appsscript.ts         # Dispatcher (action routing)
├── apps-script/              # Google Apps Script (upload XLSX ke Drive)
├── public/                   # Static assets
├── docs/                     # Documentation
└── test/                     # Unit tests
```

---

## Environment Variables

| Variable | Keterangan | Wajib |
|----------|-----------|-------|
| `STOKIS_API_KEY` | Secret key untuk signing session (min 32 char) | Ya |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Email Service Account dari GCP | Ya |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Private key dari JSON key SA | Ya |
| `REGISTRY_SPREADSHEET_ID` | ID spreadsheet registry | Ya |
| `APPS_SCRIPT_URL` | Web app URL dari Google Apps Script (untuk upload XLSX ke Drive) | Ya* |
| `APP_URL` | URL publik aplikasi (untuk link fallback) | Opsional |

> \* `APPS_SCRIPT_URL` wajib jika ingin upload XLSX otomatis ke Google Drive. Tanpa ini, upload ke Drive nonaktif tapi laporan tetap bisa dilihat via web view.

---

## Troubleshooting

| Error | Solusi |
|-------|--------|
| `REGISTRY_SPREADSHEET_ID belum dikonfigurasi` | Set env `REGISTRY_SPREADSHEET_ID` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL... wajib dikonfigurasi` | Set kedua env Google SA |
| `CABANG_TIDAK_DITEMUKAN` | Cek `Cabang_ID` di sheet `Daftar_Cabang` |
| `Spreadsheet_ID kosong` | Isi kolom `Spreadsheet_ID` di registry |
| Error 403 dari Google API | Share spreadsheet/folder ke email Service Account |

---

## License

Personal Use Only.

---

## Contributing

1. Fork repository
2. Buat feature branch
3. Commit perubahan
4. Push & PR

---

Built with ❤️ for small business inventory management.
