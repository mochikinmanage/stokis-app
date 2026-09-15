# XLSX Drive Upload Mandatory - Bugfix Design

## Overview

This design formalizes the fix for ensuring XLSX files are reliably uploaded to Google Drive before confirming Stock Opname (SO) submissions. The current implementation falls back to a temporary API endpoint when Drive upload fails, leaving the system in an inconsistent state. The fix implements an automatic retry mechanism (up to 3 attempts) to guarantee permanent Drive links are saved, with clear error messaging if all attempts fail.

The fix ensures the SO submission flow is atomic with respect to the Drive upload: either the Drive link is successfully saved or the entire submission fails and returns control to the user.

## Glossary

- **Bug_Condition (C)**: The condition triggering the bug - XLSX Drive upload fails on initial attempt without retry
- **Property (P)**: The desired behavior for buggy inputs - XLSX uploads automatically retry up to 3 times and succeed on at least one attempt
- **Preservation**: Existing submission flow for successful first-attempt uploads and mouse click behavior remains unchanged
- **uploadFileToGASDrive**: The async function in `lib/appsscript.ts` that uploads XLSX to Google Drive via Google Apps Script
- **updateLaporanXlsxLink**: The async function in `lib/domain/laporan-service.ts` that saves the Drive link to the spreadsheet's Link_XLSX field
- **Link_XLSX**: The database/spreadsheet field that stores the permanent Google Drive webViewLink for the XLSX file
- **Fallback Link**: The temporary API endpoint `/api/so/[laporanId]/xlsx-file` that currently serves as a fallback when Drive upload fails (TO BE REMOVED)

## Bug Details

### Bug Condition

The bug manifests when the `uploadFileToGASDrive` function in the XLSX submission handler fails on its first attempt. The `POST /api/so/[laporanId]/xlsx` endpoint either swallows the error and creates a fallback API link instead of retrying, or the front-end doesn't wait for the upload to complete before redirecting to confirmation.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type XlsxUploadRequest {
    laporanId: string,
    items: SOItemPayload[],
    cabangId: string,
    // ... other XLSX generation params
  }
  OUTPUT: boolean
  
  RETURN uploadFileToGASDrive(input) FAILS ON FIRST ATTEMPT
         AND system does NOT RETRY the upload
         AND system INSTEAD falls back to temporary API link
         AND Link_XLSX field remains empty or contains temporary link
END FUNCTION
```

### Examples

**Example 1: Network timeout on Drive upload**
- User submits SO with items and quantities
- XLSX is generated successfully
- `uploadFileToGASDrive` is called to upload to Drive
- Network times out mid-request
- Current behavior: Error is caught, fallback to `/api/so/[laporanId]/xlsx-file` is used
- Expected behavior: Automatically retry upload up to 3 times before giving up

**Example 2: Transient GAS error**
- User submits SO
- XLSX generated successfully
- `uploadFileToGASDrive` fails with transient GAS error (HTTP 500)
- Current behavior: Caught silently, fallback link is used
- Expected behavior: Retry mechanism catches this and attempts again (may succeed on retry)

**Example 3: Confirmation page shows inconsistent state**
- User submitted SO previously when Drive upload failed
- Confirmation page loads
- `Link_XLSX` field is empty or contains temporary API link
- Current behavior: Badge shows "File XLSX tersedia untuk diunduh (belum tersimpan di Drive)"
- Expected behavior: Badge should never show this if Drive link was required to be saved first

**Example 4: Edge case - out of retries**
- User submits SO
- XLSX generated successfully
- `uploadFileToGASDrive` fails 3 times in a row (persistent network/GAS issue)
- Current behavior: Confirmation page still loads with fallback link
- Expected behavior: Submission should fail with clear error message explaining retries failed

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

1. Mouse clicks on action buttons and UI elements must continue to work exactly as before
2. Existing XLSX report generation (formatting, data, comparison with previous SO) must remain unchanged
3. Submission flow for cases where Drive upload succeeds on first attempt must be identical
4. Idempotent submission checks (sesiId-based deduplication) must continue to work
5. XLSX report regeneration via the `/regenerate` endpoint must work without changes
6. Confirmation page display of successful submissions must remain unchanged (except fallback link removal)
7. WhatsApp sharing and link generation must continue to work
8. All non-XLSX related fields in the SO submission must be saved identically

**Scope:**

All XLSX submission scenarios where the upload succeeds on the first attempt should be completely unaffected by this fix. This includes:
- Successful first-attempt Drive uploads
- Idempotent resubmissions of the same sesiId
- Different submission contexts (various cabang, tanggal, shift, petugas combinations)
- Error cases unrelated to Drive upload (e.g., missing cabangId, auth failures)

## Hypothesized Root Cause

Based on the bug description and code review, the most likely issues are:

1. **No Retry Logic for Transient Failures**: The `POST /api/so/[laporanId]/xlsx` endpoint catches upload failures silently and immediately falls back to the API link, with no exponential backoff retry attempts. Transient network issues or temporary GAS unavailability are never given a second chance.

2. **Synchronous/Awaited Upload with No Error Propagation**: The front-end (`/app/so/input/page.tsx`) calls `uploadFileToGASDrive` but doesn't properly wait for or validate the result. The endpoint returns success regardless of upload outcome, allowing the redirect to proceed before the Drive link is confirmed.

3. **No Validation Before Redirect**: The confirmation page redirect happens after the XLSX endpoint is called, but there's no check that `Link_XLSX` was actually saved to the database with a Drive link. The system trusts that the upload succeeded without verifying.

4. **Temporary Fallback as Permanent Solution**: The fallback API link serves XLSX files from temporary storage on the server, which is unreliable and not guaranteed to persist. This was meant as a temporary measure but became the permanent behavior when Drive uploads failed.

## Correctness Properties

Property 1: Bug Condition - XLSX Upload Succeeds After Retry

_For any_ XLSX upload request where the initial Drive upload fails but succeeds on a subsequent retry attempt (within 3 total attempts), the fixed `POST /api/so/[laporanId]/xlsx` endpoint SHALL:
- Automatically retry the failed upload with exponential backoff (500ms, 1000ms, 1500ms between attempts)
- Save the permanent Google Drive webViewLink to the Link_XLSX field in the Laporan_PDF spreadsheet
- Return HTTP 200 with the XLSX blob regardless of upload outcome (backward compatibility)
- Allow the front-end to proceed to the confirmation page with a valid Drive link in the database

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Non-Buggy Upload Behavior

_For any_ XLSX upload request where the Drive upload succeeds on the first attempt, the fixed endpoint SHALL produce exactly the same result as the original implementation:
- Save the Drive link to Link_XLSX on the first attempt
- Return HTTP 200 with the XLSX blob
- Not introduce any delays or additional processing
- Display the confirmation page with identical styling and behavior

**Validates: Requirements 3.1, 3.2, 3.3**

Property 3: Error Handling - All Retries Exhausted

_For any_ XLSX upload request where all 3 upload attempts fail, the fixed `POST /api/so/[laporanId]/xlsx` endpoint SHALL:
- Continue to return HTTP 200 with XLSX blob (backward compatibility for client)
- NOT save a fallback API link to Link_XLSX (Link_XLSX remains empty)
- Log the retry failure details for debugging
- Return JSON response indicating upload failed after retries

**Validates: Requirements 2.4**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct, the following changes are required:

**File 1**: `app/api/so/[laporanId]/xlsx/route.ts`

**Function**: `POST handler`

**Specific Changes**:

1. **Add Retry Wrapper for Drive Upload**:
   - Create a new async helper function `uploadFileToGASDriveWithRetry(params, maxAttempts = 3)`
   - Implement exponential backoff: 500ms, 1000ms, 1500ms between retry attempts
   - On each failed attempt, log the error with attempt number
   - Return the result of the successful attempt or the last error if all fail
   - Catch only transient errors (network timeouts, 500-series HTTP responses, GAS errors)
   - Propagate permanent errors (401, 404, invalid parameters)

2. **Replace Direct uploadFileToGASDrive Call**:
   - Replace the direct call to `uploadFileToGASDrive()` with `uploadFileToGASDriveWithRetry()`
   - Update error handling to check retry result
   - If retry succeeds, proceed with Link_XLSX update as normal
   - If retry fails after all attempts, set xlsxLink to empty string (no fallback)

3. **Add Conditional Fallback Removal**:
   - After retry logic, NEVER create a fallback API link
   - If Drive upload fails: xlsxLink = '' (empty)
   - Update Link_XLSX with empty string (indicating temporary failure)
   - Return HTTP 200 with XLSX blob for backward compatibility

4. **Add Response Metadata**:
   - Optionally include in response headers whether upload succeeded
   - Log attempt details for debugging

---

**File 2**: `app/so/input/page.tsx`

**Function**: `handleConfirmedSubmit`

**Specific Changes**:

1. **Add XLSX Upload Wait and Validation**:
   - After calling `/api/so/[laporanId]/xlsx`, wait for response
   - Check response or query database to verify Link_XLSX was actually saved with a Drive link
   - Implement polling with timeout (e.g., 5 retries, 2-second intervals) to verify Link_XLSX is not empty
   - If verification fails after polling, show error and stay on form

2. **Block Redirect Until Drive Link Confirmed**:
   - Only redirect to confirmation page (`/so/konfirmasi/${laporanId}`) after verifying Link_XLSX contains a Drive link
   - If XLSX upload fails or Link_XLSX is empty after retries, show error message:
     - "File XLSX gagal diunggah ke Drive setelah 3 percobaan. Coba submit ulang."
   - Keep user on form to allow resubmission

3. **Update genStep Progress**:
   - Add 'xlsx-verifying' step before 'selesai'
   - Show appropriate loading message during verification

4. **Add Error Recovery**:
   - If XLSX verification fails, show retry button
   - Allow user to attempt resubmission without losing form data

---

**File 3**: `app/so/konfirmasi/[laporanId]/page.tsx`

**Function**: `getXlsxLink()` and rendering logic

**Specific Changes**:

1. **Remove Fallback Link**:
   - Delete the logic that creates fallback API links when Link_XLSX is empty
   - Remove: `const origin = typeof window !== 'undefined' ? window.location.origin : '';`
   - Remove: `${origin}/api/so/${encodeURIComponent(laporanId)}/xlsx-file?...` fallback

2. **Update Link Display Logic**:
   - If Link_XLSX is present: display "Buka File XLSX" button (opens Drive link)
   - If Link_XLSX is empty: display "Download File XLSX" button disabled or show error state
   - Add conditional rendering for badge status based on Link_XLSX presence

3. **Update Badge Status**:
   - If Link_XLSX contains a URL: badge shows "File XLSX tersedia di Google Drive" (success)
   - If Link_XLSX is empty: badge shows "File XLSX gagal diunggah - hubungi admin" (error)

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate XLSX upload failures by mocking `uploadFileToGASDrive` to fail on first attempt but succeed on retry. Run these tests on the UNFIXED code to observe that:
- No retry logic exists
- Fallback links are used instead
- Confirmation page redirects without validating Link_XLSX

**Test Cases**:

1. **First Upload Attempt Fails**: Mock `uploadFileToGASDrive` to throw error on first call
   - Expected counterexample on unfixed code: Error caught silently, fallback link used, no retries attempted
   
2. **Confirmation Page Without Drive Link**: Query Link_XLSX after unfixed submission with Drive upload failure
   - Expected counterexample: Link_XLSX contains temporary API URL instead of Drive link

3. **No Verification Before Redirect**: Check that unfixed code redirects to confirmation without checking Link_XLSX
   - Expected counterexample: Redirect happens immediately regardless of upload outcome

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (upload fails initially), the fixed function produces the expected behavior (retries and succeeds).

**Pseudocode:**
```
FOR ALL input WHERE uploadFailedOnFirstAttempt(input) DO
  setMockBehavior: uploadFileToGASDrive fails on attempt 1, succeeds on attempt 2
  result := handleXlsxSubmission_fixed(input)
  ASSERT result.Link_XLSX contains valid Google Drive webViewLink
  ASSERT result.statusCode = 200
  ASSERT retry count = 2
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (upload succeeds immediately), the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE uploadSucceedImmediately(input) DO
  setMockBehavior: uploadFileToGASDrive succeeds on attempt 1
  result_original := handleXlsxSubmission_original(input)
  result_fixed := handleXlsxSubmission_fixed(input)
  ASSERT result_fixed.Link_XLSX = result_original.Link_XLSX
  ASSERT result_fixed.responseTime ≈ result_original.responseTime (no new delays)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for successful-on-first-attempt scenarios

**Test Plan**: Observe behavior on UNFIXED code first for successful uploads, then write property-based tests capturing that behavior. Verify fixed code matches.

**Test Cases**:

1. **Successful First Attempt**: Generate random SO payloads, mock successful first-attempt uploads, verify no delays introduced
2. **Database State Preservation**: Verify that successful submissions save identical data to spreadsheet before and after fix
3. **Confirmation Page Display**: Verify that confirmation pages for successful submissions render identically
4. **Idempotent Resubmission**: Verify that resubmitting the same sesiId returns existing laporanId without re-uploading

### Unit Tests

- Test retry logic with exponential backoff (500ms, 1000ms, 1500ms)
- Test that transient errors are retried (network timeout, 503 Service Unavailable)
- Test that permanent errors are not retried (401 Unauthorized, 404 Not Found)
- Test that successful retry updates Link_XLSX correctly
- Test that failed retries set Link_XLSX to empty string
- Test that confirmation page correctly displays Drive link or error state
- Test that front-end verification blocks redirect if Link_XLSX is empty

### Property-Based Tests

- Generate random SO submissions with mock Drive upload behaviors and verify retry logic activates correctly
- Generate random successful submissions and verify no retry logic is triggered unnecessarily
- For each test, verify Link_XLSX is correctly persisted to database
- Test that concurrent submissions don't interfere with each other's retry logic

### Integration Tests

- Full SO submission flow with mocked Drive upload failing then succeeding (tests retry and confirmation)
- Full SO submission flow with Drive upload succeeding immediately (tests preservation)
- Confirmation page loads after successful submission with Drive link (verifies link is accessible)
- User attempts resubmission after previous upload failure (verifies idempotency and error recovery)
- WhatsApp sharing works on confirmation page (verifies non-XLSX features still work)
