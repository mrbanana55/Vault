import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AudioTimeBar } from '../AudioTimeBar';
import type { NoteWithInstruments } from '../../hooks/useNotes';

const mockSeek = vi.fn();
let mockAudioPlayerState = {
  currentNote: null as NoteWithInstruments | null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  play: vi.fn(),
  pause: vi.fn(),
  togglePlay: vi.fn(),
  seek: mockSeek,
  error: null,
};

vi.mock('../../hooks/useAudioPlayer', () => ({
  useAudioPlayer: () => mockAudioPlayerState,
}));

describe('AudioTimeBar', () => {
  const sampleNote: NoteWithInstruments = {
    id: 1,
    title: 'Guitar Riff',
    file_path: 'recordings/riff.wav',
    duration_seconds: 90,
    bpm: 120,
    musical_key: 'A minor',
    authors: 'Artist',
    song_section: 'Chorus',
    notes: '',
    is_used: 0,
    created_at: '2026-09-08T12:00:00.000Z',
    updated_at: '2026-09-08T12:00:00.000Z',
    instruments: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAudioPlayerState = {
      currentNote: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      play: vi.fn(),
      pause: vi.fn(),
      togglePlay: vi.fn(),
      seek: mockSeek,
      error: null,
    };
  });

  it('renders disabled scrubber and 0:00 / 0:00 when idle', () => {
    render(<AudioTimeBar />);

    const scrubber = screen.getByTestId('audio-scrubber') as HTMLInputElement;
    expect(scrubber).toBeDisabled();

    const timeDisplay = screen.getByTestId('audio-time-display');
    expect(timeDisplay.textContent).toContain('0:00');
  });

  it('renders active scrubber and formatted timestamps when playing an idea', () => {
    mockAudioPlayerState.currentNote = sampleNote;
    mockAudioPlayerState.currentTime = 34;
    mockAudioPlayerState.duration = 90;
    mockAudioPlayerState.isPlaying = true;

    render(<AudioTimeBar />);

    const scrubber = screen.getByTestId('audio-scrubber') as HTMLInputElement;
    expect(scrubber).not.toBeDisabled();
    expect(scrubber.max).toBe('90');

    const timeDisplay = screen.getByTestId('audio-time-display');
    expect(timeDisplay.textContent).toBe('0:34 / 1:30');
  });

  it('calls seek when user scrubs the time bar', () => {
    mockAudioPlayerState.currentNote = sampleNote;
    mockAudioPlayerState.currentTime = 10;
    mockAudioPlayerState.duration = 90;

    render(<AudioTimeBar />);

    const scrubber = screen.getByTestId('audio-scrubber');
    fireEvent.change(scrubber, { target: { value: '45' } });

    expect(mockSeek).toHaveBeenCalledWith(45);
  });
});
