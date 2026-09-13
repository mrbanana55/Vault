# UI Component Contracts: Ideas Table UI Enhancements

**Date**: 2026-09-12  
**Feature**: `012-table-ui-enhancements`

## 1. `NoteReaderModal` Component Contract

Path: `src/renderer/components/NoteReaderModal.tsx`

```typescript
export interface NoteReaderModalProps {
  isOpen: boolean;
  title: string;
  notes: string;
  onClose: () => void;
}
```

### Behavior Contract:
- **Mount / Unmount**: Renders nothing when `isOpen` is `false`.
- **Dismissal triggers**:
  - `Escape` key event on `window` triggers `onClose()`.
  - Clicking on the outer modal overlay backdrop triggers `onClose()`.
  - Clicking the "Close" button triggers `onClose()`.
- **Accessibility**:
  - Root container has `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="note-reader-title"`.
- **Text formatting**:
  - Note body is displayed in a dedicated card with `whitespace-pre-wrap`, `break-words`, and `max-h-96 overflow-y-auto`.

---

## 2. `EditableCell` Component Contract Updates

Path: `src/renderer/components/EditableCell.tsx`

```typescript
export interface EditableCellProps {
  value: string;
  isEditing: boolean;
  isEditable: boolean;
  tableMode: TableMode;
  align?: 'left' | 'center';
  onClick?: () => void;
  onCommit: (newValue: string) => void;
  className?: string;
  title?: string;
  children: React.ReactNode;
  'data-testid'?: string;
}
```

### Cursor & Layout Behavior Contract:
- **Hover in Edit Mode (`tableMode === 'edit' && isEditable && !isEditing`)**:
  - Must apply `cursor-pointer hover:bg-surface-hover/50`.
  - Must NOT apply `cursor-text`.
- **Active Editing Mode (`isEditing === true`)**:
  - The cell renders an `<input>` element with `w-full min-w-0 box-border text-xs bg-transparent border-0 outline-none ring-0 text-content-primary py-0`.
  - The input text alignment matches `align === 'center' ? 'text-center' : 'text-left'`.
  - Column size must NOT change.
- **View Mode (`tableMode === 'view'`)**:
  - If not editable or in view mode, defaults to `cursor-default` unless overridden by children.

---

## 3. `TableRow` Component Contract Updates

Path: `src/renderer/components/TableRow.tsx`

```typescript
export interface TableRowProps {
  note: NoteWithInstruments;
  index: number;
  tableMode: TableMode;
  activeCellId: ActiveCellId;
  isSelected?: boolean;
  onSelect?: (noteId: number, index: number, shiftKey: boolean) => void;
  onCellClick: (noteId: number, field: EditableField) => void;
  onCellCommit: (noteId: number, field: EditableField, value: string) => void;
  onNoteClick?: (note: NoteWithInstruments) => void;
  onToggle: () => void;
}
```

### Layout & Cursor Contract:
- **Row cells alignment**:
  - `Title`: `text-left`
  - `Duration`: `text-center`
  - `BPM`: `text-center`
  - `Key`: `text-center`
  - `Authors`: `text-center`
  - `Section`: `text-center`
  - `Instruments`: `text-center` (flex badges centered via `justify-center`)
  - `Created`: `text-center`
  - `Notes`: `text-left`
  - `Action`: `text-center`
- **View mode Notes cell interaction**:
  - If `Boolean(note.notes?.trim())`:
    - Shows `cursor-pointer hover:bg-surface-hover/40 transition-colors`.
    - Clicking calls `onNoteClick?.(note)`.
  - If `!note.notes?.trim()`:
    - Shows `cursor-default`.
    - Clicking does nothing.
- **Edit mode Notes cell interaction**:
  - Clicking calls `onCellClick(note.id, 'notes')` to begin inline editing.
  - Does NOT call `onNoteClick`.

---

## 4. `IdeasTable` Component Contract Updates

Path: `src/renderer/components/IdeasTable.tsx`

```typescript
export interface IdeasTableProps {
  isUsed: 0 | 1;
  notes: NoteWithInstruments[];
  loading: boolean;
  error: string | null;
  onRefetch: () => void;
  tableMode: TableMode;
  activeCellId: ActiveCellId;
  onCellClick: (noteId: number, field: EditableField) => void;
  onCellCommit: (noteId: number, field: EditableField, value: string) => void;
  onNoteClick?: (note: NoteWithInstruments) => void;
  selectedIds?: Set<number>;
  onRowSelect?: (noteId: number, index: number, shiftKey: boolean) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
}
```

### Table Layout & Header Contract:
- **Table element**: `<table className="w-full table-fixed text-xs border-collapse min-w-[1100px]">`
- **Header row (`<th>`)**:
  - All 12 columns have `text-center cursor-default select-none`.
  - Column headers have informative `title` attributes corresponding to the defined column tooltips.
  - Fixed column width classes (`w-10`, `w-[18%]`, etc.) applied to all `<th>` elements.
