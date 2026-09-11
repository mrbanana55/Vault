import { useState, useCallback } from 'react';
import type { UpdateAudioNoteInput } from '@shared/types';
import type { TableMode, EditableField } from '../types/inline-edit';
import { Header } from './Header';
import { TabBar } from './TabBar';
import { ModeToggle } from './ModeToggle';
import { IdeasTable } from './IdeasTable';
import { RecordingPanel } from './RecordingPanel';
import { DragDropOverlay } from './DragDropOverlay';
import { CircularProgressModal } from './CircularProgressModal';
import { useNotes } from '../hooks/useNotes';
import { useInlineEdit } from '../hooks/useInlineEdit';
import { useAudioImport } from '../hooks/useAudioImport';
import { useRowSelection } from '../hooks/useRowSelection';
import { transformFieldValue } from '../lib/field-transforms';

export function AppLayout() {
  const [activeTab, setActiveTab] = useState<0 | 1>(0);
  const [tableMode, setTableMode] = useState<TableMode>('view');

  const { notes, loading, error, refetch } = useNotes(activeTab);

  const {
    selectedIds,
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
      value: string
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
        console.error('Error updating note:', err);
        return false;
      }
    },
    [refetch]
  );

  const { activeCellId, startEdit, commitEdit, clearEdit } =
    useInlineEdit(handleSave);

  const handleModeChange = useCallback(
    (newMode: TableMode) => {
      if (newMode === 'view' && activeCellId) {
        clearEdit();
      }
      setTableMode(newMode);
    },
    [activeCellId, clearEdit]
  );

  const handleTabChange = useCallback(
    (tab: 0 | 1) => {
      clearEdit();
      setActiveTab(tab);
    },
    [clearEdit]
  );

  const handleImportComplete = useCallback(() => {
    refetch();
  }, [refetch]);

  const { isDragging, batchState, importFiles, dismissProgress } =
    useAudioImport({
      onImportComplete: handleImportComplete,
    });

  return (
    <div className="flex flex-col h-screen bg-surface-secondary text-content-primary overflow-hidden transition-colors">
      <Header onImportFiles={importFiles} />
      <main className="flex-1 flex flex-col min-h-0 px-6 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
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
    </div>
  );
}
