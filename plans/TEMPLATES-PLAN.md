# PLAN: Perbaikan `template-xlsx.ts` — Dukung Multi-Table per Area

## 1. Masalah

Template `PREVIEW SO FORMAT REPORTS.xlsx` (sheet `SO DETAILS`) dibuat dengan **5 Excel Table native terpisah**:

| Table | Range asli (template) | Diduga isi |
|---|---|---|
| `Table1_2` | `A5:M38` | Area 1 |
| `__2` (Table2) | `A43:M71` | Area 2 |
| `Table3_2` | `A73:M118` | Area 3 |
| `Table4_2` | `A121:M138` | Area 4 |
| `Table5_2` | `A141:M154` | Area 5 (kemungkinan Utilitas) |

Tiap Table adalah objek OOXML independen (`xl/tables/table*.xml`) — inilah yang membuat sorting/filter satu Table tidak memengaruhi Table lain, sesuai kebutuhanmu.

Kode `generateXlsxFromTemplate` (commit `97c4db5`) saat ini:
1. Menghapus semua baris dari row 6 ke bawah (`w._rows.splice(5, ...)`) tanpa memperhitungkan bahwa baris-baris itu adalah anggota 5 Table berbeda.
2. Menulis ulang semua item sebagai **satu aliran baris** dengan divider/subheader manual per Area — bukan mengisi ke masing-masing Table.
3. Tidak memanggil `ws.addTable()` atau API Table apa pun dari ExcelJS.

**Akibat:** setiap kali laporan digenerate, struktur 5 Table di template hilang. File hasil generate jadi satu range data panjang tanpa Table object — sorting per-area di Excel tidak lagi berfungsi karena tidak ada lagi Table yang membatasi.

## 2. Keputusan Desain

### 2.1 Jumlah item per Area itu dinamis
Setiap laporan bisa punya jumlah item berbeda per Area (tergantung Master Item cabang). Range Table di template (`A5:M38`, dst.) itu ukuran **saat desain**, bukan ukuran final tiap generate. Jadi:

- Table **tidak bisa** dipertahankan apa adanya dengan resize manual — ExcelJS tidak punya API resize Table yang aman untuk kasus insert/delete row di tengah sheet.
- Pendekatan yang benar: **hapus semua Table lama dari worksheet, tulis ulang data per Area, lalu buat Table baru per Area** dengan range yang sesuai jumlah baris aktual.

### 2.2 Pemetaan Area → Table
Perlu konfirmasi ke pemilik template: apakah 5 Table ini **fixed 1 Table = 1 Area tertentu** (misal Table1 selalu utk Area "Kitchen", Table5 selalu utk "Utilitas"), atau sekadar 5 slot yang diisi sesuai Area yang ada di data (jumlah Area bisa < 5 atau > 5 tergantung Master Item cabang).

**Asumsi kerja (perlu dikonfirmasi):** jumlah Table = jumlah Area yang benar-benar ada di data laporan tsb (dinamis), bukan fixed 5. Kalau cabang X cuma punya 3 Area, hasil generate cuma 3 Table. Section Utilitas (kalau ada) jadi 1 Table tambahan di akhir.

### 2.3 Styling per Table
Template pakai `tableStyleInfo` (nama style: `SO DETAILS-style`, `SO DETAILS-style 2`, dst.) — ini styling bawaan Excel/Sheets Table (banded rows, header row berwarna). Styling manual yang sudah ada di kode (`row.getCell(c).fill = ...`) tetap dipertahankan sebagai pewarnaan kondisional (status kritis/aman), Table style cuma menentukan look banded-row & header, tidak konflik.

## 3. Perubahan pada `template-xlsx.ts`

### 3.1 Hapus pendekatan splice manual, ganti dengan rebuild penuh area sheet
```
Langkah baru:
1. Baca & simpan definisi 5 Table lama (tableStyleInfo names) sebagai referensi style — lalu hapus semua Table dari worksheet (ws.tables / removeTable per nama).
2. Un-merge semua cell row 6+ (tetap perlu, existing logic).
3. Truncate rows 6+ (tetap perlu, existing logic).
4. Untuk setiap Area (dan Utilitas jika ada):
   a. Tulis divider row (opsional, atau dihilangkan jika Table sudah punya header sendiri — lihat 3.2).
   b. Tulis subheader (header kolom) — TAPI ini sekarang jadi header row bawaan Table (headerRow di addTable), bukan manual.
   c. Tulis item rows.
   d. Catat rentang startRow–endRow area ini.
   e. ws.addTable({ name, ref: `A${start}:M${end}`, headerRow: true, style: {...}, columns: [...], rows: [...] })
5. Lanjut ke Area berikutnya, mulai row setelah Table sebelumnya (+ spasi baris kosong sebagai pemisah visual antar Table, opsional).
```

### 3.2 Konflik yang perlu diselesaikan: divider row vs Table header
Kode existing punya row `divider` (nama Area, background biru) SEBELUM row `subheader` (header kolom). Excel Table (`addTable`) mengharuskan row pertama Table adalah header kolom (`headerRow: true`) — tidak bisa menyisipkan divider sebagai bagian dari Table.

**Solusi:** divider row Area (`▶ AREA X`) tetap ditulis manual **di luar/di atas** range Table (row terpisah, bukan row 1 Table), lalu Table dimulai persis di row setelahnya (row subheader = header Table). Jadi tiap Area: `[divider row] [Table: header + item rows]`.

### 3.3 Rebuild fungsi `addTable` per area
```ts
function buildAreaTable(
  ws: Worksheet,
  startRow: number,
  areaName: string,
  items: XlsxItem[],
  tableIndex: number
): number /* returns nextRow */ {
  // 1. tulis divider row di startRow
  // 2. hitung header + item rows mulai startRow+1
  // 3. panggil ws.addTable({ name: `Area_${tableIndex}`, ref: `A${startRow+1}:M${startRow+1+items.length}`, ... })
  // 4. return startRow + 1 (header) + items.length + 1 (spasi ke area berikut)
}
```

### 3.4 Definisi kolom Table (samakan persis template)
Table columns harus didefinisikan ulang persis 13 kolom seperti `table1.xml` (No, NAMA BARANG, SATUAN, THRESHOLD, STEP 1 UTUH, STEP 2 TERBUKA, TOTAL, STEP 1 UTUH_2, STEP 2 TERBUKA_2, TOTAL 2, PEMAKAIAN, STATUS STOK, KETERANGAN) — nama kolom harus **unique per Table** dalam satu sheet jika ExcelJS/Excel mengharuskan (perlu verifikasi — OOXML biasanya izinkan nama kolom sama di Table berbeda, tapi worth diuji).

## 4. Risiko & Hal yang Perlu Diuji

| Risiko | Mitigasi |
|---|---|
| ExcelJS versi yang dipakai (`^4.4.0`) mungkin punya keterbatasan API `addTable()` untuk kasus banyak Table dalam satu sheet | Buat spike/uji coba kecil dulu: generate 1 sheet dengan 2 `addTable()` panggilan, buka di Excel asli, cek tidak corrupt |
| File hasil generate harus tetap valid dibuka Excel & Google Sheets (bukan cuma ExcelJS yang bisa baca) | Uji buka manual di kedua aplikasi setelah tiap perubahan |
| Formula existing (`SUM`, `IF` status) di dalam range Table — apakah formula tetap works dalam konteks Table (structured reference vs cell reference biasa) | Pertahankan formula pakai cell reference biasa (`H6`, bukan `[@STEP1]`) — lebih aman, tidak bergantung fitur structured reference Table |
| Named range `_xlnm._FilterDatabase` di template mengacu ke `A43:M71` (Table2 lama) — akan jadi stale setelah rebuild | Hapus defined name ini saat rebuild, atau re-generate sesuai Table baru |
| Jumlah Area dinamis (bisa 1, bisa 8) — desain Table style harus tetap konsisten meski jumlah Table berubah tiap generate | Looping style generik `SO DETAILS-style N` per index, bukan hardcode 5 |

## 5. Urutan Eksekusi

1. **Konfirmasi ke pemilik project:** apakah 5 Table = fixed per Area tertentu, atau dinamis mengikuti Area yang ada di data (asumsi kerja: dinamis)
2. **Spike kecil:** tes `ws.addTable()` ExcelJS dengan 2 Table dalam 1 sheet + formula — pastikan file tidak corrupt saat dibuka Excel & Sheets
3. Refactor `generateXlsxFromTemplate`:
   - Hapus logic splice manual lama
   - Implementasi rebuild per Area dengan `addTable()` sesuai 3.1–3.4
   - Pertahankan semua styling kondisional (warna status) yang sudah ada
4. Hapus/update defined name `_FilterDatabase` yang stale
5. Uji generate laporan dengan variasi jumlah Area (1 area, 5 area, 8 area) — pastikan Table ter-generate benar tiap kasus
6. Uji manual: buka hasil generate di Excel, sort salah satu Table by kolom STATUS STOK, verifikasi Table lain tidak ikut ter-sort
7. Regression test: pastikan fitur existing (regenerate laporan, note section, utilitas boolean/token) masih jalan setelah refactor

## 6. Pertanyaan Terbuka (jawab sebelum mulai koding)

1. 5 Table di template — fixed per Area spesifik, atau dinamis sejumlah Area yang ada di data?
2. Section "Note" (`KETERANGAN / CATATAN`) di akhir — tetap di luar semua Table (baris biasa), bukan bagian dari Table manapun. Konfirmasi ini benar?
3. Section Utilitas — dianggap 1 Table tersendiri (terpisah dari Table Area), atau digabung ke Table Area terakhir?
4. Apakah user (yang membuka hasil laporan) benar-benar akan pakai fitur sort di Excel setelah download, atau ini cuma soal menjaga template tetap konsisten strukturnya? (Menentukan seberapa prioritas testing sorting manual di step 6)
