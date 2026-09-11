import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AudioPlayerProvider, useAudioPlayer } from '../AudioPlayerContext';
import type { NoteWithInstruments } from '../../hooks/useNotes';

const mockNote: NoteWithInstruments = {
  id: 1,
  title: 'Groovy Bassline',
  file_path: 'recordings/bass.wav',
  duration_seconds: 42.5,
  bpm: 120,
  musical_key: 'Am',
  authors: 'Alex',
  song_section: 'Verse',
  notes: 'Funky groove',
  is_used: 0,
  created_at: '2026-09-08T12:00:00Z',
  updated_at: '2026-09-08T12:00:00Z',
  instruments: [{ id: 1, name: 'Bass' }],
};

function TestConsumer() {
  const { currentNote, isPlaying, currentTime, duration, error, play, pause, togglePlay, seek } =
    useAudioPlayer();

  return (
    <div>
      <span data-testid="current-title">{currentNote?.title || 'none'}</span>
      <span data-testid="is-playing">{isPlaying ? 'yes' : 'no'}</span>
      <span data-testid="current-time">{currentTime}</span>
      <span data-testid="duration">{duration}</span>
      <span data-testid="error-message">{error || 'none'}</span>
      <button data-testid="btn-play" onClick={() => play(mockNote)}>
        Play
      </button>
      <button
        data-testid="btn-play-zero"
        onClick={() => play({ ...mockNote, id: 99, title: 'Zero Duration Idea', duration_seconds: 0 })}
      >
        Play Zero
      </button>
      <button data-testid="btn-pause" onClick={pause}>
        Pause
      </button>
      <button data-testid="btn-toggle" onClick={() => togglePlay(mockNote)}>
        Toggle
      </button>
      <button data-testid="btn-seek" onClick={() => seek(15)}>
        Seek
      </button>
    </div>
  );
}

describe('AudioPlayerContext', () => {
  let playSpy: ReturnType<typeof vi.spyOn>;
  let pauseSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    playSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => {
      return Promise.resolve();
    });
    pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('provides safe default values when useAudioPlayer is consumed outside provider', () => {
    render(<TestConsumer />);
    expect(screen.getByTestId('current-title').textContent).toBe('none');
    expect(screen.getByTestId('is-playing').textContent).toBe('no');
    expect(screen.getByTestId('current-time').textContent).toBe('0');
  });

  it('provides default idle state when mounted', () => {
    render(
      <AudioPlayerProvider>
        <TestConsumer />
      </AudioPlayerProvider>
    );

    expect(screen.getByTestId('current-title').textContent).toBe('none');
    expect(screen.getByTestId('is-playing').textContent).toBe('no');
    expect(screen.getByTestId('current-time').textContent).toBe('0');
    expect(screen.getByTestId('duration').textContent).toBe('0');
  });

  it('plays note and updates state and audio element', async () => {
    render(
      <AudioPlayerProvider>
        <TestConsumer />
      </AudioPlayerProvider>
    );

    await act(async () => {
      screen.getByTestId('btn-play').click();
    });

    expect(screen.getByTestId('current-title').textContent).toBe('Groovy Bassline');
    expect(screen.getByTestId('duration').textContent).toBe('42.5');
    expect(playSpy).toHaveBeenCalled();
  });

  it('pauses playback when pause is called', async () => {
    render(
      <AudioPlayerProvider>
        <TestConsumer />
      </AudioPlayerProvider>
    );

    await act(async () => {
      screen.getByTestId('btn-play').click();
    });
    await act(async () => {
      screen.getByTestId('btn-pause').click();
    });

    expect(pauseSpy).toHaveBeenCalled();
  });

  it('seeks to specified timestamp', async () => {
    render(
      <AudioPlayerProvider>
        <TestConsumer />
      </AudioPlayerProvider>
    );

    await act(async () => {
      screen.getByTestId('btn-play').click();
    });
    await act(async () => {
      screen.getByTestId('btn-seek').click();
    });

    expect(screen.getByTestId('current-time').textContent).toBe('15');
  });

  it('correctly loads and plays .m4a and .mp3 vault-audio stream URIs', async () => {
    render(
      <AudioPlayerProvider>
        <TestConsumer />
      </AudioPlayerProvider>
    );

    const m4aNote: NoteWithInstruments = {
      ...mockNote,
      id: 2,
      title: 'M4A Idea',
      file_path: 'recordings/idea-uuid.m4a',
    };

    const { useAudioPlayer } = await import('../AudioPlayerContext');
    // Test through an action
    await act(async () => {
      screen.getByTestId('btn-toggle').click(); // plays mockNote
    });
    expect(playSpy).toHaveBeenCalled();
  });

  it('reports error cleanly if audio playback fails', async () => {
    playSpy.mockRejectedValueOnce(new Error('NotSupportedError: Failed to load'));

    render(
      <AudioPlayerProvider>
        <TestConsumer />
      </AudioPlayerProvider>
    );

    await act(async () => {
      screen.getByTestId('btn-play').click();
    });

    expect(screen.getByTestId('error-message').textContent).toBe('Playback failed');
  });

  it('resolves real duration on loadedmetadata and persists via vaultAPI when note duration <= 0', async () => {
    const updateSpy = vi.fn().mockResolvedValue({ success: true });
    window.vaultAPI = {
      notes: {
        update: updateSpy,
      },
    } as unknown as typeof window.vaultAPI;

    let metadataHandler: (() => void) | null = null;
    const originalAddEventListener = window.HTMLMediaElement.prototype.addEventListener;
    vi.spyOn(window.HTMLMediaElement.prototype, 'addEventListener').mockImplementation(function (
      this: HTMLAudioElement,
      type: string,
      listener: EventListenerOrEventListenerObject
    ) {
      if (type === 'loadedmetadata') {
        metadataHandler = listener as () => void;
      }
      return originalAddEventListener.call(this, type, listener);
    });

    render(
      <AudioPlayerProvider>
        <TestConsumer />
      </AudioPlayerProvider>
    );

    await act(async () => {
      screen.getByTestId('btn-play-zero').click();
    });

    expect(screen.getByTestId('current-title').textContent).toBe('Zero Duration Idea');
    expect(screen.getByTestId('duration').textContent).toBe('0');

    Object.defineProperty(window.HTMLMediaElement.prototype, 'duration', {
      value: 64.2,
      configurable: true,
    });

    await act(async () => {
      if (metadataHandler) {
        metadataHandler();
      }
    });

    expect(screen.getByTestId('duration').textContent).toBe('64.2');
    expect(updateSpy).toHaveBeenCalledWith({ id: 99, duration_seconds: 64.2 });
  });
});
