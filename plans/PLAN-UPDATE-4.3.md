# PLAN-UPDATE-4.3 — Master Items Enterprise SaaS Redesign

## Goal

Transform the master items page from a utility-style table into an enterprise SaaS dashboard with sticky header, filter tabs, blue-highlighted threshold column, floating save bar, pagination, and mobile card layout with bottom sheet for tipe input.

## Reference

- `plans/prototype-master-item.html` — HTML prototype showing target design (desktop + mobile)

## File

| File | Change |
|------|--------|
| `app/master-item/page.tsx` | All layout/UI refactoring (single file, ~1160 lines) |

## Changes

### Task 1: Desktop — Sticky Header + Breadcrumbs + Item Count Badges

Replace the current header section (L493-571) with:

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Master Item / Input Barang & Konfigurasi            │
│        Daftar Threshold & Input Barang                      │
│        Atur batas minimum stok semua item...   [Import][Export] │
│ [33 Total Item] [31 Aktif]  │  [Kelola Kategori] [+ Tambah Item] │
└─────────────────────────────────────────────────────────────┘
```

- Sticky: `sticky top-0 z-40 bg-white border-b`
- Breadcrumb: `Master Item > Input Barang & Konfigurasi`
- Title: `Daftar Threshold & Input Barang` (text-lg font-bold)
- Description: `Atur batas minimum stok...` (text-sm text-slate-500)
- Right side: item count badges (Total + Aktif) + quick action buttons
- Remove the current icon-in-circle header design
- Move "Ubah"/"Simpan Semua"/"Batal" buttons to floating save bar (Task 4)

**State additions:**
- `activeFilterTab: string` — tracks selected area tab (replaces `selectedArea`)

### Task 2: Desktop — Filter Toolbar with Area Tabs + Search + Dropdowns

Replace the current toolbar (L600-646) with:

```
┌──────────────────────────────────────────────────────────────┐
│ [Semua Area 33][Meja Biru 8][Chiller 7]... │ [Search] [Status▾] [Tipe▾] [Reset] │
└──────────────────────────────────────────────────────────────┘
```

- Area tabs: horizontal pill buttons in `bg-slate-100 rounded-lg p-1` container
  - Active: `bg-white text-blue-700 shadow-sm`
  - Inactive: `text-slate-500 hover:bg-white/50`
  - Each shows count: `Semua Area 33`, `Meja Biru Depan 8`, etc.
- Search: keep existing search input, move into toolbar row
- Status dropdown: `Semua Status` / `Aktif` / `Nonaktif`
- Tipe Input dropdown: `Semua Tipe` / `Dual` / `Single` / `Boolean` / `Date` / `Expiry` / `Text`
- Reset link: `Reset filter` text button (only when filters active)
- Computed: `activeFilterCount` to show/hide reset

**State additions:**
- `selectedStatus: 'Semua' | 'Aktif' | 'Nonaktif'`
- `selectedTipe: string` (comma-separated tipe filter)

**Memo updates:**
- `filteredItems` — add status + tipe filters

### Task 3: Desktop — Table with Blue Threshold Column + Collapsible Groups

Modify the table (L648-846):

**Blue Threshold Column:**
- Threshold Baru column: always visible (not just in edit mode)
- Header: `bg-blue-50 text-blue-600` with blue accent
- Cells: `bg-blue-50/50` background
- Input: `border-2 border-blue-200 text-blue-700` (already exists, add bg)
- Auto-enter edit mode when user focuses on a Threshold Baru input

**Collapsible Area Groups:**
- Area divider row: add `cursor-pointer` and toggle handler
- Chevron rotates on collapse: `transform: rotate(-90deg)`
- Items in group: toggle `display: none` on collapse
- New state: `collapsedAreas: Set<string>` to track which groups are collapsed

**Table header:**
- Make sticky: `sticky top-0 z-10 bg-slate-50/80 backdrop-blur-sm`
- Threshold Baru header: `bg-blue-100 text-blue-600` with `rounded-t-lg`

### Task 4: Desktop — Floating Save Bar + Pagination

**Floating Save Bar:**
- Fixed bottom bar: `fixed bottom-0 left-0 right-0 z-50`
- Shows when `isEditing && draftItems.size > 0`
- Content: amber warning icon + "X item belum disimpan" + "Batal" + "Simpan Perubahan" buttons
- Slide-up animation on appear
- Always visible on mobile (safe area padding)

**Table Pagination:**
- Add state: `currentPage: number` (default 1), `pageSize: number` (default 10)
- Paginate `filteredItems` before rendering
- Table footer row: "Menampilkan 1-10 dari 33 item" + page buttons
- Page buttons: 1, 2, 3... with prev/next arrows
- Auto-reset to page 1 when filters change

### Task 5: Mobile — Card Layout

Add mobile card layout (hidden on `md:`, visible below `md:`):

```
┌─────────────────────────┐
│ 1 Beras Pandan Wangi 5kg│
│ Meja Biru Depan · kg    │
│ ─────────────────────── │
│ [Tipe Input ▾]  [Dual]  │
│ ─────────────────────── │
│ Current: 10  │ New: [10]│
│ ─────────────────────── │
│ Keterangan: [__________]│
│ ─────────────────────── │
│ [   Nonaktifkan         ]│
└─────────────────────────┘
```

- Each card: `bg-white rounded-xl border border-slate-200 shadow-sm`
- Modified items (dirty): `border-blue-200 ring-1 ring-blue-100`
- Card header: item number (w-6 h-6 rounded-md) + name (font-semibold) + area/unit badges + status dot
- Tipe Input trigger button → opens bottom sheet (Task 6)
- Threshold grid: 2-column layout (current gray, new blue-bordered)
- Keterangan: text input
- Action button: full-width outlined

**New component:** `<MobileItemCard>` — extracted card component for mobile

### Task 6: Mobile — Bottom Sheet for Tipe Input

New component: `<TipeInputBottomSheet>`

```
┌─────────────────────────────┐
│         ─── (drag handle)   │
│ Tipe Input          [✕]    │
│ Beras Pandan Wangi 5kg      │
│ SKU: BRG-001                │
│ ─────────────────────────── │
│ [Search tipe input...]      │
│ ─────────────────────────── │
│ [✓] Dual Input    Default   │
│     S1+S2, status dari      │
│     selisih                  │
│ [ ] Single Input             │
│     S2 langsung              │
│ [ ] Boolean                  │
│     Ya/Tidak                 │
│ [ ] Date                     │
│     Tanggal                  │
│ [ ] Expiry                   │
│     Kedaluwarsa              │
│ [ ] Text                     │
│     Teks bebas               │
│ ─────────────────────────── │
│ Reset    [Batal] [Terapkan] │
└─────────────────────────────┘
```

- Backdrop: `fixed inset-0 z-[60] bg-black/40`
- Sheet: `fixed bottom-0 z-[70] bg-white rounded-t-2xl max-h-[85vh]`
- Drag handle: `w-10 h-1 rounded-full bg-slate-300`
- Search input for filtering tipe options
- Options: dual/single (radio-like), boolean/date/expiry/text (checkbox)
- Footer: Reset + Cancel + Apply (with selected count badge)
- Animation: slide up from bottom
- Close on backdrop click or swipe down

**State additions:**
- `bottomSheetOpen: boolean`
- `bottomSheetItemId: string | null` — which item's tipe is being edited
- `bottomSheetDraft: Set<string>` — temporary selection in sheet

## Verification

- [ ] Lint passes (`npm run lint`)
- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Desktop: sticky header with breadcrumbs visible on scroll
- [ ] Desktop: area filter tabs switch correctly, counts update
- [ ] Desktop: status/tipe dropdowns filter items
- [ ] Desktop: Threshold Baru column has blue background
- [ ] Desktop: area groups collapse/expand with chevron animation
- [ ] Desktop: floating save bar appears with unsaved count
- [ ] Desktop: pagination shows correct range, pages navigate
- [ ] Mobile: card layout renders correctly
- [ ] Mobile: bottom sheet opens/closes with animation
- [ ] Mobile: tipe input selection works in bottom sheet
- [ ] Mobile: floating save bar visible at bottom
- [ ] All existing functionality preserved (add item, kategori modal, batch save, toggle active)
