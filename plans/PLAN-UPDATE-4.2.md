# PLAN-UPDATE-4.2 — Master Items Table UI Refactoring

## Goal

Standardize the master items table UI: consistent input sizes, alignment, typography, status badges, and action buttons.

## File

| File | Change |
|------|--------|
| `app/master-item/page.tsx` | All table UI refactoring |

## Changes

### 1. Input Standardization

Add constants at top of file:
```ts
const INPUT_BASE = 'h-9 px-3 rounded-lg border border-base-300 text-sm font-normal tabular-nums bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';
const INPUT_NUM = `${INPUT_BASE} text-center w-20`;
const INPUT_TEXT = `${INPUT_BASE} w-full`;
```

All table inputs use `INPUT_NUM` (Threshold Baru) or `INPUT_TEXT` (Keterangan).
All modal inputs use same base classes.

### 2. Row Height & Alignment

- `<tr>` → fixed `h-14` (56px)
- All `<td>` → `px-3` + vertical centering
- Remove `py-3` from all `<td>` (height comes from `<tr>`)

### 3. Column Widths (Header)

| Column | Width | Align |
|--------|-------|-------|
| No | `w-10` | center |
| Nama Barang | flex-1 | left |
| Area | `w-32` | left |
| Satuan | `w-16` | center |
| Tipe Input | `w-36` | center |
| Threshold | `w-20` | center |
| Threshold Baru | `w-24` | center |
| Keterangan | `w-48` | left |
| Status | `w-24` | center |
| Aksi | `w-28` | center |

### 4. Status Badge

- Aktif: `bg-success/10 text-success border border-success/20` with dot, pill shape
- Nonaktif: `bg-base-200 text-base-content/50`, pill shape
- Both: `px-2.5 py-1 rounded-full text-xs font-semibold`

### 5. Action Button

- Nonaktifkan: outlined red — `border border-error/30 text-error hover:bg-error/5`
- Aktifkan: outlined green — `border border-success/30 text-success hover:bg-success/5`
- Both: `px-2.5 py-1 rounded-lg text-xs font-semibold`

### 6. Typography

- Nama Barang: `font-normal text-sm` (not font-medium)
- Threshold display: `font-semibold tabular-nums text-sm`
- Keterangan display: `font-normal text-xs`
- Area badge: `font-normal text-xs`
- Area divider: `font-bold uppercase tracking-wider`
- Header: `font-semibold text-xs uppercase tracking-wider text-base-content/50`

### 7. Threshold Display Cell

Match input height: `inline-flex items-center justify-center h-9 min-w-[3rem] px-2 rounded-lg bg-base-200/50 text-sm font-semibold tabular-nums text-base-content/70`

### 8. Area Divider

`px-3 py-2.5 bg-base-200/40` (consistent spacing)

## Verification

- [ ] Lint passes (`npm run lint`)
- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Visual: all inputs same height, same border-radius, same border
- [ ] Visual: rows fixed height, content vertically centered
- [ ] Visual: status badge is solid pill
- [ ] Visual: action buttons have clear outlined boundaries
- [ ] Visual: Nama Barang is normal weight
