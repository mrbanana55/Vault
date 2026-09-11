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
