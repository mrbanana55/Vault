# Phase 1: Quickstart Validation Guide

**Feature**: Row Selection via Checkboxes (Spec 010)  
**Date**: 2026-09-11

## Prerequisites

- Local repository checked out on `010-row-selection` branch.
- Dependencies installed (`npm install`).

## Automated Verification

Run all Vitest test suites:
```bash
npm test
```

Run TypeScript strict type checking across all configurations:
```bash
npx tsc --noEmit
npx tsc -p tsconfig.main.json --noEmit
npx tsc -p tsconfig.renderer.json --noEmit
```

Build verification:
```bash
npm run build
```

---

## Manual Validation Scenarios

### Scenario 1: Individual Row Selection
1. Launch app with `npm start`.
2. Observe the Ideas table. Verify a checkbox appears at the far left of each row.
3. Click the checkbox on row 1.
   - Verify the checkbox is checked.
   - Verify row 1 gets a distinct visual highlight.
4. Click the checkbox on row 3.
   - Verify both row 1 and row 3 are checked and highlighted.
   - Row 2 remains unselected.
5. Click the checkbox on row 1 again.
   - Verify row 1 unchecks and its highlight is removed.

### Scenario 2: Shift + Click Range Selection (Downwards)
1. Ensure no rows are selected.
2. Click the checkbox on row 2 (without holding Shift).
   - Only row 2 is selected.
3. Hold `Shift` key and click the checkbox on row 6.
   - Rows 2, 3, 4, 5, and 6 are all checked and highlighted.
   - No unintended blue text selection occurs.

### Scenario 3: Shift + Click Range Selection (Upwards)
1. Refresh or uncheck all rows.
2. Click the checkbox on row 5.
3. Hold `Shift` and click the checkbox on row 1.
   - Rows 1, 2, 3, 4, and 5 are all checked and highlighted.

### Scenario 4: Non-interference with Existing Controls
1. With a row selected, click its Play button.
   - Playback starts/pauses without altering the selection state.
2. Switch to `Edit` mode.
   - Click a cell (e.g. Title or BPM) to edit.
   - Cell enters editing mode without altering the checkbox selection state.
3. Click the checkbox in Edit mode.
   - Checkbox toggles without entering cell edit mode.

### Scenario 5: Tab Switch Selection Reset
1. Select 2 rows on the "Ideas" tab.
2. Click the "Archive" tab.
   - Verify no rows are selected in the Archive tab.
3. Click back to the "Ideas" tab.
   - Verify selection state is clean and predictable.
