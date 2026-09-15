# Bugfix Requirements: XLSX Google Drive Upload Must Always Succeed

## Introduction

Currently, when submitting a Stock Opname (SO), the system generates an XLSX file and attempts to upload it to Google Drive. However, if the Drive upload fails, the system falls back to serving the file via a temporary API endpoint (`/api/so/[laporanId]/xlsx-file`). This fallback prevents the XLSX link from being saved to the database, leaving the confirmation page in an inconsistent state.

The fix ensures that XLSX files MUST be successfully uploaded to Google Drive before the confirmation page is displayed. The system will retry failed uploads up to 3 times before aborting the submission.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the SO submission triggers XLSX generation and Google Drive upload fails THEN the system falls back to the temporary `/api/so/[laporanId]/xlsx-file` API endpoint without retrying

1.2 WHEN the Drive upload fails and fallback is used THEN the Link_XLSX field in the Laporan_PDF spreadsheet remains empty or is set to a temporary API URL instead of a permanent Drive link

1.3 WHEN the confirmation page loads and Link_XLSX is empty THEN a warning badge displays "File XLSX tersedia untuk diunduh (belum tersimpan di Drive)" instead of confirming permanent storage

1.4 WHEN the Drive upload fails on the initial attempt THEN the system does not attempt to retry the upload operation

### Expected Behavior (Correct)

2.1 WHEN the SO submission triggers XLSX generation and Google Drive upload fails THEN the system SHALL automatically retry the upload (up to 3 attempts total) before accepting the failure

2.2 WHEN the Google Drive upload succeeds (on any retry attempt up to 3) THEN the system SHALL save the permanent Drive link (webViewLink) to the Link_XLSX field in the Laporan_PDF spreadsheet

2.3 WHEN all 3 upload retry attempts fail THEN the system SHALL return an error response and prevent the SO submission from completing, returning control to the user with a clear error message

2.4 WHEN the confirmation page loads after successful submission THEN the Link_XLSX field SHALL contain a permanent Google Drive link, and a success badge SHALL display "File XLSX tersedia di Google Drive"

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the SO submission succeeds on the first attempt and Drive upload succeeds on first try THEN the system SHALL CONTINUE TO display the confirmation page with the Drive link immediately available

3.2 WHEN a user clicks the XLSX button on the confirmation page and Link_XLSX is set to a Drive link THEN the system SHALL CONTINUE TO open the Google Drive file directly in a new tab

3.3 WHEN the user clicks "Buka File XLSX" or "Download File XLSX" THEN the system SHALL CONTINUE TO display the correct button label based on whether Link_XLSX is populated (Drive link = "Buka File XLSX", no link = "Download File XLSX")

3.4 WHEN a sesiId has already been processed (idempotent check) THEN the system SHALL CONTINUE TO return the existing laporanId without re-uploading the XLSX

3.5 WHEN the XLSX report is regenerated via the regenerate endpoint THEN the system SHALL CONTINUE TO generate the spreadsheet with the correct formatting and previous SO data comparison
