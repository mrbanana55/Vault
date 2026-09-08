import { useState, useEffect, useCallback, useRef } from 'react';
import { isSupportedAudioFormat, type AudioFormat } from '@shared/types';
import { extractAudioDuration } from '../lib/audio-metadata';

export interface ImportBatchState {
  isActive: boolean;
  totalFiles: number;
  currentIndex: number;
  currentFileName: string;
  overallPercentage: number;
  isComplete: boolean;
  errors: Array<{ filename: string; error: string }>;
}

export interface UseAudioImportOptions {
  onImportComplete?: () => void;
}

const initialBatchState: ImportBatchState = {
  isActive: false,
  totalFiles: 0,
  currentIndex: 0,
  currentFileName: '',
  overallPercentage: 0,
  isComplete: false,
  errors: [],
};

export function useAudioImport(options: UseAudioImportOptions = {}) {
  const { onImportComplete } = options;
  const [isDragging, setIsDragging] = useState(false);
  const [batchState, setBatchState] = useState<ImportBatchState>(initialBatchState);
  const dragCounter = useRef(0);

  const dismissProgress = useCallback(() => {
    setBatchState(initialBatchState);
  }, []);

  const importFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;

      setBatchState({
        isActive: true,
        totalFiles: files.length,
        currentIndex: 0,
        currentFileName: '',
        overallPercentage: 0,
        isComplete: false,
        errors: [],
      });

      const errors: Array<{ filename: string; error: string }> = [];
      let successCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop()?.toLowerCase() || '';

        setBatchState((prev) => ({
          ...prev,
          currentIndex: i + 1,
          currentFileName: file.name,
          overallPercentage: Math.round(((i + 0.3) / files.length) * 100),
        }));

        if (!isSupportedAudioFormat(ext)) {
          errors.push({
            filename: file.name,
            error: `Unsupported format ".${ext}". Supported formats are WAV, MP3, M4A, OGG, FLAC.`,
          });
          setBatchState((prev) => ({
            ...prev,
            overallPercentage: Math.round(((i + 1) / files.length) * 100),
          }));
          continue;
        }

        try {
          if (!window?.vaultAPI) {
            throw new Error(
              'Vault desktop integration (vaultAPI) is not available. Please ensure Vault is running inside Electron ("npm start").'
            );
          }

          const durationSeconds = await extractAudioDuration(file);
          const rawTitle = file.name.replace(/\.[^/.]+$/, '').trim();
          const title = rawTitle.length > 0 ? rawTitle : undefined;

          setBatchState((prev) => ({
            ...prev,
            overallPercentage: Math.round(((i + 0.8) / files.length) * 100),
          }));

          const sourcePath =
            typeof window.vaultAPI.getPathForFile === 'function'
              ? window.vaultAPI.getPathForFile(file)
              : (file as unknown as { path?: string })?.path || '';

          if (sourcePath && typeof window.vaultAPI.importAudioFile === 'function') {
            const res = await window.vaultAPI.importAudioFile({
              source_path: sourcePath,
              title,
              duration_seconds: durationSeconds,
            });

            if (!res.success) {
              errors.push({
                filename: file.name,
                error: res.error,
              });
            } else {
              successCount++;
            }
          } else if (
            typeof window.vaultAPI.saveAudioFile === 'function' &&
            typeof window.vaultAPI.notes?.create === 'function'
          ) {
            const buffer = await file.arrayBuffer();
            const saveRes = await window.vaultAPI.saveAudioFile(buffer, ext as AudioFormat);
            if (!saveRes.success) {
              errors.push({
                filename: file.name,
                error: saveRes.error,
              });
            } else {
              const noteRes = await window.vaultAPI.notes.create({
                title,
                file_path: saveRes.data.relativePath,
                duration_seconds: durationSeconds,
              });
              if (!noteRes.success) {
                errors.push({
                  filename: file.name,
                  error: noteRes.error,
                });
              } else {
                successCount++;
              }
            }
          } else {
            throw new Error(`Unable to determine host file path for "${file.name}"`);
          }
        } catch (err: unknown) {
          errors.push({
            filename: file.name,
            error: (err as Error).message || 'Failed to import audio file',
          });
        }

        setBatchState((prev) => ({
          ...prev,
          overallPercentage: Math.round(((i + 1) / files.length) * 100),
        }));
      }

      setBatchState((prev) => ({
        ...prev,
        overallPercentage: 100,
        isComplete: true,
        errors,
      }));

      if (successCount > 0 && onImportComplete) {
        onImportComplete();
      }
    },
    [onImportComplete]
  );

  const openFileDialogAndImport = useCallback(async () => {
    try {
      if (!window?.vaultAPI?.openFileDialog) {
        console.warn('Vault desktop integration (vaultAPI) is not available.');
        return;
      }
      const res = await window.vaultAPI.openFileDialog();
      if (!res.success || !res.data || res.data.length === 0) return;

      const filePaths = res.data;
      setBatchState({
        isActive: true,
        totalFiles: filePaths.length,
        currentIndex: 0,
        currentFileName: '',
        overallPercentage: 0,
        isComplete: false,
        errors: [],
      });

      const errors: Array<{ filename: string; error: string }> = [];
      let successCount = 0;

      for (let i = 0; i < filePaths.length; i++) {
        const filePath = filePaths[i];
        const baseName = filePath.split(/[/\\]/).pop() || 'audio';
        const title = baseName.replace(/\.[^/.]+$/, '').trim() || undefined;

        setBatchState((prev) => ({
          ...prev,
          currentIndex: i + 1,
          currentFileName: baseName,
          overallPercentage: Math.round((i / filePaths.length) * 100),
        }));

        try {
          const importRes = await window.vaultAPI.importAudioFile({
            source_path: filePath,
            title,
            duration_seconds: 0, // Fallback if selected from native dialog without Web Audio
          });

          if (!importRes.success) {
            errors.push({ filename: baseName, error: importRes.error });
          } else {
            successCount++;
          }
        } catch (err: unknown) {
          errors.push({ filename: baseName, error: (err as Error).message });
        }
      }

      setBatchState((prev) => ({
        ...prev,
        overallPercentage: 100,
        isComplete: true,
        errors,
      }));

      if (successCount > 0 && onImportComplete) {
        onImportComplete();
      }
    } catch {
      // ignore
    }
  }, [onImportComplete]);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current += 1;
      if (!e.dataTransfer?.types || e.dataTransfer.types.includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setIsDragging(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        importFiles(e.dataTransfer.files);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [importFiles]);

  return {
    isDragging,
    batchState,
    importFiles,
    openFileDialogAndImport,
    dismissProgress,
  };
}
