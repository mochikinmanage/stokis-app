# Stokis — Penjelasan untuk Pemilik Usaha & Stakeholder

Dokumen ini ditulis khusus untuk **pemilik usaha, manajer operasional, dan stakeholder non-teknis**. Tujuannya menjelaskan secara sederhana: **apa itu Stokis, kenapa dibuat, bagaimana sistem menyimpan datanya, dan hal penting apa yang perlu Anda ketahui** sebelum / saat menggunakannya.

> Jika Anda seorang developer dan ingin detail teknis, lihat `README.md` dan `PRD-stokis.md`.

---

## 1. Ringkasan Singkat (TL;DR)

**Stokis** adalah aplikasi web untuk **mencatat stock opname (pengecekan fisik stok barang)** di **beberapa cabang/outlet sekaligus**, dari satu tempat.

- Setiap petugas mencatat jumlah stok barang lewat ponsel/komputer.
- Sistem **otomatis menentukan status stok**: **Aman, Hampir Habis, atau Kritis** (berdasarkan batas minimum yang Anda tentukan).
- Setiap kali selesai mencatat, sistem **otomatis membuat laporan PDF** yang tersimpan rapi, dan bisa langsung dikirim ke **WhatsApp**.
- Semua cabang **datanya terpisah**, tidak tercampur, tapi bisa Anda kelola dari satu akun.

Tinggal akses lewat browser, tanpa perlu install aplikasi apa pun.

---

## 2. Kenapa Aplikasi Ini Dibuat?

### Masalah yang sering dialami usaha multi-cabang (retail, kafe, F&B, toko, gudang):

| Masalah | Akibatnya |
|---|---|
| **Pencatatan manual di buku/kertas** | Rawan salah, sulit direkap, data hilang |
| **Spreadsheet berantakan antar lokasi** | Setiap cabang punya file sendiri, tidak konsisten, susah disatukan |
| **Laporan lambat dibuat manual** | Butuh waktu & tenaga untuk membuat PDF setiap hari |
| **Stok kritis tidak terdeteksi** | Barang habis tanpa disadari → kehilangan penjualan |
| **Data terfragmentasi antar cabang** | Tidak ada pandangan keseluruhan usaha Anda |
| **Tidak ada notifikasi / distribusi laporan** | Laporan hanya ada di satu orang, tidak sampai ke yang butuh |

### Apa yang Stokis selesaikan:

- **Input lebih cepat & terstruktur** — form dirancang untuk pencatatan cepat, membandingkan stok sekarang vs sebelumnya.
- **Peringatan otomatis** — sistem langsung menandai item **Kritis / Hampir Habis / Aman** berdasarkan threshold (batas minimum) per barang.
- **Laporan PDF otomatis** — selesai mencatat → laporan langsung jadi, tersimpan otomatis per cabang.
- **Distribusi via WhatsApp** — satu kali klik untuk menyiapkan pesan laporan ke grup cabang.
- **Dashboard visual** — lihat ringkasan stok dan tren dalam bentuk grafik harian/mingguan.
- **Isolasi per cabang** — data tiap cabang terpisah aman, namun bisa dikelola dari satu panel.
- **Mobile-friendly** — bisa dipakai petugas di lapangan pakai HP, tanpa laptop.

---

## 3. Bagaimana Sistem Menyimpan Data?

Ini bagian yang paling penting dipahami pemilik usaha. **Stokis tidak menggunakan database server yang mahal.** Sebagai gantinya, sistem memakai yang sudah Anda miliki / mudah dibuat: **Google Sheets (Google Spreadsheet) + Google Drive**.

### Konsep penyimpanan:

```
┌──────────────────────────────────────────────────────────┐
│                    STOKIS (aplikasi web)                  │
│    Tampilan & logika yang dilihat pengguna               │
└──────────────────────────┬───────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            │     GOOGLE (tempat data)     │
            │                             │
            │  • Google Sheets → database │
            │  • Google Drive  → laporan  │
            │    PDF per cabang           │
            └─────────────────────────────┘
```

### 3.1 Database = Google Sheets

- Ada **satu file "Registry"** — semacam daftar induk yang berisi daftar seluruh cabang dan lokasi tiap spreadsheet-nya.
- **Setiap cabang punya spreadsheet sendiri** yang berisi data operasionalnya (daftar barang, hasil stock opname, dst).
- **Keuntungan:**
  - **Gratis** — tidak ada biaya server/database.
  - **Real-time** — beberapa orang bisa melihat data bersamaan.
  - **Transparan** — Anda bisa membuka spreadsheet-nya langsung di Google dan melihat datanya.
  - **Familiar** — berbasis spreadsheet yang sudah umum dipakai usaha.

### 3.2 Laporan = Google Drive

- Setiap laporan PDF otomatis tersimpan di **folder Google Drive per cabang**.
- Rapi, mudah dicari, dan bisa dibagikan.

### 3.3 Isolasi Data per Cabang

- Data **tidak tercampur antar cabang**. Setiap cabang mengakses spreadsheet-nya sendiri.
- Sulurannya: pengguna hanya melihat data cabang yang diizinkan (diatur per akun).

> **Catatan penting:** karena data berbasis Google Sheets, **data dipegang oleh akun Google Anda sendiri**. Ini beda dari aplikasi cloud biasa yang datanya "tersimpan di penyedia". Pada Stokis, **Anda pemilik penuh data** — selama file Google Anda aman.

---

## 4. Hal Penting yang Perlu Diketahui Pemilik Usaha

### 4.1 Hak akses & keamanan
- Ada dua peran: **Admin** dan **Petugas**.
- **Petugas** — mencatat stock opname dan melihat laporannya.
- **Admin** — mengelola cabang, master item (daftar barang + batas minimum), petugas, dan melihat semua laporan.
- Masuk menggunakan **username + PIN**, bukan password panjang, agar cepat dan sederhana untuk petugas lapangan.

### 4.2 Data disimpan di Google Anda (tanggung jawab Anda)
- Pastikan akun Google yang dipakai aman (aktifkan verifikasi 2 langkah).
- File Google adalah **sumber kebenaran** data Anda. Lindungi dengan baik.

### 4.3 Cara kerja pencatatan (alur harian)
1. Pilih **cabang** yang dikerjakan.
2. Isi **tanggal, shift** (Opening/Closing), petugas otomatis terbaca dari login.
3. Petugas mengisi **jumlah stok** per barang (Step 1 & Step 2).
4. Sistem **membandingkan dengan SO sebelumnya** dan menandai status (Kritis/Hampir Habis/Aman).
5. Tekan **Simpan & Buat Laporan** → PDF otomatis dibuat, tersimpan di Drive, siap dikirim via WhatsApp.

### 4.4 Status stok — pahami ini
Sistem menandai item berdasarkan **batas minimum (threshold)** yang Anda tetapkan per barang:

| Status | Arti |
|---|---|
| **Aman** | Stok di atas 2× batas minimum |
| **Hampir Habis** | Stok antara 1×–2× batas minimum |
| **Kritis** | Stok sama atau di bawah batas minimum → **segera re-stock** |

Ini kunci untuk mencegah barang habis tanpa disadari.

### 4.5 Kenapa pakai internet & Google?
- Stokis adalah **aplikasi web**, jadi butuh koneksi internet untuk mengaksesnya.
- Operasional inti (pencatatan, laporan) berjalan **real-time** dengan Google.

---

## 5. Manfaat Bisnis yang Bisa Anda Harapkan

- **Dapat rekap stok seluruh cabang dalam satu tempat** — tidak lagi memburu laporan dari tiap lokasi.
- **Laporan harian otomatis** — menghemat waktu/tenaga pembuatan PDF manual.
- **Terhindar dari stok kosong** — item kritis terdeteksi lebih awal lewat threshold.
- **Kontrol lebih baik** — setiap cabang bertanggung jawab pada datanya sendiri, tapi Anda bisa memantau semuanya.
- **Keputusan lebih cepat** — berbasis data yang nyata dan terkini.

---

## 6. FAQ Singkat

**Apakah perlu instal software?**
Tidak. Cukup buka dari browser di komputer/ponsel.

**Apakah perlu beli server/database?**
Tidak. Data memakai Google Sheets & Drive Anda (gratis, selama kuota Google mencukupi).

**Kalau petugas tidak punya laptop?**
Bisa pakai HP. Aplikasi dirancang mobile-friendly.

**Siapa yang bisa melihat data semua cabang?**
Hanya akun dengan peran Admin (yang diizinkan). Petugas hanya melihat cabang yang ditetapkan.

**Bagaimana kalau kapasitas Google Sheets penuh?**
Pada skala normal (ribuan baris) masih aman. Jika usaha Anda sangat besar, ini perlu dievaluasi bersama tim teknis — namun untuk operasional stok harian umumnya sangat mencukupi.

---

## 7. Kesimpulan

**Stokis dibuat untuk menyelesaikan masalah pencatatan stok multi-cabang yang manual, terfragmentasi, dan lambat.** Dengan memanfaatkan Google Sheets & Drive sebagai penyimpanan (gratis, real-time, dimiliki penuh oleh Anda) plus pencatatan mobile yang cepat, status otomatis, laporan PDF otomatis, dan distribusi WhatsApp — usaha Anda bisa memantau dan mengendalikan stok seluruh cabang dengan lebih mudah, akurat, dan tepat waktu.

---

Jika Anda ingin pendalaman teknis lebih lanjut, silakan merujuk ke:
- `README.md` — cara menjalankan & arsitektur teknis
- `PRD-stokis.md` — spesifikasi produk dan arsitektur terperinci
