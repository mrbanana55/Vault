import { useState, useCallback } from 'react';
import { Header } from './Header';
import { TabBar } from './TabBar';
import { IdeasTable } from './IdeasTable';
import { RecordingPanel } from './RecordingPanel';
import { DragDropOverlay } from './DragDropOverlay';
import { CircularProgressModal } from './CircularProgressModal';
import { useAudioImport } from '../hooks/useAudioImport';

export function AppLayout() {
  const [activeTab, setActiveTab] = useState<0 | 1>(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleImportComplete = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const { isDragging, batchState, importFiles, dismissProgress } = useAudioImport({
    onImportComplete: handleImportComplete,
  });

  return (
    <div className="flex flex-col h-screen bg-surface-secondary text-content-primary overflow-hidden transition-colors">
      <Header onImportFiles={importFiles} />
      <main className="flex-1 flex flex-col min-h-0 px-6 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        <div className="flex-1 min-h-0 rounded-xl bg-surface-primary border border-border overflow-hidden shadow-xs flex flex-col">
          <div className="flex-1 overflow-auto">
            <IdeasTable key={`${activeTab}-${refreshKey}`} isUsed={activeTab} />
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
