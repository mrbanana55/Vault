import { useState, useCallback, useEffect, useRef } from 'react';
import type { UseRowSelectionOptions, UseRowSelectionReturn } from '../types/row-selection';

export function useRowSelection({
  notes,
  activeTab,
}: UseRowSelectionOptions): UseRowSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const lastAnchorIndexRef = useRef<number | null>(null);

  // Reset selection when tab switches
  useEffect(() => {
    setSelectedIds(new Set());
    lastAnchorIndexRef.current = null;
  }, [activeTab]);

  // Prune any selected IDs that are no longer present in notes
  useEffect(() => {
    const validIds = new Set(notes.map((n) => n.id));
    setSelectedIds((prev) => {
      let changed = false;
      const next = new Set<number>();
      for (const id of prev) {
        if (validIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [notes]);

  const isSelected = useCallback(
    (noteId: number) => selectedIds.has(noteId),
    [selectedIds]
  );

  const handleRowSelect = useCallback(
    (noteId: number, index: number, shiftKey: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);

        if (!shiftKey || lastAnchorIndexRef.current === null) {
          // Normal click or first click with Shift
          if (next.has(noteId)) {
            next.delete(noteId);
          } else {
            next.add(noteId);
          }
          lastAnchorIndexRef.current = index;
        } else {
          // Shift + Click range selection (from anchor to index)
          const start = Math.min(lastAnchorIndexRef.current, index);
          const end = Math.max(lastAnchorIndexRef.current, index);

          for (let i = start; i <= end; i++) {
            if (i >= 0 && i < notes.length) {
              next.add(notes[i].id);
            }
          }
          // In standard range selection (like Gmail), the original anchor remains the anchor
        }

        return next;
      });
    },
    [notes]
  );

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(notes.map((n) => n.id)));
  }, [notes]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    lastAnchorIndexRef.current = null;
  }, []);

  const selectedCount = selectedIds.size;
  const isAllSelected = notes.length > 0 && selectedCount === notes.length;
  const isIndeterminate = selectedCount > 0 && selectedCount < notes.length;

  return {
    selectedIds,
    selectedCount,
    isSelected,
    handleRowSelect,
    selectAll,
    clearSelection,
    isAllSelected,
    isIndeterminate,
  };
}
