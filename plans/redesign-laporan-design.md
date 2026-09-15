# Design Specification: Laporan Stock Opname (SO) Mochikin
Dokumen ini berfungsi sebagai panduan (prompt/blueprint) bagi AI atau developer untuk membuat ulang styling laporan Stock Opname harian dalam format **Excel (.xlsx)** dan **PDF**.

---

## 1. Spesifikasi Format Excel

### A. Struktur Layout & Header Bertingkat (Merged Cells)
Baris pertama (Row 1) menggunakan *merged cells* untuk mengelompokkan konteks data. Baris kedua (Row 2) berisi sub-header.

| Blok (Row 1) | Kolom yang di-merge | Warna Background (Hex) | Warna Teks | Sub-header di bawahnya (Row 2) |
| :--- | :--- | :--- | :--- | :--- |
| **INFORMASI BARANG** | A1:D1 | Biru (`#2563EB`) | Putih (Bold) | Nama Barang, Area, Satuan, Threshold |
| **SO SEBELUMNYA** | E1:G1 | Abu-abu Gelap (`#4B5563`) | Putih (Bold) | Step 1, Step 2, Total |
| **SO SEKARANG** | H1:J1 | Hijau Tua (`#059669`) | Putih (Bold) | Step 1, Step 2, Total |
| **HASIL & ANALISIS** | K1:M1 | Oranye (`#D97706`) | Putih (Bold) | Penggunaan, Status, Keterangan |

### B. Conditional Formatting (Kolom Status)
Warna diaplikasikan pada cell di kolom "Status" berdasarkan teks nilainya:
*   🔴 **KRITIS**: Background Merah Muda (`#FEE2E2`), Text Merah Tua (`#991B1B`, Bold)
*   🟡 **HAMPIR HABIS**: Background Kuning Muda (`#FEF08A`), Text Coklat Tua (`#854D0E`, Bold)
*   🟢 **AMAN**: Background Hijau Muda (`#BBF7D0`), Text Hijau Tua (`#166534`, Bold)

### C. UX & Kerapian (Freeze Panes & Alignment)
*   **Freeze Panes:** Kunci baris 1-2 (Header) dan kolom A (Nama Barang) agar tetap terlihat saat di-scroll. Titik freeze pada `C3`.
*   **Alignment:** 
    *   Kolom Angka & Status: `Center` (Horizontal & Vertical).
    *   Kolom Teks (Nama Barang, Keterangan): `Left`, `Vertical Center`, dan aktifkan `Wrap Text`.

### 🖼️ Cuplikan Visual Excel (Mockup)
```text
[INFORMASI BARANG (Biru)]     [SO SEBELUMNYA (Abu)]    [SO SEKARANG (Hijau)]   [HASIL (Oranye)]
Nama Barang  | Area | ... | Step 1 | Step 2 | Total | Step 1 | Step 2 | Total | Pemakaian | Status | Keterangan
----------------------------------------------------------------------------------------------------------------
Bumbu Marinas| Meja | ... |   0    |   0    |   0   |   0    |   92   |  92   |   -92     | 🔴 KRITIS | 
Mint Ice C...| Meja | ... |   0    |   0    |   0   |   0    |   0    |   0   |     0     | 🔴 KRITIS | Habis..
Beras        | Meja | ... |   0    |   0    |   0   |  1.8   |   0    |  1.8  |  -1.8     | 🟡 HAMPIR |
Tepung Terigu| Meja | ... |   5    |   0    |   5   |  11    |   0    |  11   |   -11     | 🟢 AMAN   |
```

---

## 2. Spesifikasi Format PDF

### A. Konfigurasi Halaman
*   **Ukuran:** A4
*   **Orientasi:** Landscape (Sangat penting agar kolom SO Sebelumnya & Sekarang tidak tumpang tindih).
*   **Margin:** 15mm di semua sisi.
*   **Background Page:** Off-white/Cream pucat (`#faf8f5`) untuk kesan elegan, dengan tabel berwarna dasar putih (`#ffffff`).

### B. Brand Header & Meta Info
Bagian atas dokumen dipisahkan dari tabel operasional.
*   **Header Utama:** Teks "MOCHIKIN - LAPORAN STOCK OPNAME" (Bold, Uppercase, warna `#0f172a`), dengan garis bawah tipis berwarna merah brand (`#e11d48`).
*   **Meta Info (Tabel 2x2):** Berisi `Cabang`, `Tanggal Laporan`, `Petugas`, `Shift`. Teks meta diletakkan tanpa border (*borderless*).

### C. Tabel & UI Badge Status
Header tabel mengikuti pengelompokan warna yang sama persis dengan versi Excel.
*   **Zebra Striping:** Baris tabel data ganjil berwarna putih, baris genap berwarna abu-abu sangat terang (`#f8fafc`) agar mata tidak silap membaca baris.
*   **Status Badges (CSS style):**
    Status menggunakan elemen `<span class="badge">` dengan sudut membulat (*border-radius: 4px*), bukan sekadar teks yang diwarnai.
    *   CSS `badge.kritis`: `background: #fee2e2; color: #b91c1c; border: 1px solid #f87171;`
    *   CSS `badge.hampir`: `background: #fef9c3; color: #a16207; border: 1px solid #facc15;`
    *   CSS `badge.aman`: `background: #d1fae5; color: #047857; border: 1px solid #34d399;`

### 🖼️ Cuplikan UI Komponen PDF
**1. Meta Info Layout:**
> **Cabang:** CBG02CMH (Cimahi) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Tanggal Laporan:** 01/09/2026
> **Petugas:** Rifah &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Shift:** Closing (14:24 WIB)

**2. Visual "Badge" Status:**
> [ 🔴 KRITIS ] -> (Kotak merah muda, teks merah bata, pinggiran merah)
> [ 🟡 HAMPIR HABIS ] -> (Kotak kuning pucat, teks coklat, pinggiran kuning)
> [ 🟢 AMAN ] -> (Kotak hijau muda, teks hijau tua, pinggiran hijau)
