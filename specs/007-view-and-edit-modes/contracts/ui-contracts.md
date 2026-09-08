# UI Contracts: View and Edit Modes

**Feature**: 007-view-and-edit-modes | **Date**: 2026-09-08

## Overview

This feature has no external API or IPC contract changes. All contracts are internal UI component interfaces that define how the new editing behavior integrates with existing components.

---

## C1: Table Mode Prop Contract

The `tableMode` state flows from `AppLayout` through to table components.

### AppLayout → IdeasTable

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `tableMode` | `'view' \| 'edit'` | Yes | Current interaction mode |

### AppLayout → TabBar area (mode toggle)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `tableMode` | `'view' \| 'edit'` | Yes | Current mode for visual indicator |
| `onModeChange` | `(mode: 'view' \| 'edit') => void` | Yes | Callback when mode is toggled |

---

## C2: IdeasTable → TableRow Prop Extension

### Current Props (unchanged)

| Prop | Type | Description |
|------|------|-------------|
| `note` | `NoteWithInstruments` | The audio note data |
| `onToggle` | `() => void` | Refetch trigger after archive/restore |

### New Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `tableMode` | `'view' \| 'edit'` | Yes | Controls whether cells are editable |
| `activeCellId` | `{ noteId: number; field: EditableField } \| null` | Yes | Currently active editing cell |
| `onCellClick` | `(noteId: number, field: EditableField) => void` | Yes | Called when an editable cell is clicked in edit mode |
| `onCellCommit` | `(noteId: number, field: EditableField, value: string) => void` | Yes | Called to commit an edit |

---

## C3: EditableCell Component Contract

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `string` | Yes | Current display value for the cell |
| `isEditing` | `boolean` | Yes | Whether this cell is currently in edit mode |
| `isEditable` | `boolean` | Yes | Whether this cell supports editing (false for Duration, Created) |
| `onClick` | `() => void` | Yes | Called when the cell is clicked |
| `onCommit` | `(newValue: string) => void` | Yes | Called with the new value when editing is committed |
| `className` | `string` | No | Additional CSS classes for the cell |

### Behavior Contract

1. **When `isEditable === false`**: Renders as a plain `<td>` with no interaction cues.
2. **When `isEditable === true` and `isEditing === false`**: Renders as a `<td>` with hover affordance class in edit mode (cursor and background hint).
3. **When `isEditing === true`**: Renders a controlled `<input>` element:
   - Auto-focused on mount
   - Pre-populated with `value`
   - `onBlur` → calls `onCommit(inputValue)`
   - `onKeyDown` (Escape) → calls `inputRef.blur()` (which triggers `onBlur` → `onCommit`)
   - Text selected on focus for easy replacement

---

## C4: useInlineEdit Hook Contract

### Input

| Parameter | Type | Description |
|-----------|------|-------------|
| `onSave` | `(noteId: number, field: EditableField, value: string) => Promise<boolean>` | Async save function returning success/failure |

### Output

| Property | Type | Description |
|----------|------|-------------|
| `activeCellId` | `{ noteId: number; field: EditableField } \| null` | Currently active cell |
| `startEdit` | `(noteId: number, field: EditableField) => void` | Begin editing a cell |
| `commitEdit` | `(noteId: number, field: EditableField, value: string) => Promise<void>` | Commit a cell's value |
| `clearEdit` | `() => void` | Clear active cell (used on mode change after commit) |

### State Machine

```
Idle (activeCellId === null)
  → startEdit(noteId, field) → Active (activeCellId === {noteId, field})

Active (activeCellId === {noteId, field})
  → commitEdit(noteId, field, value)
    → onSave succeeds → Idle
    → onSave fails → Idle (value reverted by EditableCell)
  → startEdit(otherNoteId, otherField)
    → implicit commit of current cell → Active (new cell)
  → clearEdit() → Idle
```

---

## C5: Update Pipeline Contract (Existing — No Changes)

The existing IPC pipeline handles all persistence. For reference:

```
EditableCell.onCommit(value)
  → useInlineEdit.commitEdit(noteId, field, value)
    → Transform value to UpdateAudioNoteInput format
    → window.vaultAPI.notes.update(input)
      → IPC: 'notes:update'
        → note-repository.updateNote(db, input)
          → SQLite UPDATE within transaction
          → Returns updated AudioNote
        → Returns IPCResult<AudioNote>
    → On success: refetch notes
    → On failure: revert cell value
```

### Value Transformation Rules

| Field | Input String | `UpdateAudioNoteInput` Value |
|-------|-------------|------------------------------|
| `title` | `"My Song"` | `{ id, title: "My Song" }` |
| `title` | `""` or `"  "` | **Rejected** — do not call update; revert |
| `bpm` | `"120"` | `{ id, bpm: 120 }` |
| `bpm` | `""` | `{ id, bpm: null }` |
| `bpm` | `"abc"` or `"-5"` or `"0"` | **Rejected** — do not call update; revert |
| `musical_key` | `"C major"` | `{ id, musical_key: "C major" }` |
| `musical_key` | `""` | `{ id, musical_key: null }` |
| `authors` | `"John Doe"` | `{ id, authors: "John Doe" }` |
| `authors` | `""` | `{ id, authors: null }` |
| `song_section` | `"Verse"` | `{ id, song_section: "Verse" }` |
| `song_section` | `""` | `{ id, song_section: null }` |
| `notes` | `"Remember to..."` | `{ id, notes: "Remember to..." }` |
| `notes` | `""` | `{ id, notes: null }` |
| `instruments` | `"Guitar, Piano"` | `{ id, instrument_names: ["Guitar", "Piano"] }` |
| `instruments` | `""` | `{ id, instrument_names: [] }` |
