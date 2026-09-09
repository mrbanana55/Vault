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

  it('updates display time and seeks when dragging circle via pointer events', () => {
    mockAudioPlayerState.currentNote = sampleNote;
    mockAudioPlayerState.currentTime = 10;
    mockAudioPlayerState.duration = 90;

    render(<AudioTimeBar />);

    const scrubber = screen.getByTestId('audio-scrubber') as HTMLInputElement;
    const timeDisplay = screen.getByTestId('audio-time-display');

    // Start dragging the circle
    fireEvent.pointerDown(scrubber, { pointerId: 1 });

    // Drag to 60s
    fireEvent.change(scrubber, { target: { value: '60' } });
    expect(timeDisplay.textContent).toBe('1:00 / 1:30');
    expect(mockSeek).not.toHaveBeenCalled();

    // Release pointer
    fireEvent.pointerUp(scrubber, { pointerId: 1 });
    expect(mockSeek).toHaveBeenCalledWith(60);
  });

  it('handles mouse drag and release outside element on window', () => {
    mockAudioPlayerState.currentNote = sampleNote;
    mockAudioPlayerState.currentTime = 10;
    mockAudioPlayerState.duration = 90;

    render(<AudioTimeBar />);

    const scrubber = screen.getByTestId('audio-scrubber') as HTMLInputElement;
    const timeDisplay = screen.getByTestId('audio-time-display');

    // Start drag with mousedown
    fireEvent.mouseDown(scrubber);

    // Drag circle to 75s
    fireEvent.change(scrubber, { target: { value: '75' } });
    expect(timeDisplay.textContent).toBe('1:15 / 1:30');
    expect(mockSeek).not.toHaveBeenCalled();

    // Release mouse outside the element on window
    fireEvent.mouseUp(window);
    expect(mockSeek).toHaveBeenCalledWith(75);
  });

  it('handles touch drag and touch end', () => {
    mockAudioPlayerState.currentNote = sampleNote;
    mockAudioPlayerState.currentTime = 10;
    mockAudioPlayerState.duration = 90;

    render(<AudioTimeBar />);

    const scrubber = screen.getByTestId('audio-scrubber') as HTMLInputElement;

    // Start touch drag
    fireEvent.touchStart(scrubber);

    // Drag circle to 25s
    fireEvent.change(scrubber, { target: { value: '25' } });
    expect(mockSeek).not.toHaveBeenCalled();

    // Touch end on window
    fireEvent.touchEnd(window);
    expect(mockSeek).toHaveBeenCalledWith(25);
  });

  it('handles pointer cancel cleanly without getting stuck in drag state', () => {
    mockAudioPlayerState.currentNote = sampleNote;
    mockAudioPlayerState.currentTime = 10;
    mockAudioPlayerState.duration = 90;

    render(<AudioTimeBar />);

    const scrubber = screen.getByTestId('audio-scrubber') as HTMLInputElement;

    // Start drag
    fireEvent.pointerDown(scrubber, { pointerId: 1 });

    // Cancel pointer
    fireEvent.pointerCancel(scrubber, { pointerId: 1 });

    // Scrub again via change without drag
    fireEvent.change(scrubber, { target: { value: '50' } });
    expect(mockSeek).toHaveBeenCalledWith(50);
  });
});

