# Phase 1: Quickstart Validation Guide

**Feature**: Delete Selected Audio Ideas (Spec 011)  
**Date**: 2026-09-11

## Prerequisites

- Local repository checked out on `011-delete-audio-ideas` branch.
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

### Scenario 1: Delete Button Disabled State
1. Launch app with `npm start`.
2. Ensure no ideas are selected in the Ideas table.
3. Observe the toolbar next to the tabs ("Ideas", "Archive").
   - Verify a trash icon button is visible immediately to the right of the tabs.
   - Verify the button is dimmed (`opacity-40`) and cannot be clicked.

### Scenario 2: Delete Button Active State & Selection Badge
1. Select row 1 and row 2 by checking their checkboxes.
   - Verify the trash icon button becomes active.
   - Verify a count badge showing "2" appears next to the trash icon.
   - Hover over the button: verify a subtle red/danger highlight affordance.

### Scenario 3: Cancel Deletion
1. With 2 rows selected, click the active delete button.
   - Verify the confirmation modal opens with backdrop blur.
   - Verify the dialog message states: "Are you sure you want to delete these 2 audio ideas? Once deleted, the audio cannot be recovered."
   - Verify "Cancel" and "Accept" buttons are displayed.
2. Click "Cancel" (or press `Escape`).
   - Verify the modal closes.
   - Verify both ideas remain in the table, completely untouched.

### Scenario 4: Confirm Deletion
1. With 1 idea selected, click the delete button.
2. Click "Accept".
   - Verify the modal displays brief deleting state and closes.
   - Verify the selected idea is removed from the table and storage.
   - Verify selection resets to 0 and the delete button returns to disabled.

### Scenario 5: Playing Track Deletion Safety
1. Start playing an audio idea.
2. Select that playing idea and click the delete button.
3. Click "Accept".
   - Verify audio playback halts immediately and the audio player bar clears.
   - Verify the idea is deleted cleanly without console errors.
