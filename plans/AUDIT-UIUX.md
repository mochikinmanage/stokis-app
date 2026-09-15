# UI/UX & Software Engineering Audit — Stokis Project

**Audit Date:** 2026-09-15
**Scope:** Full codebase at `/home/bradley/project/stokis-project`
**Framework:** Next.js 16.3.3 (App Router) + React 19.2.8 + TypeScript + Tailwind CSS 4 + DaisyUI 5.7 (`data-theme="stokis"`)

## Summary

| Severity | Count |
|----------|-------|
| Critical UX | 7 |
| Major | 24 |
| Minor | 19 |
| Suggestion | 5 |
| **Total** | **55** |

---

## CRITICAL UX

### C1. All SO Form Inputs Are 32px — Below 44px Touch Minimum
**File:** `app/so/input/page.tsx:1322,1336,1225,1253,1272,1214,1241,1260,1287,1296,1305`

S1, S2 count inputs, status select, date inputs, and all read-only reference cells use `h-8` (32px). With ~130 items this is painful to tap on mobile. CSS class `.touch-target { min-height: 44px }` is defined at `app/globals.css:151` but applied to **zero elements** across the entire codebase. Only the submit button (`min-h-[44px]` at L1420) meets the guideline.

**Fix:** Replace `h-8` with `min-h-[44px]` on all interactive inputs. Apply the existing `.touch-target` class.

### C2. No Back Button, No `beforeunload`, No Discard Confirmation
**File:** `app/so/input/page.tsx` (entire file)

No back/cancel button anywhere on the form. No `beforeunload` handler — closing the tab or refreshing with ~130 filled fields loses everything silently. `SOGeneratingOverlay` (L94-96) only shows advisory text ("Mohon jangan menutup..."), no enforcement. `handleDiscardDraft` (L546-549) wipes localStorage draft with **no confirmation dialog**.

**Fix:** Add back navigation, `beforeunload` guard, and confirmation dialog before discarding.

### C3. Bottom Nav Has 8 Items for Admin — Excessive
**File:** `components/Navbar.tsx:39-48`

Admin sees 8 items: Beranda, Input SO, Laporan, Item, Panduan, Lainnya, Tutor, Keluar. Mobile bottom nav best practice is 3-5 items. Petugas see 6. The "Lainnya" item links to `/cabang` (not a "more" menu), and "Tutor"/"Keluar" are action buttons masquerading as nav links.

**Fix:** Reduce to 5 items max. Move secondary actions to a profile/settings menu.

### C4. 22 `useState` in One Component — Every Keystroke Re-renders ~130 Rows
**File:** `app/so/input/page.tsx:256-314`

22 useState hooks in `InputSOPage`. `counts` state (L279) updates on every keystroke. `handleCountChange` (L503-519) spreads the entire counts object. Item rows (L1149-1383) are **inline JSX, not extracted** — no `React.memo`, no virtualization. Each keystroke re-renders all ~130 rows with 6 inline arrow-function onChange handlers per row (L1224,1252,1271,1320,1335,1368). Only 3 useMemo (L458,464,475) and 1 useCallback (L327) in the entire page.

**Fix:** Extract item row into `React.memo`'d component. Add list virtualization. Move handlers to `useCallback`.

### C5. Tour Navigates to Admin-Only `/dashboard/harian` — Petugas Breaks
**Files:** `lib/tour.ts:170-178`, `components/AuthGuard.tsx:10`

Tour step `'dashboard'` navigates to `/dashboard/harian` and targets `[data-onboard="dashboard-heading"]`. AuthGuard (`ADMIN_ONLY_PATHS` includes `"/dashboard"`) redirects petugas to `/`, so the tour step target is never found. Additionally, tour does not verify `selectedCabang` before targeting SO input steps — the UI shows a warning instead of the expected element.

**Fix:** Filter tour steps by user role. Add branch-selection guard before SO-related steps.

### C6. WhatsApp Share Flow Is Broken — `waSent` Never Set From Modal
**File:** `app/so/konfirmasi/[laporanId]/page.tsx:70-72,121-131`

`handleShareWhatsApp()` only opens `WATemplateModal`. The `handleWASent` callback that sets `setWaSent(true)` is **never wired into the modal** — only `onClose` is passed (L385). The modal's internal link opens WhatsApp externally with no confirmation. `waSent` is only set from server-side `Status_Kirim_WA === 'Sudah Dikirim'` on initial fetch (L55-57), not from any user action. The WA button always reads "Siapkan Pesan WhatsApp" regardless of actual send status.

**Fix:** Wire `handleWASent` callback into `WATemplateModal`. Or refactor to track actual delivery status.

### C7. Hardcoded `136` and `MOCHIKIN` Shown to Users as Data
**Files:** `app/so/konfirmasi/[laporanId]/page.tsx:246,388`, `app/laporan/page.tsx:528`

`totalItem || 136` displays hardcoded fallback as authoritative item count in konfirmasi receipt and WA message template. `selectedCabang?.Nama_Cabang || 'MOCHIKIN'` displays hardcoded brand name. Receipt footer (L285) has hardcoded `'*** LAPORAN STRUK RESMI MOCHIKIN ***'`.

**Fix:** Remove magic number fallback. Fetch actual count or hide the field when unavailable. Make brand name dynamic.

---

## MAJOR

### M1. No Progress Indicator for ~130 Items
**File:** `app/so/input/page.tsx:901-904`

Shows `{filteredItems.length} / {items.length} Item` — a filter counter, not a fill-progress counter. `countFilled()` exists (L153-163) and is used for autosave logic (L426) and draft banner (L845), but is never displayed to the user as live progress.

**Fix:** Show `X dari ~130 item terisi` with a visual progress bar.

### M2. Active Nav State Uses `startsWith` — False Positives and Misses
**File:** `components/Navbar.tsx:80-83`

`pathname.startsWith(href)` means `/dashboard/harian` is NOT active when on `/dashboard/mingguan`. And `/so/input` is not active on `/so/konfirmasi/...` (which is actually correct). But `/laporan` highlights when on `/laporan/abc/edit`. Needs exact-match or path-segment logic per route.

**Fix:** Implement route-aware active state detection, not generic `startsWith`.

### M3. Branch Selector Truncates Long Names, No Tooltip
**File:** `components/Navbar.tsx:207`

`max-w-[160px]` + native `truncate` with no `title` attribute. Long branch names are silently clipped.

**Fix:** Add `title={selectedCabang?.Nama_Cabang}` or use a dropdown selector instead.

### M4. Boolean Select and Date Inputs Are 32px
**File:** `app/so/input/page.tsx:1163-1164,1253,1272`

`statusIsi` select and `tglRefill`/`tglPakai` date inputs all use `h-8` (32px). Boolean dropdowns at L1163-1164 are especially hard to tap.

**Fix:** Same as C1 — apply `min-h-[44px]`.

### M5. Chart Toggles Are Icon-Only Buttons — No Visible Labels
**Files:** `app/dashboard/harian/page.tsx:262-274`, `app/dashboard/mingguan/page.tsx:341-355`

Three buttons (bar/line/area) render only an icon with `title` tooltip. No visible label. Tooltip only appears on hover (desktop) — invisible on mobile/touch and to screen readers without `aria-label`.

**Fix:** Add visible text labels or `aria-label` at minimum. Consider pill/tab toggle UI.

### M6. Hardcoded oklch Colors in Recharts — Duplicated from Theme
**Files:** `app/dashboard/harian/page.tsx:48-89`, `app/dashboard/mingguan/page.tsx:56-119`

All chart colors (CartesianGrid, XAxis/YAxis ticks, Tooltip styling, bar/line fills) use hardcoded `oklch(...)` values that duplicate tokens from `globals.css`. If the theme changes, charts will not update. Harian also uses hardcoded hex: `#ef4444`, `#f59e0b`, `#22c55e` (L165-167).

**Fix:** Reference CSS variables or extract theme-aware color constants.

### M7. Date Pickers Refetch Without Debounce — Race Conditions
**Files:** `app/dashboard/harian/page.tsx:131-160`, `app/dashboard/mingguan/page.tsx:202-227`

Both dashboard date pickers fire `fetchDashboard()` / `refetchWithDates()` immediately on every change with no debounce. None of the fetch calls use `AbortController` — rapid date switching causes stale responses to overwrite fresh ones. Same race condition in `so/input/page.tsx:354-415` on cabang switching.

**Fix:** Add debounce to date pickers. Add AbortController to all fetch calls.

### M8. Submit Shows Indeterminate "Memproses..." for 15-30 Seconds
**Files:** `app/so/input/page.tsx:1417-1433`, `components/SOGeneratingOverlay.tsx:66-92`

Submit button shows `QuantumLoaderMini` + "Memproses..." while disabled. The overlay shows a 5-step checklist with done/active/pending styling but no percentage, elapsed time, or sub-progress. The `verifikasi` step (L204-250) polls up to 5x2000ms with a static label — UI appears frozen during polling.

**Fix:** Add progress percentage or time estimate to overlay. Show sub-step progress during verification polling.

### M9. Nav Rail Overlaps Form Content on Narrow Screens
**File:** `app/so/input/page.tsx:1438`

`fixed right-3 sm:right-4 top-1/2 -translate-y-1/2 z-40`. On 320px phones, `right-3` (12px) + 36px button width overlaps the right edge of full-width item rows. No `padding-right` compensation on rows. Rail buttons are also inconsistent sizes: `w-9 h-9`, then `w-8 h-8`, then `w-9 h-9` (L1442-1460).

**Fix:** Add right padding to form rows to clear rail, or move rail to a less intrusive position. Standardize button sizes.

### M10. Implicit Form Submit on Enter in Search/Keterangan Fields
**File:** `app/so/input/page.tsx:833,1037,1364`

The search box, keterangan inputs, and all count inputs live inside `<form onSubmit={handleSubmit}>`. Pressing Enter in the search box (L1037) or any keterangan field (L1364) implicitly submits the form and pops the summary modal.

**Fix:** Add `type="button"` or `e.preventDefault()` on Enter in non-submit fields. Move submit outside `<form>` or use explicit submit button only.

### M11. No `aria-label` on ~60+ Interactive Elements in SO Form
**File:** `app/so/input/page.tsx:1211-1370`

All per-item field labels (S1/S2/Tot/Refill/Pakai/Status) are decorative `<span>`s (L1211-1296) with no `htmlFor`/`aria-label`. Inputs have no `aria-label` — screen reader announces ~130 anonymous edit fields. Search (L1037), keterangan (L1364), filter chips (L1090-1101), and modal close (L1544) are all icon-only or placeholder-only without accessible labels. Only the nav rail buttons (L1443-1462) and previous-SO select (L1000) have `aria-label`.

**Fix:** Add `aria-label` to all form controls. Associate labels with inputs via `htmlFor`/`id`.

### M12. No Skip-to-Content Link
**File:** `app/layout.tsx`

Keyboard users must tab through entire navbar to reach main content. No skip link exists anywhere.

**Fix:** Add `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>` and `id="main-content"` on `<main>`.

### M13. `PageTransition` Component Defined But Never Used as Wrapper
**Files:** `components/PageTransition.tsx:24-40`, `app/layout.tsx:40-42`

`PageTransition` wraps children in `AnimatePresence` + `motion.div` keyed by `pathname`. It's never imported in layout — children renders directly. Only the exported variant objects (`staggerContainer`, `staggerItem`, `fadeIn`, `scaleIn`) are consumed by other files. `slideUp` variant is never imported anywhere.

**Fix:** Wrap `{children}` in `<PageTransition>` in layout.tsx. Remove unused `slideUp` export.

### M14. Near-Zero ARIA Usage Across Entire App
**Files:** All pages and components

Only ~15 `aria-*` attributes across the entire codebase. Missing: `aria-label` on search, `aria-current="page"` on active nav items, `aria-describedby` on error messages, `role="table"` semantics on data grids. Konfirmasi page receipt and laporan tables lack `<caption>`. `WATemplateModal` has no `role="dialog"` or focus trap.

**Fix:** Add `aria-current="page"` to nav, `aria-label` to all icon-only buttons, `role="dialog"` + focus trap to modals.

### M15. QuantumLoader Has No Progress Indication for 15-30s Operations
**File:** `components/ui/QuantumLoader.tsx:9-50`

Pure CSS animated spinner — two pill shapes with rotating animation. No percentage, no steps, no determinate state. Used during initial form load and submit button. `QuantumLoaderFull` is a centered full-screen version. `QuantumLoaderMini` is a 20x20px inline version with `aria-hidden="true"`.

**Fix:** Add determinate progress mode or step-by-step indicator for long operations.

### M16. No Safe-Area-Inset Handling on Notched Devices
**Files:** `app/so/input/page.tsx:1438`, `components/OnboardingTour.tsx:142-151`, `app/so/input/page.tsx:1522`

Nav rail (fixed, right-3), bottom-sheet modals (items-end), and tour overlay have no `env(safe-area-inset-*)` usage. Only the bottom nav bar (`components/Navbar.tsx:258`) has `pb-[env(safe-area-inset-bottom)]`.

**Fix:** Add safe-area insets to all fixed-positioned elements.

### M17. i18n Infrastructure Exists But Unused on 90% of Pages
**Files:** All page files except Navbar and docs

`LanguageContext` provides `lang` toggle (`id`/`en`) and `t()` helper. Used only in `components/Navbar.tsx` and docs pages. All other pages — SO input, dashboards, konfirmasi, laporan, login, tour — have hardcoded Indonesian text with zero `useLanguage()` imports. `MONTHS_SHORT` in mingguan (L35) is hardcoded Indonesian.

**Fix:** Wire `useLanguage`/`t()` into all page files, or remove the infrastructure if i18n is not needed.

### M18. DateTime Bug — UTC Date Used for WIB Timezone
**File:** `app/so/input/page.tsx:273-275`

`new Date().toISOString().split('T')[0]` returns UTC date. For WIB (UTC+7) users between 00:00-06:59 local time, the form pre-fills **yesterday's date**.

**Fix:** Use `toLocaleDateString('en-CA')` or add timezone offset.

### M19. Multiple Inconsistent Border Radius Scales Across Pages
**Files:** `app/page.tsx` (rounded-lg/xl/2xl), `app/dashboard/harian/page.tsx` (bare `rounded`), `app/dashboard/mingguan/page.tsx` (bare `rounded`)

Home page uses `rounded-lg`, `rounded-xl`, `rounded-2xl` for cards and buttons. Dashboard pages use only bare `rounded` (0.25rem) for everything. Visual inconsistency between pages.

**Fix:** Standardize on one border-radius scale. Document in globals.css.

### M20. Multiple Font Sizes Below 12px WCAG Minimum
**Files:** `app/page.tsx:177,203,205,206,751,781`, `app/dashboard/mingguan/page.tsx:59,84,109,424`, `components/Navbar.tsx:119,275,288,302`

`text-[10px]` used for status badges, quick-action descriptions, bottom nav labels, and Recharts tick labels (`fontSize: 10`). WCAG minimum readable font size is 12px. Creates dense, hard-to-read interface especially on mobile.

**Fix:** Increase all text below 12px to minimum 12px. Use `text-xs` (12px) as floor.

### M21. `console.log` / `console.error` in Production Code
**Files:** `app/dashboard/harian/page.tsx:137,140,145,150`, `app/dashboard/mingguan/page.tsx:173,176,182,187,208,211,216,221`, `app/so/input/page.tsx:223,231,236,242,763,766,781`, `app/so/konfirmasi/[laporanId]/page.tsx:60,90`, `app/laporan/page.tsx:140,159`

Total: 20+ console statements in production client-side code. Some include emoji logs (`console.log('✅ XLSX berhasil di-generate:', ...)` at so/input:763).

**Fix:** Remove all console.log. Use proper error boundaries or structured logging.

### M22. `showRegenerate` State Is Dead Code
**File:** `app/so/konfirmasi/[laporanId]/page.tsx:26-42`

`showRegenerate` is read from localStorage key `'so_showRegenerate'` and stored in state, but **never used in the render**. The regenerate button is always shown regardless of this variable.

**Fix:** Remove dead state or wire it into conditional rendering.

### M23. Draft Save Loses "Catatan Laporan" Field
**File:** `app/so/input/page.tsx:141-147,280`

`SODraft` interface (L141-147) does not include `note`. The Catatan Laporan textarea content (L280) is silently excluded from draft persistence. On page refresh, the note is lost.

**Fix:** Add `note` to `SODraft` type and include it in save/restore logic.

### M24. Float Action Bar Is In-Flow, Not Fixed
**File:** `app/so/input/page.tsx:1406-1407`

Comment says `{/* Floating Action Bar */}` but the element is an ordinary in-flow card at the bottom of the form. Users must scroll to the bottom of ~130 rows to submit. The nav rail (L1438) provides quick scroll buttons but they're not an obvious submit path.

**Fix:** Make submit button sticky/floating, or add a floating submit FAB.

---

## MINOR

### m1. "Lainnya" Bottom Nav Links to Admin-Only `/cabang` — Misleading Label
**File:** `components/Navbar.tsx:45`

`{ name: "Lainnya", href: "/cabang" }` — "Lainnya" (More) implies a dropdown or menu, not a direct link to cabang management.

### m2. Inconsistent Naming: "Laporan" in Nav vs "Riwayat Laporan" on Page
**Files:** `components/Navbar.tsx:42`, `app/laporan/page.tsx:264`

Nav says "Laporan", page heading says "Riwayat Laporan Stock Opname". Confusing for users navigating.

### m3. Draft Restore Banner Does Not Show Which Items Were Filled
**File:** `app/so/input/page.tsx:835-869`

Shows filled count and timestamp but not which specific items had data. User cannot assess draft completeness.

### m4. Previous SO Reference Selector Shows Cryptic Labels
**File:** `app/so/input/page.tsx:1004`

Labels use relative numbering `Sesi #${previousSOHistory.length - i}` — numbering shifts as history grows, making references confusing.

### m5. Modal Backdrop onClick May Interfere with Scrolling
**File:** `app/so/input/page.tsx:1523`

`SOSummaryModalInline` backdrop uses `<div onClick={onCancel}>` — clicking backdrop to close. `stopPropagation` on panel prevents inner-click dismissal but the backdrop click zones may conflict with scroll on mobile.

### m6. Harian/Mingguan Toggle Uses `<span>` vs `<Link>` Inconsistently
**File:** `app/dashboard/harian/page.tsx:237-239`

Dashboard tab toggle: "Harian" is a `<span>` (active), "Mingguan" is a `<Link>`. Inconsistent — both should be links or both should be buttons/spans with client-side state.

### m7. Receipt Shows "MOCHIKIN" as Fallback Branch Name
**File:** `app/so/konfirmasi/[laporanId]/page.tsx:203`

`selectedCabang?.Nama_Cabang || 'MOCHIKIN'` — hardcoded brand as fallback. Should be dynamic or hidden.

### m8. Receipt Footer "LAPORAN STRUK RESMI MOCHIKIN" Is Hardcoded
**File:** `app/so/konfirmasi/[laporanId]/page.tsx:285`

Hardcoded brand string in receipt decorative area. Not configurable per branch.

### m9. `text-base-content/60` Used 100+ Times — "Washed Out" Feel
**Files:** Multiple components

Heavy use of low-opacity text creates a washed-out, low-contrast interface. Especially problematic on mobile in bright environments.

### m10. Stagger Animations on ~130 Items May Cause Performance Issues
**File:** `app/so/input/page.tsx:1129-1132`

`staggerChildren: 0.06` via `staggerContainer` variant. With area-card grouping the stagger is per-group not per-item, but the entire variant subtree re-renders on each keystroke.

### m11. Tour Dot Indicators Are 6px — Below 44px Touch Target
**File:** `components/OnboardingTour.tsx:192-194`

Dot buttons: `h-1.5` (6px height), active dot `w-5` (20px), inactive `w-1.5` (6px). Well below 44px mobile touch minimum.

### m12. Tour Has No Keyboard Escape Handling
**File:** `components/OnboardingTour.tsx:137`

Tour dialog has `role="dialog"` + `aria-modal="true"` but no `onKeyDown` for Escape. Only dismissible via "Lewati" (Skip) button, close button, or "Selesai" (Done) button.

### m13. Panduan Page Not Linked from Navigation — Just Redirects
**Files:** `app/panduan/page.tsx:1-5`, `components/Navbar.tsx:44`

`/panduan` exists but is never linked — Navbar links directly to `/docs`. The page is a server redirect to `/docs`. Dead/legacy route.

### m14. Two Overlapping Documentation Systems (`/docs` and `/panduan`)
**Files:** `app/docs/` (12 pages), `app/panduan/page.tsx`

Comprehensive docs at `/docs` with sidebar, TOC, search. `/panduan` is a redirect. Confusing which is authoritative.

### m15. Home Page "Lihat Semua" Link Does Not Preserve Filter Context
**File:** `app/page.tsx:858`

`<Link href="/laporan">` — plain link with no query parameters. Branch filter context from home page is not passed to laporan list.

### m16. No `<caption>` on Data Tables
**Files:** `app/laporan/page.tsx:396`, `app/so/konfirmasi/[laporanId]/page.tsx` (receipt)

Tables lack `<caption>` elements for screen reader context.

### m17. Z-Index Notation Inconsistency
**Files:** Multiple components

Mix of `z-50`, `z-[60]`, `z-[70]`, `z-40` across modal/overlay layers. No documented z-index scale.

### m18. AuthContext Silently Swallows Network Errors
**File:** `lib/AuthContext.tsx:38`

`catch(() => {})` on session check — network failures result in no user state, no error, no feedback.

### m19. `WATemplateModal` Lacks Dialog Semantics
**File:** `components/WATemplateModal.tsx:65`

No `role="dialog"`, no `aria-modal`, no focus trap, no auto-focus on open, no focus restoration on close. Textarea (L127-131) has no associated label.

---

## SUGGESTIONS

### S1. Wrap Children in `<PageTransition>` in Layout
The component exists but is unused. Wrapping `{children}` would add smooth page transitions with zero new code.

### S2. Add Virtualization for SO Item List
With ~130 items each having up to 7 sub-fields, DOM cost is significant. `react-window` or `@tanstack/react-virtual` would reduce render cost by 90%+.

### S3. Migrate from `framer-motion` to `motion/react`
Package.json has `framer-motion: ^11.18.2`. The canonical import is now `motion/react`. Legacy alias works but should be updated.

### S4. Unify Documentation into Single System
`/docs` is comprehensive, `/panduan` is a redirect. Remove `/panduan` route entirely or merge any unique content.

### S5. Add Debounced Date Pickers on Dashboard
Prevent immediate refetch on every keystroke. 300ms debounce would eliminate unnecessary network requests.

---

## TOP 5 PRIORITY FIXES

1. **Extract SO item row to `React.memo`'d component + add virtualization** — performance critical for core feature
2. **`h-8` → `min-h-[44px]`** on all interactive elements + actually use the existing `.touch-target` CSS class
3. **Fix WA share flow** — wire `handleWASent` callback into modal, add proper delivery tracking
4. **Add `beforeunload` + discard confirmation dialog** on SO form — prevent accidental data loss
5. **Guard onboarding tour** against missing branch selection and non-admin role — filter steps dynamically
