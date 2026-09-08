import { useState, useCallback } from 'react';
import type { EditableField, ActiveCellId } from '../types/inline-edit';

export interface UseInlineEditOptions {
  onSave: (
    noteId: number,
    field: EditableField,
    value: string
  ) => Promise<boolean>;
}

export interface UseInlineEditResult {
  activeCellId: ActiveCellId;
  startEdit: (noteId: number, field: EditableField) => void;
  commitEdit: (
    noteId: number,
    field: EditableField,
    value: string
  ) => Promise<void>;
  clearEdit: () => void;
}

export function useInlineEdit(
  onSave: (
    noteId: number,
    field: EditableField,
    value: string
  ) => Promise<boolean>
): UseInlineEditResult {
  const [activeCellId, setActiveCellId] = useState<ActiveCellId>(null);

  const startEdit = useCallback(
    (noteId: number, field: EditableField) => {
      setActiveCellId({ noteId, field });
    },
    []
  );

  const clearEdit = useCallback(() => {
    setActiveCellId(null);
  }, []);

  const commitEdit = useCallback(
    async (noteId: number, field: EditableField, value: string) => {
      try {
        const success = await onSave(noteId, field, value);
        if (!success) {
          console.error(
            `Failed to save field "${field}" for note ${noteId}: save rejected`
          );
        }
      } catch (err) {
        console.error(
          `Failed to save field "${field}" for note ${noteId}:`,
          err
        );
      } finally {
        setActiveCellId(null);
      }
    },
    [onSave]
  );

  return {
    activeCellId,
    startEdit,
    commitEdit,
    clearEdit,
  };
}
