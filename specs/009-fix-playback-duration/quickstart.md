# Quickstart Validation Guide: Fix Audio Playback CSP and Real Duration Display

**Feature**: Fix Audio Playback CSP and Real Duration Display
**Branch**: `009-fix-playback-duration`
**Date**: 2026-09-08

This guide outlines end-to-end verification steps for confirming that audio playback works without Content Security Policy or source errors, and that audio durations reflect the actual recording lengths.

---

## Scenario 1: Playback of Audio Files Without CSP Errors

### Steps:
1. Start the application: `npm start`.
2. Open the Developer Tools console (`Cmd+Option+I` on macOS or `Ctrl+Shift+I` on Windows/Linux).
3. Find an idea with an `.m4a` or `.mp3` recording in the ideas table.
4. Click the play button on the left of the row.
5. Verify:
   - Audio begins playing immediately through speakers/headphones.
   - **Zero console errors**: The console does NOT log any CSP violation (`Refused to load media from 'vault-audio://...'`).
   - The console does NOT log `NotSupportedError: Failed to load because no supported source was found`.
   - The top-center time bar advances smoothly.

---

## Scenario 2: Real Duration Resolution for Existing Ideas Showing 00:00

### Steps:
1. Locate any audio idea in the table that previously displayed `0:00`.
2. Observe the Duration column:
   - Within seconds of viewing or clicking play, the `0:00` display updates to the actual track duration (e.g. `1:24`).
3. Click play on that idea:
   - The top-center time bar displays the true duration on the right (e.g. `0:00 / 1:24`).
4. Restart the application (`npm start`):
   - The idea immediately displays its real duration (`1:24`) upon opening, confirming that the resolved duration was saved to the database.

---

## Scenario 3: Real Duration Extraction on New File Import

### Steps:
1. Click the "Import" button in the header or drag-and-drop an audio file (e.g. a 45-second `.wav` or `.m4a` file) into the application.
2. When the import completes, inspect the newly created row in the ideas table:
   - The Duration column displays the exact length (e.g. `0:45`) instead of `0:00`.
3. Click play on the newly imported idea:
   - It plays without errors and scrubs accurately across the full duration.

---

## Scenario 4: Automated Test Suite

Run all unit and component tests:

```bash
npm test
```

Expected outcome: All test suites pass cleanly.
