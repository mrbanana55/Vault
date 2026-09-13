import { useState, useCallback } from "react";
import type { UpdateAudioNoteInput } from "@shared/types";
import type { NoteWithInstruments } from "../hooks/useNotes";
import type { TableMode, EditableField } from "../types/inline-edit";
import { Header } from "./Header";
import { TabBar } from "./TabBar";
import { ModeToggle } from "./ModeToggle";
import { DeleteButton } from "./DeleteButton";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { NoteReaderModal } from "./NoteReaderModal";
import { IdeasTable } from "./IdeasTable";
import { RecordingPanel } from "./RecordingPanel";
import { DragDropOverlay } from "./DragDropOverlay";
import { CircularProgressModal } from "./CircularProgressModal";
import { useNotes } from "../hooks/useNotes";
import { useInlineEdit } from "../hooks/useInlineEdit";
import { useAudioImport } from "../hooks/useAudioImport";
import { useRowSelection } from "../hooks/useRowSelection";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { transformFieldValue } from "../lib/field-transforms";

export function AppLayout() {
  const [activeTab, setActiveTab] = useState<0 | 1>(0);
  const [tableMode, setTableMode] = useState<TableMode>("view");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [noteReaderModal, setNoteReaderModal] = useState<{
    isOpen: boolean;
    title: string;
    notes: string;
  }>({
    isOpen: false,
    title: "",
    notes: "",
  });

  const { notes, loading, error, refetch } = useNotes(activeTab);
  const { currentNote, pause } = useAudioPlayer();

  const {
    selectedIds,
    selectedCount,
    handleRowSelect,
    selectAll,
    clearSelection,
  } = useRowSelection({
    notes,
    activeTab,
  });

  const handleSave = useCallback(
    async (
      noteId: number,
      field: EditableField,
      value: string,
    ): Promise<boolean> => {
      const transform = transformFieldValue(field, value);
      if (!transform.valid || !transform.value) {
        return false;
      }
      try {
        const updatePayload: UpdateAudioNoteInput = {
          id: noteId,
          ...transform.value,
        };
        const result = await window.vaultAPI.notes.update(updatePayload);
        if (result.success) {
          refetch();
          return true;
        }
        return false;
      } catch (err) {
        console.error("Error updating note:", err);
        return false;
      }
    },
    [refetch],
  );

  const { activeCellId, startEdit, commitEdit, clearEdit } =
    useInlineEdit(handleSave);

  const handleModeChange = useCallback(
    (newMode: TableMode) => {
      if (newMode === "view" && activeCellId) {
        clearEdit();
      }
      setTableMode(newMode);
    },
    [activeCellId, clearEdit],
  );

  const handleTabChange = useCallback(
    (tab: 0 | 1) => {
      clearEdit();
      setActiveTab(tab);
    },
    [clearEdit],
  );

  const handleNoteClick = useCallback((note: NoteWithInstruments) => {
    if (note.notes && note.notes.trim().length > 0) {
      setNoteReaderModal({
        isOpen: true,
        title: note.title,
        notes: note.notes,
      });
    }
  }, []);

  const handleImportComplete = useCallback(() => {
    refetch();
  }, [refetch]);

  const { isDragging, batchState, importFiles, dismissProgress } =
    useAudioImport({
      onImportComplete: handleImportComplete,
    });

  const handleDeleteConfirm = useCallback(async () => {
    if (selectedCount === 0 || isDeleting) return;
    setIsDeleting(true);

    try {
      // If currently playing note is in the deletion set, stop playback
      if (currentNote && selectedIds.has(currentNote.id)) {
        pause();
      }

      const idsToDelete = Array.from(selectedIds);
      for (const id of idsToDelete) {
        await window.vaultAPI.notes.delete(id);
      }

      clearSelection();
      refetch();
      setIsConfirmOpen(false);
    } catch (err) {
      console.error("Error deleting notes:", err);
    } finally {
      setIsDeleting(false);
    }
  }, [
    selectedCount,
    isDeleting,
    currentNote,
    selectedIds,
    pause,
    clearSelection,
    refetch,
  ]);

  return (
    <div className="flex flex-col h-screen bg-surface-secondary text-content-primary overflow-hidden transition-colors">
      <Header onImportFiles={importFiles} />
      <main className="flex-1 flex flex-col min-h-0 px-6 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
            <DeleteButton
              selectedCount={selectedCount}
              onClick={() => setIsConfirmOpen(true)}
            />
          </div>
          <ModeToggle tableMode={tableMode} onModeChange={handleModeChange} />
        </div>
        <div className="flex-1 min-h-0 rounded-xl bg-surface-primary border border-border overflow-hidden shadow-xs flex flex-col">
          <div className="flex-1 overflow-auto">
            <IdeasTable
              isUsed={activeTab}
              notes={notes}
              loading={loading}
              error={error}
              onRefetch={refetch}
              tableMode={tableMode}
              activeCellId={activeCellId}
              onCellClick={startEdit}
              onCellCommit={commitEdit}
              onNoteClick={handleNoteClick}
              selectedIds={selectedIds}
              onRowSelect={handleRowSelect}
              onSelectAll={selectAll}
              onClearSelection={clearSelection}
            />
          </div>
        </div>
      </main>
      <RecordingPanel />
      <DragDropOverlay isDragging={isDragging} />
      <CircularProgressModal
        isOpen={batchState.isActive}
        progressPercentage={batchState.overallPercentage}
        currentFileName={batchState.currentFileName}
        totalFiles={batchState.totalFiles}
        currentIndex={batchState.currentIndex}
        isComplete={batchState.isComplete}
        errors={batchState.errors}
        onDismiss={dismissProgress}
      />
      <DeleteConfirmationModal
        isOpen={isConfirmOpen}
        count={selectedCount}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          if (!isDeleting) setIsConfirmOpen(false);
        }}
      />
      <NoteReaderModal
        isOpen={noteReaderModal.isOpen}
        title={noteReaderModal.title}
        notes={noteReaderModal.notes}
        onClose={() =>
          setNoteReaderModal((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </div>
  );
}
