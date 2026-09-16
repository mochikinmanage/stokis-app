# PLAN-UPDATE-4.1 — Batch Edit Mode + Checkbox Tipe Input

## Goal

Master Item page:
1. **Batch edit mode** — one "Ubah" button enables editing for all rows, one "Simpan Semua" saves all changes in a single API call.
2. **Checkbox tipe input** — replace 23+ option dropdown with 6 checkboxes (dual, single, boolean, date, expiry, text). Dual/single are mutually exclusive; others are additive.

## Files

| File | Action |
|------|--------|
| `app/master-item/page.tsx` | Edit — batch edit state, checkbox component, UI restructure |
| `app/api/master-item/batch/route.ts` | **New** — batch PATCH endpoint |
| `lib/domain/master-item-service.ts` | Edit — add `batchUpdate()` function |

## Backend

### `lib/domain/master-item-service.ts` — add `batchUpdate()`

```ts
export async function batchUpdate(
  cabangId: string,
  updates: Array<{
    itemId: string;
    threshold?: number;
    tipeInput?: string;
    keterangan?: string;
  }>
): Promise<{ updated: number }>
```

- Read `Master_Item` sheet once
- For each update entry, find row by `itemId`, write changed cells
- `tipeInput` normalization: reuse same logic as `updateTipeInput()` (lowercase, dedupe, dual/single conflict, whitelist check)
- Return `{ updated: count }`

### `app/api/master-item/batch/route.ts` — new endpoint

```
PATCH /api/master-item/batch
Body: { cabangId, updates: Array<{itemId, threshold?, tipeInput?, keterangan?}> }
Auth: admin only (withAuth)
```

## Frontend

### State changes (`app/master-item/page.tsx`)

Remove:
- `editingThreshold`, `tempThreshold`
- `editingTipeInput`, `tempTipeInput`
- `editingKeterangan`, `tempKeterangan`
- `handleSaveThreshold()`, `handleSaveTipeInput()`, `handleSaveKeterangan()`

Add:
```ts
const [isEditing, setIsEditing] = useState(false);
const [draftItems, setDraftItems] = useState<Map<string, MasterItem>>(new Map());
const [savingBatch, setSavingBatch] = useState(false);
```

- `draftItems` = only items the user actually changed (not a full copy of all items)
- `isEditing=false` → read-only view (current behavior minus per-row edit)
- `isEditing=true` → inline inputs for threshold, tipe input (checkbox), keterangan

### Edit mode flow

1. **"Ubah" button** (header) → `setIsEditing(true)`
2. User edits any field → `draftItems.set(itemId, { ...original, changedField: newValue })`
3. **"Simpan Semua"** → `POST /api/master-item/batch` with `draftItems` entries → `fetchItems()` → `setIsEditing(false)` → clear draft
4. **"Batal"** → `setIsEditing(false)` → clear draft → no API call

### Tipe Input — checkbox component

```tsx
<TipeInputCheckbox
  value={tipeInputString}
  onChange={(newVal) => setDraftItem(...)}
/>
```

Layout (compact, fits in table cell):
```
Dual | Single | Boolean | Date | Expiry | Text
  ☐      ☐        ☑      ☑      ☐       ☐
```

Rules:
- `dual` and `single` are radio-like — selecting one unchecks the other
- `boolean`, `date`, `expiry`, `text` are independent checkboxes
- Minimum: always at least one type. If all unchecked → revert to `dual`
- On change: build comma-separated string via helper

Helper functions:
```ts
const TIPE_TYPES = ['dual', 'single', 'boolean', 'date', 'expiry', 'text'] as const;

function parseTipeSelection(val: string): Set<string> {
  return new Set((val || 'dual').split(',').map(s => s.trim()).filter(Boolean));
}

function tipeSelectionToComma(selected: Set<string>): string {
  if (selected.size === 0) return 'dual';
  if (selected.has('dual') && selected.has('single')) selected.delete('single');
  if (selected.size === 0) return 'dual';
  // Ensure primary type is first
  const primary = selected.has('dual') ? 'dual' : selected.has('single') ? 'single' : [...selected][0];
  const rest = [...selected].filter(t => t !== primary);
  return rest.length > 0 ? `${primary},${rest.join(',')}` : primary;
}
```

### Table column changes

| Column | `isEditing=false` | `isEditing=true` |
|---|---|---|
| No | `idx + 1` | `idx + 1` |
| Nama Barang | static text | static text (not editable) |
| Area | badge | badge (not editable) |
| Satuan | text | text (not editable) |
| Tipe Input | badge `item.Tipe_Input` | `<TipeInputCheckbox>` |
| Threshold | static number | `<input type="text" inputMode="decimal">` |
| Threshold Baru | (same as threshold) | `<input type="text" inputMode="decimal">` |
| Keterangan | truncated text | `<input type="text">` |
| Status | Aktif/Nonaktif | Aktif/Nonaktif (unchanged) |
| Aksi | Nonaktifkan/Aktifkan | Nonaktifkan/Aktifkan (unchanged) |

When `isEditing=true`:
- Threshold column: show original value as disabled/gray
- Threshold Baru column: show editable input (modifies `draftItems`)
- Both columns visible, "Threshold Baru" is the editable one

### Add modal changes

Replace `<select>` for `Tipe_Input` with same `<TipeInputCheckbox>` component.

```tsx
<TipeInputCheckbox
  value={newItem.Tipe_Input}
  onChange={(val) => setNewItem({ ...newItem, Tipe_Input: val })}
/>
```

### Header buttons

| `isEditing` | Buttons shown |
|---|---|
| `false` | `Kelola Kategori` (admin), `Tambah Item`, `Ubah` (Edit icon) |
| `true` | `Simpan Semua` (primary), `Batal` (ghost), count of changed items badge |

### Dirty detection

Show badge next to "Simpan Semua" with count of changed items:
```ts
const changedCount = draftItems.size;
```

If `changedCount === 0` → "Simpan Semua" is disabled.

## What stays the same

- `handleAddItem()` — POST to `/api/master-item` (add new)
- `handleToggleActive()` — per-row PATCH (action, not data edit)
- `tipeBadgeColor()` — unchanged
- `fetchItems()`, `fetchKategori()` — unchanged
- Kategori modal — untouched
- Backend whitelist/normalization — unchanged
- All other API endpoints — unchanged

## Edge cases

1. **Empty draft**: "Ubah" → "Simpan" without changes → just exit edit mode, no API call
2. **Filtered view**: only filtered items get edit inputs. "Simpan Semua" only sends changes from visible items.
3. **Sort consistency**: `groupedByArea` order unchanged
4. **Error handling**: batch save error → show error message, stay in edit mode, keep draft
5. **Dual/single conflict**: checkbox enforces mutual exclusion — selecting "Single" auto-unchecks "Dual"
6. **All unchecked**: if user unchecks everything → auto-select "dual" as default

## Verification

- [ ] Lint passes (`npm run lint`)
- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Manual: add new item with checkbox tipe input
- [ ] Manual: "Ubah" → edit threshold + tipe input + keterangan for multiple items → "Simpan Semua" → verify all saved
- [ ] Manual: "Ubah" → "Batal" → verify no changes saved
- [ ] Manual: "Ubah" → change nothing → "Simpan Semua" disabled
