# Quickstart Validation Guide: View and Edit Modes

**Feature**: 007-view-and-edit-modes | **Date**: 2026-09-08

## Prerequisites

- Node.js and npm installed
- Project dependencies installed (`npm install`)
- Native modules rebuilt for Electron (`npm run rebuild`)
- At least 2-3 audio ideas imported into the database (via drag-and-drop or the Import button)

## Running the Application

```bash
npm run start
```

This builds the main process and launches Electron with the Vault app.

## Running Tests

```bash
npm test
```

Runs all Vitest tests (main process + renderer component tests).

---

## Validation Scenarios

### V1: Mode Toggle Exists and Defaults to View

**Steps**:
1. Launch the application
2. Look at the toolbar area above the Ideas Table (next to the tab bar)

**Expected**:
- A mode toggle control is visible (e.g., "View" / "Edit" buttons or a segmented control)
- The "View" option is active/highlighted by default
- The Ideas Table renders normally with no editing affordances

---

### V2: Toggle to Edit Mode

**Steps**:
1. Click the "Edit" mode option in the toggle

**Expected**:
- The toggle visually switches to indicate "Edit" mode is active
- Hovering over editable cells (Title, BPM, Key, Authors, Section, Instruments, Notes) shows a subtle hover cue (e.g., background change or cursor change)
- Hovering over non-editable cells (Duration, Created, Actions) shows no editable cue

---

### V3: Inline Edit — Click to Activate

**Steps**:
1. Ensure the table is in Edit mode
2. Click on a Title cell for any row

**Expected**:
- The cell transforms into a text input
- The input is pre-populated with the current title value
- The input is auto-focused with text selected

---

### V4: Inline Edit — Commit on Escape

**Steps**:
1. With a cell active (from V3), change the title text
2. Press the Escape key

**Expected**:
- The input disappears and the cell shows the new value
- The change persists (reload the app to verify)

---

### V5: Inline Edit — Commit on Click Away

**Steps**:
1. Click on a BPM cell to edit it
2. Type a new BPM value (e.g., "120")
3. Click anywhere outside the cell (e.g., on the table background or another non-editable cell)

**Expected**:
- The BPM cell shows the new value "120"
- The change persists after app restart

---

### V6: Duration Column is Non-Editable

**Steps**:
1. In Edit mode, click on a Duration cell

**Expected**:
- Nothing happens — no input appears
- The cell remains in its display state

---

### V7: Single Cell Active at a Time

**Steps**:
1. In Edit mode, click on a Title cell (Row 1)
2. While the Title cell is being edited, click on a BPM cell (Row 2)

**Expected**:
- The Title cell commits its current value and returns to display state
- The BPM cell becomes the new active editor

---

### V8: Instruments Editing (Comma-Separated)

**Steps**:
1. In Edit mode, click on an Instruments cell
2. The input should show current instruments as comma-separated text (e.g., "Guitar, Piano")
3. Modify the text (e.g., add ", Drums")
4. Press Escape

**Expected**:
- The Instruments cell now shows three badge pills: Guitar, Piano, Drums
- New instruments are created in the database if they didn't exist before

---

### V9: Empty Title Rejection

**Steps**:
1. In Edit mode, click on a Title cell
2. Clear all text so the input is empty
3. Press Escape

**Expected**:
- The cell reverts to its previous title value
- The title is NOT saved as empty

---

### V10: Invalid BPM Rejection

**Steps**:
1. In Edit mode, click on a BPM cell
2. Type "abc" (non-numeric)
3. Press Escape

**Expected**:
- The cell reverts to its previous BPM value
- Invalid input is NOT saved

---

### V11: Mode Switch While Editing

**Steps**:
1. In Edit mode, click on a cell and modify its value
2. Without pressing Escape or clicking away, click the "View" mode toggle

**Expected**:
- The pending edit is committed (saved)
- The table transitions to View mode with no active editors
- All cells are now non-editable

---

### V12: View Mode — No Editing Possible

**Steps**:
1. Ensure the table is in View mode
2. Click on any data cell (Title, BPM, etc.)

**Expected**:
- Nothing happens — no input appears
- Existing playback and archive/restore actions still work normally

---

### V13: Playback Works in Both Modes

**Steps**:
1. In View mode, play an audio idea → verify playback works
2. Toggle to Edit mode → verify the audio continues playing
3. In Edit mode, edit a cell while audio is playing → verify playback is not interrupted

**Expected**:
- Audio playback is completely independent of editing mode
- No interruption or glitching when toggling modes or editing cells

---

## Test Coverage Checklist

| Area | Test Type | What to Verify |
|------|-----------|----------------|
| `EditableCell` | Component (unit) | Renders input on click, commits on blur, commits on Escape, auto-focuses |
| `useInlineEdit` | Hook (unit) | State transitions, single-active enforcement, save call |
| `TableRow` | Component (integration) | Passes mode/edit props to cells, editable vs non-editable columns |
| Mode toggle | Component (unit) | Renders toggle, calls onModeChange, shows active state |
| Value transforms | Unit | BPM parsing, empty string handling, instrument splitting |
