# Phase 1: UI & Component Contracts

**Feature**: Row Selection via Checkboxes (Spec 010)  
**Date**: 2026-09-11

## Overview

This document specifies the TypeScript interfaces and props for the row selection hook and updated table components in the Vault Renderer.

---

## 1. Custom Hook: `useRowSelection`

Location: `src/renderer/hooks/useRowSelection.ts`

```typescript
export interface UseRowSelectionOptions {
  /** Array of note items currently displayed in the table view */
  notes: { id: number }[];
  /** Current active tab (0 = Ideas, 1 = Archive) to handle tab-switch resets */
  activeTab: 0 | 1;
}

export interface UseRowSelectionReturn {
  /** Set of currently selected note IDs */
  selectedIds: Set<number>;
  /** Total count of selected items */
  selectedCount: number;
  /** Check if a specific note ID is selected */
  isSelected: (noteId: number) => boolean;
  /** Handle a row checkbox click with optional Shift-key modifier */
  handleRowSelect: (noteId: number, index: number, shiftKey: boolean) => void;
  /** Select all visible notes in the current view */
  selectAll: () => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Whether all visible notes are currently selected */
  isAllSelected: boolean;
  /** Whether some (but not all) visible notes are selected */
  isIndeterminate: boolean;
}
```

---

## 2. Updated Component Props

### `IdeasTableProps`
Location: `src/renderer/components/IdeasTable.tsx`

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
  // Row selection extensions:
  selectedIds: Set<number>;
  onRowSelect: (noteId: number, index: number, shiftKey: boolean) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
}
```

### `TableRowProps`
Location: `src/renderer/components/TableRow.tsx`

```typescript
interface TableRowProps {
  note: NoteWithInstruments;
  index: number; // 0-based visual index in the table
  tableMode: TableMode;
  activeCellId: ActiveCellId;
  onCellClick: (noteId: number, field: EditableField) => void;
  onCellCommit: (noteId: number, field: EditableField, value: string) => void;
  onToggle: () => void;
  // Row selection extensions:
  isSelected: boolean;
  onSelect: (noteId: number, index: number, shiftKey: boolean) => void;
}
```

---

## 3. DOM & Interaction Contracts

### Checkbox Column (Index 0 in `TableRow`)
- Element: `<td className="w-9 px-2 text-center">`
- Inner Element: `<input type="checkbox" />`
- Attributes:
  - `data-testid={`row-checkbox-${note.id}`}`
  - `checked={isSelected}`
  - `aria-label={`Select ${note.title}`}`
  - `className="w-4 h-4 rounded border-border text-accent-blue focus:ring-accent-blue/40 cursor-pointer accent-accent-blue"`
- Event handling:
  - `onClick={(e) => { e.stopPropagation(); onSelect(note.id, index, e.shiftKey); }}`
  - Suppresses text selection range on `e.shiftKey`.

### Row Highlight Classes
- If playing AND selected:
  `bg-surface-secondary/80 ring-1 ring-accent-blue/50`
- If playing (not selected):
  `bg-surface-secondary/60 hover:bg-surface-secondary/80`
- If selected (not playing):
  `bg-surface-secondary/50 hover:bg-surface-secondary/70`
- Normal row:
  `hover:bg-surface-hover`
