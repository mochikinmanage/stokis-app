# PLAN-UPDATE.md — Stokis: Edit Report, Input Bug Fix, Input-Type-Aware Report Output

> Audience: this document is written for an AI coding agent (e.g. Claude Code) that will implement these changes. Read fully before writing any code. Ask the user if anything below is ambiguous rather than guessing.

## 0. Agent Behavior Rules (Read First)

These rules apply to how the agent should work through this entire plan, not just what to build.

1. **Work section by section, not all at once.** Each numbered section below (1, 2, 3) is a separable unit of work. Finish and verify one section before moving to the next, even if they touch the same file.
2. **Never guess business logic silently.** If a threshold value, a status color rule, or a field name is ambiguous, stop and ask the user — do not invent a default and proceed. Past sessions on this codebase have shown that silent assumptions here cause rework.
3. **Test after every code change that touches `lib/google/template-xlsx.ts`.** This file generates real downloadable reports used by branch staff daily. Before considering any change to it "done", generate a sample report with mixed item types (at minimum: one `dual`, one `boolean`, one `date` item in the same Area) and open the resulting `.xlsx` to visually confirm the tables and merged cells render correctly. Do not rely on "no runtime error" as proof of correctness — Excel table/merge structure can be silently wrong even when the code runs without throwing.
4. **Do not break existing behavior while adding new behavior.** `dual` and `boolean` types are already in production use. Any refactor to support new types (`single`, `date`, `text`, `expiry`) must keep existing `dual`/`boolean` report output visually identical to before, unless the user explicitly asked for a change to those (they did not, in this plan).
5. **Preserve conditional cell coloring and Excel Table (`addTable`) structure.** These were fixed in prior work sessions after being broken by a careless rewrite. Any new code path (new item type, merged cells) must go through the same "write cell value + fill/border/font" pattern already established in the file, and must still register as part of a proper `ws.addTable()` call so per-table filtering/sorting keeps working.
6. **This plan does not include the retain-ly project.** Stay scoped to the `stokis-app` repository only.

---

## 1. Feature: Edit Existing Report (In-Place, Same Link)

### 1.1 What the user wants
A user has already generated a stock-opname report, uploaded to Google Drive, and shared the download link (e.g. via WhatsApp). They later notice a data entry mistake. They want to correct it through the app UI, and have the **same Drive file, same link** updated — not a new file with a new link.

### 1.2 Why this is not what `regenerate` already does
The existing `POST /api/laporan/[laporanId]/regenerate` endpoint calls `uploadFileToGASDrive` (effectively `drive.files.create`), which creates a **brand new file** with a new file ID. The old file is left orphaned in Drive and any previously shared link becomes stale.

**Do not repurpose or modify `regenerate` for this feature.** Its documented purpose (see `app/docs/user-guide/laporan/page.tsx`, "Regenerate File" section) is recovery when a file is lost or corrupted, and that behavior must be preserved. Build the edit feature as a separate, new code path.

### 1.3 Required changes

**a. Google Drive layer — add file update capability**
- File: `lib/google/drive.ts`
- Add a new exported function, e.g. `updateXlsxInDrive(fileId: string, buffer: Buffer): Promise<{ fileId: string; webViewLink: string }>`
- Implementation must use `drive.files.update({ fileId, media: { mimeType: ..., body: ... } })` — NOT `drive.files.create()`. This is the critical distinction: `update` overwrites content of an existing file ID; `create` makes a new one.
- Keep the existing `uploadXlsxToDrive` function untouched — it is still needed for first-time report generation.

**b. Persist the Drive file ID, not just the link**
- File: `lib/domain/laporan-service.ts`
- Currently only `Link_XLSX` (the webViewLink URL) is stored in the `Laporan_PDF` sheet. To call `files.update`, the app needs the raw Drive `fileId`.
- Add a new column, e.g. `Link_XLSX_FileId`, alongside the existing `Link_XLSX` column, using the same self-healing pattern already used for `Link_XLSX` (auto-create the header if missing).
- For reports generated **before** this change, `Link_XLSX_FileId` will be empty. The edit feature must handle this gracefully (see 1.3d).

**c. Build the edit UI**
- New page or modal, e.g. `app/laporan/[laporanId]/edit/page.tsx`
- Load existing `Laporan_SO` detail rows for this `laporanId` (reuse `getLaporanDetail` from `lib/domain/laporan-service.ts`)
- Render a form pre-filled with current values (item name read-only, step1/step2/status fields editable, matching the same input pattern as `app/so/input/page.tsx` — including the number input bug fix from Section 2, since this form has the exact same input type)
- On submit, call a new endpoint (1.3d)

**d. New endpoint: apply edits and update the same Drive file**
- New file: `app/api/laporan/[laporanId]/edit/route.ts`
- Steps:
  1. Validate auth + cabang access (same pattern as `regenerate/route.ts` — `withAuth`, `assertCabangAccess`)
  2. Update the relevant rows in `Laporan_SO` sheet with the new values the user submitted
  3. Re-read the full updated item list (do not trust the client payload alone — re-fetch from `Laporan_SO` after writing, to guarantee the generated file reflects what is now actually stored)
  4. Generate a new XLSX buffer using `generateXlsxFromTemplate` (same function already used elsewhere — do not duplicate this logic)
  5. Check if `Link_XLSX_FileId` exists for this laporan:
     - **If yes:** call `updateXlsxInDrive(fileId, buffer)` — this keeps the link identical
     - **If no** (old report, pre-migration): fall back to the existing `uploadXlsxToDrive` (creates new file) and store the new `fileId` + `Link_XLSX` — in this one case only, the link will change, and the UI must clearly tell the user this happened (e.g. "This report was generated before the edit feature existed — a new link was created. Please re-share it.")
  6. Update `Link_XLSX` and `Link_XLSX_FileId` in `Laporan_PDF`

### 1.4 Open question for the user (agent: ask before building 1.3c/1.3d)
- Who is allowed to edit a submitted report — the original staff member only, or any admin/owner? This affects whether an authorization check beyond `assertCabangAccess` is needed.
- Should edits be logged (who changed what, when)? Given this is inventory data that may inform business decisions, an audit trail is recommended, but the user has not yet confirmed this requirement. Do not build audit logging unless confirmed — ask first.

---

## 2. Bug Fix: Number Input Duplicating Digits (`10` → `1000`, `13` → `133333`)

### 2.1 Diagnosis (confirmed, not a guess)
This is a known, long-standing React issue: `<input type="number">` used as a **controlled component** (`value={state}` + `onChange={setState}`) misbehaves on mobile virtual keyboards (documented in React's own issue tracker, e.g. facebook/react#7253, and widely reported across the React ecosystem for over 8 years). Rapid re-renders during typing can cause keystroke events to be duplicated at the browser/keyboard level before React stabilizes the displayed value, producing repeated-digit artifacts exactly matching the user's report (`13` → `133333` is the digit sequence repeating, not random digits).

This is **not** a bug in `handleCountChange`, not a Google Sheets API formatting issue, and not a draft/autosave race condition — those were checked and ruled out.

### 2.2 Fix
- File: `app/so/input/page.tsx`
- Affected inputs: Step 1 field (~line 1257) and Step 2 field (~line 1273) — both currently `<input type="number" step="any" min="0" ...>`
- Change both to `<input type="text" inputMode="decimal" ...>`
- Add manual input filtering in the `onChange` handler (or a small wrapper function) that:
  - Allows only digits and a single decimal point (support both `.` and `,` as decimal separator, normalizing to `.` internally, consistent with `parseThreshold`'s existing `.replace(',', '.')` pattern in `lib/domain/so.ts`)
  - Rejects/strips any other character before it reaches `setCounts`
- `inputMode="decimal"` preserves the numeric keyboard on mobile — there should be no visible UX change for staff, only the underlying stability fix.

### 2.3 Testing requirement (critical — cannot be verified in a desktop browser alone)
- This bug is specific to mobile virtual keyboards and may not reproduce in desktop Chrome/Firefox or in an emulator.
- Agent must explicitly tell the user: **"This fix should be tested on a real Android and/or iOS device by a staff member, typing quickly, before considering this closed."** Do not mark this task complete based on local dev testing alone.

### 2.4 Scope check
- Apply the same fix anywhere else in the codebase using the same controlled `<input type="number">` pattern for free-form numeric entry (search the codebase for `type="number"` before finishing this section — do not assume Step 1/Step 2 are the only occurrences).

---

## 3. Report Output Must Follow Input Type (6 Types)

### 3.1 The core problem being fixed
Currently, `lib/google/template-xlsx.ts` does not switch report formatting based on `tipeInput` directly. It uses indirect heuristics (checking if the Area name contains the word "utilitas", checking if the item name matches a "minyak/oil" regex) to guess which format to use. This is fragile and has already caused a real bug (a "Minyak Goreng" item was miscategorized and rendered with the wrong column headers in a real report — see prior session).

**The fix: report formatting must be driven directly by `tipeInput`, with no dependency on Area name or item name pattern-matching.**

### 3.2 The 6 input types and their report behavior

| Type | Grouping behavior | Header columns | Status logic |
|---|---|---|---|
| `dual` | Shares one table with `single` items in the same Area | `No, Nama Barang, Satuan, Threshold, Step 1, Step 2, Total, Step 1 (current), Step 2 (current), Total 2, Pemakaian, Status Stok, Keterangan` (existing `REGULAR_HEADERS`, unchanged) | `total <= threshold` → KRITIS, `total <= threshold*2` → HAMPIR HABIS, else AMAN (existing logic, unchanged) |
| `single` | **Same table as `dual`** (not a separate table) — this is the one exception to "each type gets its own table" | Same as `dual` above, BUT for `single` rows, the Step 1 and Step 2 cells are **merged into one cell** showing the single entered value | Same calculation as `dual`, using the single value as the total (`step1 + step2` where one of them is effectively the merged single input) |
| `boolean` | Own separate table, but stays under the same Area divider (does NOT get renamed to "Utilitas Gas" like current behavior) | `No, Nama Barang, Satuan, Threshold, Status Isi, Tgl Isi, Tgl Restock, Tgl Pakai, Pemakaian, Status Stok, Keterangan` (existing `GAS_HEADERS` content, reused) | Existing Penuh/Dipakai/Habis logic, unchanged |
| `date` | Own separate table, same Area divider | `No, Nama Barang, Satuan, Threshold (Hari), Tanggal Tercatat, Hari Berlalu, Status Stok, Keterangan` (NEW) | KRITIS if days elapsed since recorded date ≥ threshold (in days); HAMPIR HABIS if ≥ 70% of threshold; else AMAN. **Confirm exact percentage/logic with user if not already fixed — 70% was used as a placeholder consistent with existing HAMPIR HABIS ratio patterns in the codebase, not explicitly confirmed by the user for this type.** |
| `text` | Own separate table, same Area divider | `No, Nama Barang, Satuan, Keterangan` (NEW) | No status calculation, no conditional coloring — this type is for non-stock checklist/notes only |
| `expiry` | Own separate table, same Area divider | `No, Nama Barang, Satuan, Tanggal Kedaluwarsa, Sisa Hari, Status Stok, Keterangan` (NEW) | **Inverted from `date`**: KRITIS if remaining days ≤ threshold (approaching/past expiry); AMAN if far from expiry. Threshold is set per-item in Master Item, same field reused as the other types' threshold. |

### 3.3 Grouping algorithm change required

Current code groups items into blocks primarily by Area, with utilitas types (`boolean`, numeric-in-utilitas-area) split into separately-named blocks ("Utilitas Gas", "Utilitas Token", "Utilitas Minyak") detached from their original Area name.

**New algorithm:**
1. Group items by Area (as today)
2. Within each Area group, split further by `tipeInput`, where `single` and `dual` are treated as the *same* sub-group (they share one table), and `boolean`/`date`/`text`/`expiry` each form their own sub-group
3. Each sub-group becomes one Excel Table (`ws.addTable()`), but the Area divider row (`▶ AREA X`) is written once per Area, above all of that Area's tables — not per sub-group, and not renamed based on type
4. If an Area has only one type present, it renders as one table under one divider, same as today's simple case — no behavior change for Areas that don't mix types

### 3.4 Files requiring changes
- `lib/domain/xlsx-report.ts` — `XlsxItem` interface needs new optional fields for `date`/`expiry` types (e.g. `tglTercatat`, `tglKedaluwarsa` — confirm exact field naming with existing `tglRefill`/`tglPakai` conventions before introducing new field names, to avoid inconsistent naming across the codebase)
- `lib/google/template-xlsx.ts` — this is where the bulk of the work happens:
  - Replace `isUtilitasBoolean()` / `isUtilitasNumeric()` heuristic functions with a single, direct type-check function, e.g. `getItemType(it): 'dual' | 'single' | 'boolean' | 'date' | 'text' | 'expiry'` that reads `tipeInput` only — no Area name or item name string matching
  - Remove the `isMinyak()` regex-based special case entirely — it becomes unnecessary once `date`/`expiry` types exist as proper first-class types (Minyak Goreng should simply be set to `tipeInput: 'date'` or `'expiry'` in Master Item, not detected by name)
  - Add header constants: `DATE_HEADERS`, `TEXT_HEADERS`, `EXPIRY_HEADERS`
  - Add status calculation + rank functions for `date`, `text` (no-op), `expiry` — following the same pattern as existing `regularStatus`/`regularStatusRank`, `utilTokenStatus`/`utiltokenStatusRank`
  - Add cell-writing logic for each new type in the block-writing loop (same section that currently handles `dr.type === 'item' | 'utilgas' | 'utiltoken'`)
  - Add merged-cell logic specifically for `single`-type rows within the `dual` table (`ws.mergeCells()` on the Step1/Step2 column range, for that row only)
  - Update the `addTable()` rows-building section (currently duplicates the cell-writing logic — see technical debt note in 3.5) to also handle the new types

### 3.5 Known technical debt to be aware of (do not silently "fix" this unless asked)
The current code writes cell values twice — once manually via `row.getCell(x).value = ...` (for styling/coloring), and again inside the `addTable({ rows: [...] })` call (for Excel Table registration). Both must compute the same derived values (status, pemakaian, etc.) independently. This was flagged as a maintenance risk in a prior session but intentionally left as-is because it was working correctly at the time.

**For this update:** since 4 new types are being added, the temptation to "just refactor this into one shared function while I'm in here" will be strong. **Do not do this as a silent side-effect.** If the agent believes consolidating this duplicate logic is worthwhile, propose it to the user as a separate, explicit step — do not bundle a structural refactor into a feature-addition commit, since it makes it harder to isolate what broke if something goes wrong.

### 3.6 Master Item changes required
- The Master Item management UI/form (wherever `tipeInput` is currently set as `single | dual | boolean | date`) needs its options list expanded to include `text` and `expiry`
- Locate this via `lib/domain/master-item-service.ts` (`normalizeTipeInput` or equivalent) and the corresponding form component — search the codebase, do not assume a specific file path without checking, as this was not directly inspected in this planning session

---

## 4. Suggested Execution Order

1. **Section 2 (input bug fix) first** — smallest, most isolated change, immediate user-facing pain relief, no dependency on anything else in this plan
2. **Section 3 (report output by type) second** — foundational; Section 1's edit feature will reuse the same report generation function, so getting this right first avoids building the edit feature on top of a report generator that's mid-refactor
3. **Section 1 (edit feature) last** — depends on Section 3 being stable, since editing a report re-triggers the same `generateXlsxFromTemplate` call

## 5. Explicitly Out of Scope for This Plan
- The retain-ly project (separate repository, separate plan)
- Any UI/visual redesign not directly required by the new column headers in Section 3
- Consolidating the duplicate value-calculation logic noted in 3.5, unless the user explicitly requests it as a separate task
- Adding authentication/authorization improvements beyond what Section 1.3d already requires for the edit endpoint
