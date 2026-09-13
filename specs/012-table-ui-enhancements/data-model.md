# Data Model: Ideas Table UI Enhancements

**Date**: 2026-09-12  
**Feature**: `012-table-ui-enhancements`

## 1. Frontend UI State Entities

### `TableColumnConfig`
Defines the visual, structural, and behavioral properties of each column in the ideas table.

```typescript
export interface TableColumnConfig {
  id: string;
  label: string;
  widthClass: string;
  align: 'left' | 'center';
  tooltip?: string;
  headerTooltip?: string;
}
```

#### Canonical Column Definitions:
1. **Selection Checkbox**: `id: 'select'`, `widthClass: 'w-10'`, `align: 'center'`
2. **Play/Pause**: `id: 'playback'`, `widthClass: 'w-10'`, `align: 'center'`
3. **Title**: `id: 'title'`, `widthClass: 'w-[18%]'`, `align: 'left'`, `tooltip: 'Name or identifier of the audio idea.'`
4. **Duration**: `id: 'duration'`, `widthClass: 'w-[8%]'`, `align: 'center'`, `tooltip: 'Total audio length in mm:ss format.'`
5. **BPM**: `id: 'bpm'`, `widthClass: 'w-[7%]'`, `align: 'center'`, `tooltip: 'Beats per minute tempo (positive numeric value).'`
6. **Key**: `id: 'musical_key'`, `widthClass: 'w-[7%]'`, `align: 'center'`, `tooltip: 'Musical key signature (e.g., C maj, A min, F#).'`
7. **Authors**: `id: 'authors'`, `widthClass: 'w-[13%]'`, `align: 'center'`, `tooltip: 'Songwriters and performers. In edit mode, separate multiple authors with commas.'`
8. **Section**: `id: 'song_section'`, `widthClass: 'w-[9%]'`, `align: 'center'`, `tooltip: 'Song structure section (e.g., Intro, Verse, Chorus, Bridge, Outro).'`
9. **Instruments**: `id: 'instruments'`, `widthClass: 'w-[15%]'`, `align: 'center'`, `tooltip: 'Musical instruments tagged on this idea. In edit mode, separate multiple instruments with commas.'`
10. **Created**: `id: 'created_at'`, `widthClass: 'w-[10%]'`, `align: 'center'`, `tooltip: 'Date and time the audio idea was recorded or imported.'`
11. **Notes**: `id: 'notes'`, `widthClass: 'w-[15%]'`, `align: 'left'`, `tooltip: 'Production notes, lyrics, chords, or reminders. Click in view mode to read full text.'`
12. **Action**: `id: 'action'`, `widthClass: 'w-12'`, `align: 'center'`

---

### `NoteReaderModalState`
Represents the transient modal dialog displaying the full notes of an audio idea in View mode.

```typescript
export interface NoteReaderModalState {
  isOpen: boolean;
  title: string;
  notes: string;
}
```

#### State Transitions:
- **Idle / Closed**: `{ isOpen: false, title: '', notes: '' }`
- **Open Modal (View Mode on Notes with content)**:
  - User clicks notes cell in View mode where `note.notes?.trim().length > 0`.
  - State becomes: `{ isOpen: true, title: note.title, notes: note.notes }`.
- **Dismiss Modal**:
  - User clicks Close button, clicks backdrop, or presses Escape.
  - State returns to `{ isOpen: false, title: '', notes: '' }`.

---

## 2. Cursor State Rules

| Cell / Element | Mode | Condition | Computed Cursor | Click Action |
|---|---|---|---|---|
| Column Headers (`<th>`) | View / Edit | Always | `cursor-default select-none` | None (static label) |
| Editable Cells | Edit | Cell is editable | `cursor-pointer` | Activates inline editing input |
| Active Edit Input | Edit | Cell currently editing | `cursor-text` | Native text editing |
| Selection Checkbox | View / Edit | Always | `cursor-pointer` | Toggles row selection |
| Play/Pause Button | View / Edit | Always | `cursor-pointer` | Toggles audio playback |
| Action Button (Archive) | View / Edit | Always | `cursor-pointer` | Toggles used / archived status |
| Static Cells (Duration, Created) | View | Always | `cursor-default` | None |
| Notes Cell | View | `note.notes?.trim().length > 0` | `cursor-pointer` | Opens `NoteReaderModal` |
| Notes Cell | View | Empty / null / whitespace | `cursor-default` | None |
| Other Cells (Title, BPM, Key, etc.) | View | Always | `cursor-default` | None |
