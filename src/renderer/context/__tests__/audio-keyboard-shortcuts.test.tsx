import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AudioPlayerProvider, useAudioPlayer } from '../AudioPlayerContext';
import type { NoteWithInstruments } from '../../hooks/useNotes';

const mockNote: NoteWithInstruments = {
  id: 1,
  title: 'Synth Lead',
  file_path: 'recordings/lead.wav',
  duration_seconds: 30,
  bpm: 128,
  musical_key: 'F minor',
  authors: 'Producer',
  song_section: 'Drop',
  notes: 'Lead hook',
  is_used: 0,
  created_at: '2026-09-08T12:00:00Z',
  updated_at: '2026-09-08T12:00:00Z',
  instruments: [],
};

function ShortcutTester() {
  const { isPlaying, play } = useAudioPlayer();

  return (
    <div>
      <button data-testid="load-btn" onClick={() => play(mockNote)}>
        Load
      </button>
      <span data-testid="status">{isPlaying ? 'playing' : 'paused'}</span>
      <input data-testid="text-input" type="text" placeholder="Type here" />
      <textarea data-testid="text-area" placeholder="Notes here" />
      <div data-testid="content-editable" contentEditable={true}>
        Editable div
      </div>
    </div>
  );
}

describe('Audio Keyboard Shortcuts', () => {
  beforeEach(() => {
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => {
      return Promise.resolve();
    });
    vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('toggles playback when Space bar is pressed outside input fields', async () => {
    render(
      <AudioPlayerProvider>
        <ShortcutTester />
      </AudioPlayerProvider>
    );

    // First load the note
    await act(async () => {
      screen.getByTestId('load-btn').click();
    });

    // Space should pause
    const spaceEvent = new KeyboardEvent('keydown', {
      key: ' ',
      code: 'Space',
      bubbles: true,
      cancelable: true,
    });
    const defaultPrevented = !window.dispatchEvent(spaceEvent);

    expect(defaultPrevented).toBe(true);
  });

  it('does NOT intercept Space bar when typing in an input element', () => {
    render(
      <AudioPlayerProvider>
        <ShortcutTester />
      </AudioPlayerProvider>
    );

    const input = screen.getByTestId('text-input');
    input.focus();

    const event = new KeyboardEvent('keydown', {
      key: ' ',
      code: 'Space',
      bubbles: true,
      cancelable: true,
    });
    const notPrevented = input.dispatchEvent(event);

    expect(notPrevented).toBe(true);
  });

  it('does NOT intercept Space bar when typing in a textarea element', () => {
    render(
      <AudioPlayerProvider>
        <ShortcutTester />
      </AudioPlayerProvider>
    );

    const textarea = screen.getByTestId('text-area');
    textarea.focus();

    const event = new KeyboardEvent('keydown', {
      key: ' ',
      code: 'Space',
      bubbles: true,
      cancelable: true,
    });
    const notPrevented = textarea.dispatchEvent(event);

    expect(notPrevented).toBe(true);
  });

  it('does NOT intercept Space bar when editing inside a contenteditable element', () => {
    render(
      <AudioPlayerProvider>
        <ShortcutTester />
      </AudioPlayerProvider>
    );

    const editable = screen.getByTestId('content-editable');
    editable.focus();

    const event = new KeyboardEvent('keydown', {
      key: ' ',
      code: 'Space',
      bubbles: true,
      cancelable: true,
    });
    const notPrevented = editable.dispatchEvent(event);

    expect(notPrevented).toBe(true);
  });
});
