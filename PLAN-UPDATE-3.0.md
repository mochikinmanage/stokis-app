# PLAN-UPDATE-3.0.md — Dashboard Fix, Laporan In-App, Gate Cabang/Shift, Kategori Per-Cabang, Docs Coverage

> Audience: dokumen ini ditulis untuk AI coding agent (mis. Claude Code) yang akan mengimplementasikan perubahan berikut. Baca seluruhnya sebelum menulis kode apa pun. Tanyakan ke user jika ada hal yang ambigu, jangan menebak.

Dokumen ini adalah lanjutan dari `PLAN-UPDATE.md` (edit laporan, bug input angka, laporan per-tipe) dan `AUDIT-UIUX.md` (55 temuan UI/UX, 2026-09-09). Referensi ke keduanya dipakai di bawah — jangan duplikasi pekerjaan yang sudah tercakup di sana.

---

## 0. Agent Behavior Rules (Read First)

1. **Kerjakan section per section, bukan sekaligus.** Setiap section (1–5) adalah unit kerja terpisah. Selesaikan dan verifikasi satu section sebelum lanjut ke section berikutnya, meskipun menyentuh file yang sama.
2. **Jangan menebak keputusan bisnis secara diam-diam.** Kalau ada nama kolom, rule status, atau scope akses yang ambigu, berhenti dan tanya user — jangan buat asumsi lalu jalan terus. Section 4 (Kategori) sudah punya beberapa keputusan yang dikonfirmasi eksplisit oleh user (lihat 4.1) — jangan diubah tanpa konfirmasi ulang.
3. **Section 4 (Kategori Per-Cabang) menyentuh data yang dipakai lintas fitur** (`Master_Item.Area`, filter di `app/master-item/page.tsx`, grouping laporan di `lib/google/template-xlsx.ts`). Sebelum submit perubahan apa pun ke sheet `Kategori_Item`, jalankan uji baca-tulis manual dulu di satu cabang test, jangan langsung ke semua cabang produksi.
4. **Jangan sentuh `lib/google/template-xlsx.ts` dan `lib/domain/laporan-service.ts` di luar scope yang diminta.** File-file ini sedang/baru selesai direfactor besar di `PLAN-UPDATE.md` Section 3 (laporan per-tipe input). Section 2 di dokumen ini (Laporan In-App Viewer) **membaca** data yang sama tapi tidak boleh mengubah logic generate XLSX yang sudah ada — itu scope dokumen lain.
5. **Proteksi role harus konsisten dua lapis: server DAN frontend.** Pola yang sudah ada di codebase ini (`app/api/master-item/route.ts` baris 18, `requiredRole: 'admin'`) adalah proteksi server-side, tapi `master-item/page.tsx` sendiri **tidak** menyembunyikan UI admin dari petugas (`hasAnyRole` di-import tapi tidak dipakai — ini bug lama, bukan pola yang harus ditiru). Untuk semua UI baru di dokumen ini yang admin-only (khususnya Section 4), **kedua lapis wajib ada**: sembunyikan tombol/menu di frontend dengan `hasAnyRole(['admin'])`, DAN tetap gate endpoint-nya di server. Jangan andalkan salah satu saja.
6. **Jangan gabungkan unifikasi `/docs` vs `/panduan` (Section 5) dengan perubahan fitur lain dalam satu commit.** Ini murni konsolidasi konten/navigasi, risikonya beda dari perubahan data/logic — pisahkan supaya gampang di-rollback kalau ada masalah.
7. **Test di mobile browser sungguhan untuk Section 3 (popup gate) dan Section 1 (touch target fix)**, bukan cuma resize desktop browser. `AUDIT-UIUX.md` C3 sudah mencatat masalah touch-target yang sebelumnya lolos dari testing desktop.
8. **Jangan modifikasi `PLAN-UPDATE.md` yang sudah ada.** Kalau ada tumpang tindih file antara dua dokumen, kerjakan sesuai urutan di Section 6 (Execution Order) di bawah.

---

## 2. Laporan Bisa Dilihat Langsung di App (Bukan Cuma File Spreadsheet)

### 2.1 Kondisi saat ini
`app/laporan/page.tsx` menampilkan daftar laporan dengan link `Link_PDF` / `Link_XLSX` yang membuka file di Google Drive. Untuk melihat isi laporan (item per item, status stok), user **harus membuka file XLSX**. `AUDIT-UIUX.md` **M29** mencatat hal yang sama dari sisi halaman konfirmasi: *"Confirmation Page Does Not Show Actual Items Entered — user must open XLSX to verify item-level data."*

### 2.2 Yang dibangun
Halaman viewer baru: **`app/laporan/[laporanId]/page.tsx`** — render tabel laporan langsung di UI, read-only, sebagai representasi in-app dari isi laporan (bukan generate ulang file).

- **Sumber data:** reuse `getLaporanDetail` dari `lib/domain/laporan-service.ts` (fungsi yang sama yang dipakai fitur edit laporan di `PLAN-UPDATE.md` Section 1) — **jangan bikin query/endpoint baru yang duplikat**, cukup pastikan fungsi ini punya endpoint GET yang bisa dipanggil dari halaman viewer (`GET /api/laporan/[laporanId]/detail` jika belum ada — cek dulu, karena kemungkinan besar sudah ada untuk keperluan edit).
- **Tampilan:** grouping per Area (sama seperti struktur XLSX — divider Area, lalu tabel item), warna status (KRITIS/HAMPIR HABIS/AMAN) sesuai logic yang sudah ada, supaya konsisten secara visual dengan file XLSX-nya, bukan tampilan baru yang berbeda.
- **Bukan pengganti file XLSX/PDF** — file tetap dipertahankan sebagai opsi export/print/share ke WhatsApp. Viewer ini adalah cara **tambahan** untuk cek cepat tanpa download.
- **Entry point:** dari `app/laporan/page.tsx`, ganti/lengkapi link "Buka XLSX" dengan link ke viewer in-app sebagai aksi utama, XLSX/PDF jadi aksi sekunder ("Unduh XLSX", "Unduh PDF").

### 2.3 Pertanyaan yang perlu dikonfirmasi user sebelum halaman ini dibangun
- Apakah viewer ini **read-only murni**, atau langsung digabung dengan fitur edit laporan dari `PLAN-UPDATE.md` Section 1 (jadi satu halaman: lihat + edit)? Ini memengaruhi apakah section ini dikerjakan sebelum/sesudah/bersamaan dengan `PLAN-UPDATE.md` Section 1 — lihat Section 6 (Execution Order) di bawah.
- Untuk tipe item `text` dan `expiry` (jika sudah ditambahkan dari `PLAN-UPDATE.md` Section 3), pastikan viewer ini render sesuai tipe masing-masing, bukan asumsikan semua item punya struktur `dual`.

---

## 3. Popup Wajib Pilih Cabang & Shift Setiap Masuk Input SO

### 3.1 Konfirmasi keputusan user
- Muncul **setiap kali** masuk ke `/so/input` (bukan sekali per sesi login).
- Tujuan: mencegah petugas keliru submit SO ke cabang/shift yang salah.

### 3.2 Kondisi saat ini (root cause yang dikonfirmasi)
- `lib/CabangContext.tsx` — cabang **otomatis terpilih** dari `localStorage` atau cabang pertama yang diizinkan, tanpa konfirmasi eksplisit dari user.
- `app/so/input/page.tsx` (~baris 274) — shift default `'Opening'` tanpa dipaksa pilih.

### 3.3 Desain gate
- **Komponen baru:** `components/ShiftCabangGate.tsx` — modal 2-step (Cabang → Shift), tombol "Lanjut" disabled sampai keduanya dipilih.
- **Scope:** gate ini **hanya** membungkus halaman `/so/input`, **bukan** ditaruh di `CabangContext` global — supaya dashboard, laporan, master-item tidak ikut ter-block popup ini (`CabangContext` tetap dipakai apa adanya untuk halaman-halaman itu).
- **State terpisah dari `CabangContext`:** gunakan `sessionStorage` atau state lokal komponen untuk "shift+cabang terkonfirmasi untuk masuk kali ini" — jangan dicampur dengan `selectedCabang` yang disimpan context untuk kebutuhan halaman lain.
- **Pre-fill, bukan kosong:** nilai `localStorage`/`CabangContext` terakhir dipakai sebagai default terpilih di dalam modal — user tinggal konfirmasi (klik "Lanjut"), bukan mulai dari kosong setiap kali. Ini supaya popup terasa sebagai *verifikasi*, bukan *pekerjaan berulang yang menjengkelkan*.
- **Reset trigger:** popup muncul lagi setiap kali route berubah **menjadi** `/so/input` dari halaman lain (termasuk refresh halaman). Kalau user sudah di `/so/input` dan cuma re-render internal (bukan navigasi baru), tidak perlu muncul ulang.

### 3.4 Interaksi dengan draft yang sudah ada
`app/so/input/page.tsx` sudah punya mekanisme draft (`draft.shift`, ~baris 481). Kalau ada draft tersimpan untuk kombinasi cabang+shift tertentu:
- Modal tetap muncul (jangan di-skip), tapi **pre-filled dari draft tersebut**, bukan dari `localStorage` cabang terakhir. Ini menjaga tujuan awal (langkah konfirmasi sadar) sambil tidak membuang draft yang sudah diisi.
- Kalau user di modal memilih kombinasi cabang+shift yang **berbeda** dari draft yang ada, tampilkan peringatan eksplisit: draft yang ada adalah untuk kombinasi lain, dan akan diabaikan/tidak dipakai — jangan diam-diam menimpa draft tanpa pemberitahuan.

### 3.5 Yang perlu ditanyakan ke user sebelum build
- Kalau petugas hanya punya **satu** cabang yang diizinkan (bukan admin multi-cabang), apakah step "pilih cabang" tetap ditampilkan (read-only, tinggal konfirmasi) atau di-skip otomatis ke step shift saja? Ini memengaruhi jumlah klik untuk kasus paling umum (petugas 1 cabang).

---

## 4. Edit Kategori (Area) di Master Item — Admin, Per-Cabang

### 4.1 Keputusan yang sudah dikonfirmasi user
- Kategori **per-cabang**, bukan global.
- Dikelola **admin saja** (global-admin atau cabang-admin sesuai `cabangId` di akun mereka), **bukan** petugas — read-only untuk petugas.
- Tidak ada role baru — reuse role `admin`/`petugas` yang sudah ada plus pola `cabangId` yang sudah dipakai di `CabangContext.tsx` untuk membedakan global-admin vs cabang-admin.

### 4.2 Kondisi saat ini (root cause yang dikonfirmasi)
- `app/master-item/page.tsx` — `Area` (kategori) dan `Tipe_Input` adalah **konstanta hardcoded di frontend** (`DEFAULT_AREAS`, `TIPE_OPTIONS`), bukan data dari sheet. Admin tidak bisa ubah tanpa ubah kode.
- `Master_Item.Area` saat ini disimpan sebagai **teks bebas**, bukan referensi ID.

### 4.3 Desain data
- Sheet baru **per spreadsheet-cabang**: `Kategori_Item` — kolom: `Kategori_ID`, `Nama_Kategori`, `Urutan`, `Aktif`.
- `Master_Item.Area` **tetap disimpan sebagai teks nama kategori** (bukan diubah ke ID) — lebih murah diimplementasikan untuk sistem berbasis Sheets-as-DB, dan tetap terbaca manusiawi langsung di spreadsheet. Validasi dilakukan di level aplikasi: hanya boleh pilih dari kategori **aktif** milik cabang tsb saat input/edit Master Item.
- **Seed data cabang baru:** saat cabang baru dibuat dari template, sheet `Kategori_Item` di-clone dan diisi default dari isi `DEFAULT_AREAS` yang sekarang hardcoded (dipindah jadi seed row, bukan dihapus begitu saja) — supaya cabang lama dan baru tetap konsisten di titik awal, baru bisa diubah admin dari situ.
- **Rename kategori = bulk update.** Kalau admin rename `Nama_Kategori`, semua baris `Master_Item.Area` di cabang itu yang pakai nama lama **harus** ikut di-update ke nama baru dalam satu operasi — bukan cuma ubah baris di sheet `Kategori_Item`. Ini bagian paling rawan salah kalau dikerjakan terburu-buru (lihat Agent Behavior Rule #3).
- **Nonaktifkan, bukan hapus keras.** Kategori yang "dihapus" dari sisi admin cukup di-set `Aktif = FALSE` — item lama yang masih memakai kategori itu tidak boleh jadi rusak/orphan. Kategori nonaktif tidak muncul di pilihan saat tambah/edit item baru, tapi item existing yang sudah pakai kategori itu tetap tampil apa adanya.

### 4.4 API baru
- `GET /api/master-item/kategori?cabang=X` — daftar kategori (untuk dropdown, termasuk yang nonaktif kalau dipanggil dari halaman kelola, hanya aktif kalau dipanggil dari form tambah/edit item).
- `POST /api/master-item/kategori` — tambah kategori baru.
- `PUT /api/master-item/kategori/[kategoriId]` — rename / ubah urutan / toggle aktif. Rename **wajib** trigger bulk-update `Master_Item.Area` seperti dijelaskan di 4.3.
- Semua endpoint: `requiredRole: 'admin'` (pola sama seperti `app/api/master-item/route.ts` baris 18) **plus** scoping cabang — cabang-admin (punya `cabangId`) hanya boleh akses kategori cabangnya sendiri; global-admin (tanpa `cabangId`) boleh akses semua. Reuse pola `assertCabangAccess` yang sudah dipakai endpoint lain (mis. `laporan/[id]/regenerate`), jangan tulis ulang logic pembatasan ini dari nol.

### 4.5 UI baru
- Section/halaman baru "Kelola Kategori" di dalam `app/master-item/page.tsx` atau sub-route terpisah (`app/master-item/kategori/page.tsx`) — pilih sesuai kebiasaan struktur route yang sudah ada di project ini, cek dulu pola serupa (mis. bagaimana `app/cabang` atau `app/petugas` diorganisir) sebelum memutuskan.
- Tombol "Kelola Kategori" **disembunyikan** untuk non-admin di frontend (`hasAnyRole(['admin'])` — lihat Agent Behavior Rule #5, karena `hasAnyRole` di file ini saat ini di-import tapi tidak dipakai, jangan warisi bug itu ke fitur baru).
- List kategori dengan drag-to-reorder (opsional — tanya user apakah `Urutan` perlu bisa diubah manual lewat drag, atau cukup input angka biasa) + toggle aktif/nonaktif + tombol rename.

### 4.6 Yang perlu ditanyakan ke user sebelum build
- Format `Kategori_ID`: auto-generate (mis. `KAT-001`) atau slug dari nama (mis. `freezer-ayam`)?
- Batas jumlah kategori per cabang — ada batas wajar atau bebas?

---

## 5. Docs & Tutorial per Fitur

### 5.1 Temuan yang jadi dasar (dari `AUDIT-UIUX.md`)
- **m14** — `app/panduan/page.tsx` cukup lengkap tapi **tidak ditautkan dari navigasi manapun** — tidak ditemukan user.
- **m15 / S3** — Ada **dua sistem dokumentasi terpisah** (`/docs` dan `/panduan`) dengan kemungkinan konten tumpang tindih, membingungkan mana yang jadi rujukan utama.
- Sistem `/docs` (`app/docs/user-guide/*` + `DocsSidebar`, `DocsSearch`, `DocsTOC`) sudah cukup lengkap untuk fitur-fitur existing (dashboard, laporan, master-item, petugas, cabang, stock-opname).

### 5.2 Scope
1. **Audit isi `/panduan` vs `/docs`** — bandingkan topik yang di-cover masing-masing. Untuk topik yang sama, tentukan mana yang lebih lengkap/akurat sebagai sumber gabungan (**jangan asumsikan salah satu otomatis menang** — cek isinya dulu, tanya user kalau tidak jelas mana yang mau dipertahankan).
2. **Unifikasi jadi satu sistem** (`/docs` sebagai kandidat utama karena sudah punya sidebar/search/TOC yang lebih terstruktur) — pindahkan konten unik dari `/panduan` yang belum ada di `/docs`, lalu redirect `/panduan` ke `/docs` (jangan hapus route langsung tanpa redirect, supaya link lama yang mungkin sudah dibagikan tidak 404).
3. **Tambah halaman docs untuk fitur baru** di dokumen ini begitu masing-masing selesai dibangun:
   - Laporan in-app viewer (Section 2)
   - Popup gate cabang/shift (Section 3)
   - Kelola kategori (Section 4)
4. **Link kontekstual** — tombol "?" kecil di tiap halaman fitur yang membuka docs terkait langsung (bukan cuma dari sidebar `/docs` yang terpisah dari halaman kerja).
5. **Tautkan `/panduan` (atau hasil unifikasinya) dari navigasi** — perbaiki m14, pastikan ada entry point yang jelas (nav menu / footer / help icon), bukan halaman yatim.

### 5.3 Urutan pengerjaan section ini
Kerjakan **paling akhir** dari 5 section di dokumen ini (lihat Section 6) — supaya dokumentasi fitur baru (Section 2–4) ditulis setelah fiturnya benar-benar jadi, bukan berdasarkan rencana yang mungkin berubah saat implementasi.

---

## 6. Suggested Execution Order

1. **Section 1 (Dashboard)** — paling independen, tidak bergantung pada section lain, langsung terasa manfaatnya.
2. **Section 3 (Popup Gate Cabang/Shift)** — independen dari data laporan/kategori, risiko rendah, dampak langsung ke masalah "keliru submit" yang jadi motivasi awal.
3. **Section 4 (Kategori Per-Cabang)** — kerjakan sebelum Section 2, karena Section 2 (viewer laporan) menampilkan grouping per-Area yang idealnya sudah konsisten dengan sumber kategori yang benar (bukan lagi hardcoded).
4. **Section 2 (Laporan In-App Viewer)** — di akhir sebelum docs, karena berkaitan langsung dengan `PLAN-UPDATE.md` Section 1 (edit laporan) dan Section 3 (laporan per-tipe) — **cek dulu status pengerjaan `PLAN-UPDATE.md` sebelum mulai**, karena viewer ini reuse `getLaporanDetail` dan idealnya dibangun setelah refactor tipe-input di dokumen itu selesai, bukan sebelum/bersamaan (lihat Agent Behavior Rule #4).
5. **Section 5 (Docs)** — paling akhir, mendokumentasikan hasil final dari Section 1–4.

## 7. Explicitly Out of Scope

- Perubahan yang sudah tercakup di `PLAN-UPDATE.md` (edit laporan same-link, bug input angka duplikat digit, laporan per 6 tipe input) — dokumen ini melengkapi, bukan menggantikan.
- C1–C5 dan sisa temuan Major/Minor lain di `AUDIT-UIUX.md` yang tidak disebut eksplisit di Section 1 — dikerjakan sebagai task audit terpisah, bukan bagian dari 5 fitur di dokumen ini.
- Redesign visual besar-besaran di luar yang secara langsung dibutuhkan Section 1–5.
- Role baru di luar `admin`/`petugas` yang sudah ada.
