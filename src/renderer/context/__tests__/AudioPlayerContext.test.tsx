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
  const { currentNote, isPlaying, currentTime, duration, play, pause, togglePlay, seek } =
    useAudioPlayer();

  return (
    <div>
      <span data-testid="current-title">{currentNote?.title || 'none'}</span>
      <span data-testid="is-playing">{isPlaying ? 'yes' : 'no'}</span>
      <span data-testid="current-time">{currentTime}</span>
      <span data-testid="duration">{duration}</span>
      <button data-testid="btn-play" onClick={() => play(mockNote)}>
        Play
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
});
