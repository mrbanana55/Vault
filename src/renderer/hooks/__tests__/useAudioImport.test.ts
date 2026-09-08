import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioImport } from '../useAudioImport';
import * as audioMetadata from '../../lib/audio-metadata';

describe('useAudioImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    window.vaultAPI = {
      notes: {
        create: vi.fn(),
        getAll: vi.fn(),
        getById: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      instruments: {
        getAll: vi.fn(),
      },
      saveAudioFile: vi.fn(),
      getPathForFile: vi.fn((file: File) => `/Users/music/${file.name}`),
      importAudioFile: vi.fn().mockResolvedValue({
        success: true,
        data: { id: 1, title: 'Test Note', is_used: 0 },
      }),
      openFileDialog: vi.fn().mockResolvedValue({
        success: true,
        data: ['/Users/music/memo.wav'],
      }),
    };

    vi.spyOn(audioMetadata, 'extractAudioDuration').mockResolvedValue(15.5);
  });

  it('initializes with default idle state', () => {
    const { result } = renderHook(() => useAudioImport());
    expect(result.current.isDragging).toBe(false);
    expect(result.current.batchState.isActive).toBe(false);
    expect(result.current.batchState.overallPercentage).toBe(0);
  });

  it('imports valid audio files and calls onImportComplete', async () => {
    const onImportComplete = vi.fn();
    const { result } = renderHook(() => useAudioImport({ onImportComplete }));

    const mockFile = new File(['wav-data'], 'awesome-riff.wav', { type: 'audio/wav' });

    await act(async () => {
      await result.current.importFiles([mockFile]);
    });

    expect(window.vaultAPI.getPathForFile).toHaveBeenCalledWith(mockFile);
    expect(audioMetadata.extractAudioDuration).toHaveBeenCalledWith(mockFile);
    expect(window.vaultAPI.importAudioFile).toHaveBeenCalledWith({
      source_path: '/Users/music/awesome-riff.wav',
      duration_seconds: 15.5,
      title: 'awesome-riff',
    });
    expect(onImportComplete).toHaveBeenCalled();
    expect(result.current.batchState.isComplete).toBe(true);
    expect(result.current.batchState.overallPercentage).toBe(100);
  });

  it('rejects unsupported files with an error in batchState', async () => {
    const { result } = renderHook(() => useAudioImport());

    const textFile = new File(['text'], 'notes.txt', { type: 'text/plain' });

    await act(async () => {
      await result.current.importFiles([textFile]);
    });

    expect(window.vaultAPI.importAudioFile).not.toHaveBeenCalled();
    expect(result.current.batchState.errors.length).toBe(1);
    expect(result.current.batchState.errors[0].filename).toBe('notes.txt');
  });

  it('handles window drag events correctly', () => {
    const { result } = renderHook(() => useAudioImport());

    act(() => {
      const dragEvent = new Event('dragenter') as DragEvent;
      window.dispatchEvent(dragEvent);
    });

    expect(result.current.isDragging).toBe(true);

    act(() => {
      const leaveEvent = new Event('dragleave') as DragEvent;
      window.dispatchEvent(leaveEvent);
    });

    expect(result.current.isDragging).toBe(false);
  });

  it('falls back to saveAudioFile and notes.create when getPathForFile returns empty', async () => {
    (window.vaultAPI.getPathForFile as ReturnType<typeof vi.fn>).mockReturnValue('');
    (window.vaultAPI.saveAudioFile as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: { relativePath: 'recordings/fallback.wav', format: 'wav' },
    });
    (window.vaultAPI.notes.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: { id: 99, title: 'fallback-track' },
    });

    const onImportComplete = vi.fn();
    const { result } = renderHook(() => useAudioImport({ onImportComplete }));

    const mockFile = new File(['audio-content'], 'fallback-track.wav', { type: 'audio/wav' });

    await act(async () => {
      await result.current.importFiles([mockFile]);
    });

    expect(window.vaultAPI.saveAudioFile).toHaveBeenCalled();
    expect(window.vaultAPI.notes.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'fallback-track',
        file_path: 'recordings/fallback.wav',
        duration_seconds: 15.5,
      })
    );
    expect(onImportComplete).toHaveBeenCalled();
    expect(result.current.batchState.errors.length).toBe(0);
  });

  it('reports clear error when window.vaultAPI is undefined', async () => {
    // @ts-expect-error intentionally clearing vaultAPI
    delete window.vaultAPI;

    const { result } = renderHook(() => useAudioImport());
    const mockFile = new File(['wav-data'], 'test.wav', { type: 'audio/wav' });

    await act(async () => {
      await result.current.importFiles([mockFile]);
    });

    expect(result.current.batchState.errors.length).toBe(1);
    expect(result.current.batchState.errors[0].error).toContain('Vault desktop integration (vaultAPI) is not available');
  });
});
