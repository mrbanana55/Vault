# Quickstart Validation Guide: Ideas Table UI Enhancements

**Date**: 2026-09-12  
**Feature**: `012-table-ui-enhancements`

This guide outlines runnable validation scenarios to verify all table UI improvements end-to-end.

---

## Prerequisites

1. Ensure dependencies and native modules are aligned:
   ```bash
   npm test
   ```
2. Build and launch the Vault application:
   ```bash
   npm run build
   npm start
   ```

---

## Validation Scenario 1: Fixed Column Dimensions During Editing (FR-001, SC-001)

1. Open the application with at least one audio idea in the table.
2. Switch to **Edit Mode** using the Mode Toggle in the toolbar.
3. Observe the width of the **Title** column and neighboring columns (Duration, BPM, Key).
4. Click on the Title cell of an idea to enter inline editing.
5. Type additional text into the cell.
6. **Expected Result**: The column width and all adjacent column widths remain completely unchanged and rigid. There is zero column resizing, jump, or visual shifting.
7. Press `Enter` or click outside to commit the edit.
8. **Expected Result**: Column dimensions remain identical in both editing and committed states.

---

## Validation Scenario 2: Column Header and Data Alignment (FR-002, FR-003, FR-004, SC-002)

1. Inspect the table header row.
2. **Expected Result**: All column headers (Title, Duration, BPM, Key, Authors, Section, Instruments, Created, Notes) are visually centered (`text-center`).
3. Inspect the data rows.
4. **Expected Result**:
   - **Title**: Left-aligned (`text-left`).
   - **Notes**: Left-aligned (`text-left`).
   - **Duration, BPM, Key, Authors, Section, Instruments, Created Date, Action**: Centered (`text-center`).
   - Instrument pills within the Instruments column are centered horizontally.

---

## Validation Scenario 3: Context-Sensitive Cursors in View and Edit Modes (FR-005, FR-006, FR-007, FR-008, FR-009)

1. Hover over any column header title in the header row.
2. **Expected Result**: The cursor is `default` (`cursor-default`) and text selection is suppressed.
3. Switch to **Edit Mode**:
   - Hover over editable cells (Title, BPM, Key, Authors, Section, Instruments, Notes).
   - **Expected Result**: Cursor displays as a pointer (`cursor-pointer`).
   - Click into a cell to edit.
   - **Expected Result**: Inside the active `<input>` field, the cursor displays as text beam (`cursor-text`).
4. Switch to **View Mode**:
   - Hover over Duration or Created Date cells.
   - **Expected Result**: Cursor is `default` (`cursor-default`).
   - Hover over the selection checkbox, play button, and archive action button.
   - **Expected Result**: Cursor is `pointer` (`cursor-pointer`).

---

## Validation Scenario 4: Column Header Tooltips (FR-013, FR-014, SC-003)

1. In either View or Edit mode, move the mouse over each column header title:
   - Hover over **Instruments**: Tooltip displays: `"Musical instruments tagged on this idea. In edit mode, separate multiple instruments with commas."`
   - Hover over **Authors**: Tooltip displays: `"Songwriters and performers. In edit mode, separate multiple authors with commas."`
   - Hover over **BPM**: Tooltip displays: `"Beats per minute tempo (positive numeric value)."`
   - Hover over **Key**: Tooltip displays: `"Musical key signature (e.g., C maj, A min, F#)."`
   - Hover over **Title**, **Duration**, **Section**, **Created**, **Notes**: Contextual descriptions display.
2. Move the mouse away from the header.
3. **Expected Result**: The tooltip dismisses cleanly.

---

## Validation Scenario 5: View Mode Note Reader Modal (FR-010, FR-011, FR-012, SC-004)

1. Ensure there is an audio idea with note text (e.g., `"Intro acoustic guitar riff in D minor; bridge needs cello backing."`).
2. Ensure table is in **View Mode**.
3. Hover over the Notes cell:
   - **Expected Result**: Cursor displays as a pointer (`cursor-pointer`) and subtle hover highlight appears.
4. Click the Notes cell:
   - **Expected Result**: `<NoteReaderModal />` opens smoothly, displaying the idea's Title and the complete note text.
5. Press `Escape`:
   - **Expected Result**: The modal closes immediately.
6. Click the Notes cell again to reopen:
   - Click outside the dialog card on the darkened backdrop.
   - **Expected Result**: The modal closes.
7. Click the Notes cell again to reopen:
   - Click the "Close" button.
   - **Expected Result**: The modal closes.
8. Find a row with an empty Notes cell (or create one without notes):
   - Hover over the empty Notes cell.
   - **Expected Result**: Cursor remains default (`cursor-default`).
   - Click the empty Notes cell.
   - **Expected Result**: Nothing happens; no modal opens.
9. Switch to **Edit Mode**:
   - Click the Notes cell with content.
   - **Expected Result**: Inline text editing activates in the cell; the modal does NOT open.

---

## Validation Scenario 6: Automated Test Verification (SC-005)

Run the full automated test suite:
```bash
npm test
```
**Expected Result**: All test suites pass cleanly with zero regressions.
