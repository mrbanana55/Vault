import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNotes } from '../useNotes';
import * as audioMetadata from '../../lib/audio-metadata';
import type { AudioNote } from '@shared/types';

describe('useNotes hook', () => {
  const mockNoteWithZeroDuration: AudioNote = {
    id: 10,
    title: 'Zero Duration Note',
    file_path: 'recordings/zero.m4a',
    duration_seconds: 0,
    bpm: null,
    musical_key: null,
    authors: null,
    song_section: null,
    notes: null,
    is_used: 0,
    created_at: '2026-09-08T10:00:00Z',
    updated_at: '2026-09-08T10:00:00Z',
  };

  const mockNoteWithValidDuration: AudioNote = {
    id: 11,
    title: 'Valid Duration Note',
    file_path: 'recordings/valid.wav',
    duration_seconds: 45.2,
    bpm: null,
    musical_key: null,
    authors: null,
    song_section: null,
    notes: null,
    is_used: 0,
    created_at: '2026-09-08T11:00:00Z',
    updated_at: '2026-09-08T11:00:00Z',
  };

  let updateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    updateSpy = vi.fn().mockResolvedValue({ success: true });

    // @ts-expect-error Mock window.vaultAPI
    window.vaultAPI = {
      notes: {
        getAll: vi.fn().mockResolvedValue({
          success: true,
          data: [mockNoteWithZeroDuration, mockNoteWithValidDuration],
        }),
        getById: vi.fn().mockImplementation((id: number) =>
          Promise.resolve({
            success: true,
            data: {
              ...(id === 10 ? mockNoteWithZeroDuration : mockNoteWithValidDuration),
              instruments: [],
            },
          })
        ),
        update: updateSpy,
      },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads notes and backfills duration for notes with duration_seconds <= 0', async () => {
    const resolveSpy = vi
      .spyOn(audioMetadata, 'resolveAudioUrlDuration')
      .mockResolvedValue(78.5);

    const { result } = renderHook(() => useNotes(0));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Check initial loaded count
    expect(result.current.notes).toHaveLength(2);

    // Wait for retroactive resolution
    await waitFor(() => {
      const resolved = result.current.notes.find((n) => n.id === 10);
      expect(resolved?.duration_seconds).toBe(78.5);
    });

    expect(resolveSpy).toHaveBeenCalledWith('vault-audio://stream/recordings/zero.m4a');
    expect(updateSpy).toHaveBeenCalledWith({
      id: 10,
      duration_seconds: 78.5,
    });
  });

  it('does not call update if resolved duration is 0', async () => {
    vi.spyOn(audioMetadata, 'resolveAudioUrlDuration').mockResolvedValue(0);

    const { result } = renderHook(() => useNotes(0));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(updateSpy).not.toHaveBeenCalled();
    const note = result.current.notes.find((n) => n.id === 10);
    expect(note?.duration_seconds).toBe(0);
  });
});
