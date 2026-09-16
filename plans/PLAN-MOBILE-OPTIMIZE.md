# PLAN-MOBILE-OPTIMIZE — Mobile UI Optimization

> **Goal:** Fix all mobile UX issues across master-item page (primary focus) and related pages.
> **Scope:** Touch targets, bottom sheet bugs, missing mobile features, typography consistency, safe area, skeleton loading.
> **Stack:** Next.js + Tailwind 4 + DaisyUI + Framer Motion + Lucide icons.

---

## Audit Summary — Issues Found

### 🔴 Critical (Broken UX)
| # | Issue | Location |
|---|-------|----------|
| 1 | Bottom sheet `<label>` elements have no `<input>` — clicks do nothing | `page.tsx:1465` |
| 2 | `TipeInputDropdown` footer buttons (Simpan/Batal/Reset) too small to tap | `page.tsx:220-235` |
| 3 | Pagination buttons `w-7 h-7` (28px) — below 44px minimum | `page.tsx:1368-1382` |

### 🟡 High (Poor Touch UX)
| # | Issue | Current Size | Target |
|---|-------|-------------|--------|
| 4 | Category pills `py-1.5 text-[10px]` | ~28px | ≥44px |
| 5 | Back button `p-1.5` | 24px | ≥44px |
| 6 | Header Edit/Add buttons `p-2` | 32px | ≥44px |
| 7 | Area group header `px-1 py-1` | ~18px | ≥44px |
| 8 | Mobile floating save bar buttons | padding too small | ≥44px |
| 9 | Bottom sheet drag handle `h-1` | 4px | 6px+ |

### 🟢 Medium (Missing Mobile Features)
| # | Issue |
|---|-------|
| 10 | No search clear button on mobile (desktop has X) |
| 11 | No skeleton loading (spinner only) |
| 12 | No status/tipe filters on mobile (desktop has dropdowns) |
| 13 | Add Item modal grid-cols-3 too cramped on small screens |
| 14 | No safe area handling for notch devices |
| 15 | Mobile pagination text too small text-[10px] |

### ℹ️ Low (Polish)
| # | Issue |
|---|-------|
| 16 | Inconsistent font sizes: 9px, 10px, 11px, 12px, 13px |
| 17 | No haptic feedback on key interactions |
| 18 | Category pills have no scroll indicator |

---

## Tasks (15 total, 4 phases)

### Phase 1 — Critical Fixes
1. Fix bottom sheet `<label>` click bug — change to `<div onClick>` with toggle handler

### Phase 2 — Touch Targets (7 tasks)
2. Category pills → `px-4 py-2.5 min-h-[44px]`
3. Pagination → `min-w-[44px] min-h-[44px]`
4. Header buttons → `min-w-[44px] min-h-[44px]`
5. Area group header → `px-2 py-3 min-h-[44px]`
6. TipeInputDropdown footer → `px-3 py-2 min-h-[36px]`
7. Floating save bar → `px-4 py-2.5 min-h-[44px]`
8. Bottom sheet drag handle → `w-12 h-1.5`

### Phase 3 — Missing Features
9. Search clear button (X icon) on mobile
10. Status/tipe filter pills below category pills
11. Add Item modal → `grid-cols-1 sm:grid-cols-3`

### Phase 4 — Polish
12. Safe area padding (`env(safe-area-inset-bottom)`)
13. Standardize font sizes (eliminate 9px, use 10px/xs/sm consistently)
14. Skeleton loading cards while data loads
15. Haptic feedback (`navigator.vibrate`) on save/toggle/apply

---

## Verification
- `npm run lint` → 0 errors
- `npm test` → 21/21 pass
- `npm run build` → success
- Manual: all touch targets ≥ 44px, bottom sheet clicks work, search clear works, filters visible on mobile
