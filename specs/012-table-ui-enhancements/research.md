# Research: Ideas Table UI Enhancements

**Date**: 2026-09-12  
**Feature**: `012-table-ui-enhancements`

## 1. Fixed Column Dimensions & Layout Stability

### Problem
In the current implementation, `<table className="w-full text-left text-xs border-collapse">` defaults to `table-layout: auto`. When entering inline editing mode in `EditableCell`, the cell content changes from a static text span to an `<input>` element. The browser's layout engine dynamically recalculates the widths of all columns based on the new cell content and input element dimensions, causing columns and neighbor cells to abruptly jump, resize, or stretch.

### Decision
Apply `table-fixed` (`table-layout: fixed; width: 100%`) to the `<table>` element and define explicit, proportional column widths across all 12 columns in `<thead><tr><th className="...">`. Set a minimum table width (`min-w-[1100px]`) wrapped in `overflow-x-auto` to guarantee columns never collapse below their intended legibility threshold on narrow windows.

### Rationale
- Under CSS `table-layout: fixed`, column widths are calculated solely based on the first row (`<th>` elements) and the table's total width. Changes to cell content—including swapping a text span for an `<input>` element or typing longer strings—have zero effect on column widths.
- Inside `EditableCell`, the active `<input>` is styled with `w-full min-w-0 box-border text-center` (or `text-left` for Title and Notes), ensuring it fills the cell without exceeding parent boundaries.

### Column Sizing Breakdown (Total ~100% / min-w 1100px)
| Index | Column Header | Width Class | Approx. % | Minimum Px | Text Alignment |
|---|---|---|---|---|---|
| 0 | Checkbox | `w-10` | ~3% | 38px | Center |
| 1 | Play/Pause | `w-10` | ~3% | 40px | Center |
| 2 | Title | `w-[18%]` | ~18% | 180px | Left |
| 3 | Duration | `w-[8%]` | ~8% | 80px | Center |
| 4 | BPM | `w-[7%]` | ~7% | 70px | Center |
| 5 | Key | `w-[7%]` | ~7% | 70px | Center |
| 6 | Authors | `w-[13%]` | ~13% | 130px | Center |
| 7 | Section | `w-[9%]` | ~9% | 90px | Center |
| 8 | Instruments | `w-[15%]` | ~15% | 150px | Center |
| 9 | Created | `w-[10%]` | ~10% | 100px | Center |
| 10 | Notes | `w-[15%]` | ~15% | 150px | Left |
| 11 | Action | `w-12` | ~4% | 48px | Center |

### Alternatives Considered
- `table-layout: auto` with `width` or `max-width` on cells: Rejected because `table-auto` treats column widths as suggestions; browser recalculates widths whenever inner DOM elements change.
- CSS Grid table: Rejected because the application already uses standard semantic `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` markup with extensive test coverage.

---

## 2. Text Alignment Architecture

### Decision
- **Header Row (`<th>`)**: All 12 columns are centered (`text-center`) in the header.
- **Data Rows (`<td>`)**:
  - Title and Notes remain left-aligned (`text-left`) for optimal readability of variable-length text.
  - All other columns (Checkbox, Play/Pause, Duration, BPM, Key, Authors, Section, Instruments, Created, Action) are centered (`text-center`).
  - For the Instruments column, the pills container uses `flex flex-wrap justify-center gap-1`.

### Rationale
- Centering tabular numbers (Duration, BPM, Created) and short tags (Key, Section, Instruments, Authors) gives a clean, balanced look in desktop catalogs.
- Title and Notes contain natural language phrases, sentences, or lyrics; left alignment prevents ragged left margins and maintains standard reading flow.

---

## 3. Cursor Semantics & Hover Ergonomics

### Decision
- **Header Titles**: Apply `cursor-default select-none` to all `<th>` elements in both View and Edit modes.
- **Edit Mode**:
  - All editable cells (Title, BPM, Key, Authors, Section, Instruments, Notes) display `cursor-pointer` on hover to clearly indicate that clicking activates inline editing.
  - Active `<input>` elements display standard `cursor-text`.
- **View Mode**:
  - Static non-interactive cells (Duration, Created, empty Notes) display `cursor-default`.
  - Interactive cells and buttons display `cursor-pointer`:
    - Row Checkbox (`cursor-pointer`)
    - Play/Pause Button (`cursor-pointer`)
    - Action Toggle Button (`cursor-pointer`)
    - Notes Cell with Content (`cursor-pointer hover:bg-surface-hover/40 transition-colors`)

### Rationale
- Displaying `cursor-text` on static cells gives the misleading impression that the user is selecting text.
- Showing `cursor-pointer` on editable cells in Edit mode matches user expectations for actionable UI controls.
- Limiting `cursor-pointer` in View mode strictly to active targets ensures users know exactly what can be clicked.

---

## 4. Column Header Tooltips

### Decision
Provide informative tooltips using native HTML `title` attributes on each `<th>` element (or inner label container):
- **Title**: "Name or identifier of the audio idea."
- **Duration**: "Total audio length in mm:ss format."
- **BPM**: "Beats per minute tempo (positive numeric value)."
- **Key**: "Musical key signature (e.g., C maj, A min, F#)."
- **Authors**: "Songwriters and performers. In edit mode, separate multiple authors with commas."
- **Section**: "Song structure section (e.g., Intro, Verse, Chorus, Bridge, Outro)."
- **Instruments**: "Musical instruments tagged on this idea. In edit mode, separate multiple instruments with commas."
- **Created**: "Date and time the audio idea was recorded or imported."
- **Notes**: "Production notes, lyrics, chords, or reminders. Click in view mode to read full text."

### Rationale
- Native `title` tooltips are zero-dependency (strictly adhering to Stack Simplicity).
- They never cause z-index or clipping bugs inside `overflow-x-auto` table containers.
- They are natively rendered by Electron/Chromium with platform-consistent delay and styling.

---

## 5. View Mode Note Reader Modal

### Decision
Create `<NoteReaderModal />` in `src/renderer/components/NoteReaderModal.tsx`:
- Rendered conditionally when `activeNote` has notes content and is clicked in View mode.
- Managed via local state in `AppLayout.tsx` (or passed down through `IdeasTable`):
  `noteReaderState: { isOpen: boolean; title: string; notes: string }`
- Clicking a non-empty Notes cell in View mode triggers `onNoteClick(note)`.
- If `note.notes` is `null`, `undefined`, or whitespace-only, `onNoteClick` is not called and the cursor remains `cursor-default`.
- When in Edit mode, clicking Notes continues to trigger `onCellClick(note.id, 'notes')` inline editing.
- Dismissal:
  - Close button in modal footer / header
  - Escape key listener
  - Backdrop click outside the modal card
- Styling: Apple HIG aesthetic matching `DeleteConfirmationModal.tsx` (`bg-surface-primary`, `border border-border`, `rounded-2xl`, `shadow-2xl`, `max-w-lg`).
