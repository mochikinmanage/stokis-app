# XLSX Drive Upload Mandatory - Implementation Tasks

This task list follows the exploratory bugfix workflow: first write tests to surface the bug, then implement the fix with verification steps.

## Phase 1: Bug Exploration Tests

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - XLSX Upload Fails Without Retry on Unfixed Code
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **GOAL**: Surface counterexamples demonstrating that unfixed code doesn't retry Drive uploads
  - **Test Implementation Details from Design**:
    - Mock `uploadFileToGASDrive` to fail on first attempt but succeed on second attempt
    - Simulate transient network error: throw `new Error('Network timeout')`
    - Call the `/api/so/[laporanId]/xlsx` endpoint (unfixed)
    - Assert that ONLY 1 attempt was made (no retries)
    - Assert that fallback API link is used instead of Drive link
    - Assert that Link_XLSX is NOT saved to database
  - **Scoped PBT Approach**: Scope to concrete failing case - zero retry attempts when upload fails
  - Test assertions match Expected Behavior from design:
    - `retry_count === 1` (no retries were attempted)
    - `Link_XLSX === empty or fallback URL` (not a Drive link)
    - `upload_attempts === 1` (only first attempt, no retries)
  - **Expected Outcome**: Test FAILS on unfixed code (this proves bug exists)
  - Document counterexample: "uploadFileToGASDrive failed once, system did not retry, fallback link used instead"
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.4_

## Phase 2: Preservation Tests

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Successful First-Attempt Upload Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - **Test on UNFIXED code first**: Observe behavior for successful uploads
  - Observe: When `uploadFileToGASDrive` succeeds immediately, confirmation page loads with Drive link
  - Observe: Link_XLSX is saved correctly to database
  - Observe: No unnecessary delays are introduced
  - **Write property-based test capturing observed behavior**:
    - Generate random SO payloads (various cabang, tanggal, shift combinations)
    - Mock `uploadFileToGASDrive` to succeed on first attempt
    - Call `/api/so/[laporanId]/xlsx` endpoint on UNFIXED code
    - Assert that Link_XLSX contains valid Google Drive webViewLink
    - Assert that response time is reasonable (< 10 seconds)
    - Assert that only 1 upload attempt was made
  - Property-based testing generates many test cases for stronger guarantees
  - **Expected Outcome**: Tests PASS on unfixed code (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

## Phase 3: Implementation

- [ ] 3. Implement XLSX Drive upload retry logic with exponential backoff

  - [ ] 3.1 Implement retry wrapper in `/app/api/so/[laporanId]/xlsx/route.ts`
    - Create async helper function: `uploadFileToGASDriveWithRetry(params, maxAttempts = 3)`
    - Implement exponential backoff delays:
      - Attempt 1: immediate (0ms delay)
      - Attempt 2: wait 500ms before retry
      - Attempt 3: wait 1000ms before retry
      - Attempt 4 (max): wait 1500ms before retry (3 retries total)
    - For each failed attempt:
      - Log error with attempt number: `console.log('XLSX upload attempt ${attemptNum} failed: ${error.message}')`
      - Check if error is transient (network timeout, 50x status, GAS error)
      - If transient: wait backoff delay and retry
      - If permanent (401, 404, auth error): throw immediately, don't retry
    - Return successful result or last error after all attempts exhausted
    - _Bug_Condition: isBugCondition(input) from design - upload fails without retry_
    - _Expected_Behavior: expectedBehavior from design - retry up to 3 times with exponential backoff_
    - _Preservation: Preservation Requirements from design - existing successful uploads unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.2 Replace direct uploadFileToGASDrive call with retry wrapper
    - In the POST handler, replace: `uploadFileToGASDrive(...)` with `uploadFileToGASDriveWithRetry(...)`
    - Update error handling:
      - If retry succeeds: proceed with `updateLaporanXlsxLink` as normal
      - If retry fails after 3 attempts: do NOT create fallback link
    - Set xlsxLink behavior:
      - Success: `xlsxLink = successResult.webViewLink` (Drive link)
      - Failure: `xlsxLink = ''` (empty string, NOT fallback)
    - Call `updateLaporanXlsxLink(laporanId, xlsxLink)` to save to database
    - Return HTTP 200 with XLSX blob for backward compatibility
    - Add response metadata: `{ success: boolean, uploadedToGADrive: boolean, retries: number }`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.3 Implement verification in `/app/so/input/page.tsx` handleConfirmedSubmit
    - After calling `/api/so/[laporanId]/xlsx`, DON'T immediately redirect
    - Add verification step to confirm Link_XLSX was saved with Drive link:
      - Poll `/api/laporan/${laporanId}` endpoint to check Link_XLSX field
      - Retry up to 5 times with 2-second intervals between polls
      - Check: `Link_XLSX !== empty AND Link_XLSX.includes('drive.google.com')`
    - Block redirect until Drive link is confirmed:
      - If verification succeeds: redirect to `/so/konfirmasi/${laporanId}` (confirmation page)
      - If verification fails after 5 polls: show error: "File XLSX gagal diunggah ke Drive setelah 3 percobaan. Coba submit ulang."
      - Keep user on form, don't redirect
    - Update genStep progress:
      - Add 'xlsx-verifying' step before 'selesai'
      - Show loading message: "Memverifikasi file XLSX di Google Drive..."
    - Add error recovery:
      - If XLSX verification fails, show retry button
      - Allow user to attempt resubmission without losing form data
    - _Requirements: 1.2, 2.4_

  - [ ] 3.4 Remove fallback link logic from `/app/so/konfirmasi/[laporanId]/page.tsx`
    - Find and delete fallback link creation logic:
      - Remove: `const origin = typeof window !== 'undefined' ? window.location.origin : '';`
      - Remove: `${origin}/api/so/${encodeURIComponent(laporanId)}/xlsx-file?...` fallback
    - Update `getXlsxLink()` function:
      - If Link_XLSX is present (not empty): return Drive link directly
      - If Link_XLSX is empty: return empty string (no fallback)
    - Update button rendering:
      - If Link_XLSX exists: show "Buka File XLSX" button (enabled, opens Drive)
      - If Link_XLSX is empty: show disabled button or error state
    - Update badge status rendering:
      - If Link_XLSX contains URL: badge = "File XLSX tersedia di Google Drive" (green success)
      - If Link_XLSX is empty: badge = "File XLSX gagal diunggah - hubungi admin" (red error)
    - _Requirements: 1.3, 2.4, 3.1, 3.2, 3.3_

  - [ ] 3.5 Add comprehensive error logging for debugging
    - Log all retry attempts with timestamps: `[ATTEMPT 1/3] uploadFileToGASDrive started...`
    - Log backoff delays: `[RETRY] Waiting 500ms before attempt 2...`
    - Log final result: `[RESULT] XLSX upload to Drive ${success ? 'succeeded' : 'failed'} after ${attemptCount} attempts`
    - If all retries fail, log failure details: error message, status code, GAS response
    - Include laporanId and sesiId in all log messages for traceability
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 3.6 Verify bug condition exploration test now passes
  - **Property 1: Expected Behavior** - XLSX Upload Succeeds After Retry on Fixed Code
  - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
  - The test from task 1 encodes the expected behavior
  - When this test passes, it confirms the expected behavior is satisfied
  - Run test on FIXED code:
    - Mock `uploadFileToGASDrive` to fail on first attempt, succeed on second
    - Call `/api/so/[laporanId]/xlsx` endpoint (now fixed)
    - Assert retry logic activates: `retry_count === 2` (1 initial + 1 retry)
    - Assert Drive link is saved: `Link_XLSX contains webViewLink`
    - Assert confirmation page loads successfully
  - **Expected Outcome**: Test PASSES (confirms bug is fixed)
  - _Requirements: Expected Behavior Properties from design_

- [ ] 3.7 Verify preservation tests still pass
  - **Property 2: Preservation** - First-Attempt Upload Unchanged
  - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
  - Run preservation property tests on FIXED code:
    - Generate random SO payloads
    - Mock `uploadFileToGASDrive` to succeed on first attempt
    - Call `/api/so/[laporanId]/xlsx` endpoint (fixed)
    - Assert Link_XLSX is correctly saved
    - Assert no unnecessary delays introduced
    - Assert only 1 attempt made (no retry when not needed)
  - **Expected Outcome**: Tests PASS (confirms no regressions)
  - Compare response times: fixed code should be similar or faster than unfixed
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

## Phase 4: Final Verification

- [ ] 4. Checkpoint - Ensure all tests pass and implementation is complete
  - Run all tests (bug condition, preservation, unit, integration)
  - Verify all tests pass without errors
  - Manual testing checklist:
    - [ ] Submit SO with mocked Drive upload failure → system retries and succeeds
    - [ ] Submit SO with successful first-attempt upload → confirmation page loads immediately
    - [ ] Confirmation page shows "File XLSX tersedia di Google Drive" badge when Link_XLSX populated
    - [ ] Confirmation page shows error badge when Link_XLSX empty
    - [ ] XLSX button on confirmation page opens Google Drive when Link_XLSX is set
    - [ ] XLSX button on confirmation page is disabled when Link_XLSX is empty
    - [ ] Error message displays correctly if all retries fail: "File XLSX gagal diunggah ke Drive setelah 3 percobaan"
    - [ ] WhatsApp sharing still works on confirmation page
    - [ ] Regenerate endpoint still works and generates correct XLSX
    - [ ] Idempotent resubmission still returns existing laporanId (no re-upload)
  - Verify no console errors or warnings
  - Check log messages for retry attempts when failures occur
  - Ask the user if questions arise or clarification is needed
  - _Requirements: All (1.1-1.4, 2.1-2.4, 3.1-3.5)_
