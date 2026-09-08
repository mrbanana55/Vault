import { describe, it, expect } from 'vitest';
import {
  transformFieldValue,
  getNoteFieldDisplayValue,
} from '../field-transforms';
import type { NoteWithInstruments } from '../../hooks/useNotes';

describe('transformFieldValue', () => {
  describe('title', () => {
    it('returns valid object with trimmed title', () => {
      const res = transformFieldValue('title', '  New Title  ');
      expect(res).toEqual({ valid: true, value: { title: 'New Title' } });
    });

    it('rejects empty or whitespace-only title', () => {
      expect(transformFieldValue('title', '')).toEqual({
        valid: false,
        value: null,
      });
      expect(transformFieldValue('title', '   ')).toEqual({
        valid: false,
        value: null,
      });
    });
  });

  describe('bpm', () => {
    it('parses valid positive number', () => {
      expect(transformFieldValue('bpm', '120')).toEqual({
        valid: true,
        value: { bpm: 120 },
      });
      expect(transformFieldValue('bpm', ' 95.5 ')).toEqual({
        valid: true,
        value: { bpm: 95.5 },
      });
    });

    it('converts empty string to null', () => {
      expect(transformFieldValue('bpm', '')).toEqual({
        valid: true,
        value: { bpm: null },
      });
      expect(transformFieldValue('bpm', '   ')).toEqual({
        valid: true,
        value: { bpm: null },
      });
    });

    it('rejects zero, negative, or non-numeric values', () => {
      expect(transformFieldValue('bpm', '0')).toEqual({
        valid: false,
        value: null,
      });
      expect(transformFieldValue('bpm', '-10')).toEqual({
        valid: false,
        value: null,
      });
      expect(transformFieldValue('bpm', 'abc')).toEqual({
        valid: false,
        value: null,
      });
    });
  });

  describe('musical_key, authors, song_section, notes', () => {
    it('trims text and converts empty to null', () => {
      expect(transformFieldValue('musical_key', '  C major  ')).toEqual({
        valid: true,
        value: { musical_key: 'C major' },
      });
      expect(transformFieldValue('musical_key', '  ')).toEqual({
        valid: true,
        value: { musical_key: null },
      });

      expect(transformFieldValue('authors', 'John, Jane')).toEqual({
        valid: true,
        value: { authors: 'John, Jane' },
      });
      expect(transformFieldValue('authors', '')).toEqual({
        valid: true,
        value: { authors: null },
      });

      expect(transformFieldValue('song_section', 'Chorus')).toEqual({
        valid: true,
        value: { song_section: 'Chorus' },
      });
      expect(transformFieldValue('song_section', '')).toEqual({
        valid: true,
        value: { song_section: null },
      });

      expect(transformFieldValue('notes', 'Some notes')).toEqual({
        valid: true,
        value: { notes: 'Some notes' },
      });
      expect(transformFieldValue('notes', '')).toEqual({
        valid: true,
        value: { notes: null },
      });
    });
  });

  describe('instruments', () => {
    it('splits comma-separated values, trims each, and filters empty', () => {
      expect(
        transformFieldValue('instruments', ' Guitar,  Piano ,  Bass ')
      ).toEqual({
        valid: true,
        value: { instrument_names: ['Guitar', 'Piano', 'Bass'] },
      });
    });

    it('returns empty array for empty or commas only', () => {
      expect(transformFieldValue('instruments', '')).toEqual({
        valid: true,
        value: { instrument_names: [] },
      });
      expect(transformFieldValue('instruments', ' , , ')).toEqual({
        valid: true,
        value: { instrument_names: [] },
      });
    });
  });
});

describe('getNoteFieldDisplayValue', () => {
  const sampleNote: NoteWithInstruments = {
    id: 1,
    title: 'Acoustic Riff',
    file_path: 'recordings/test.wav',
    duration_seconds: 45,
    bpm: 128,
    musical_key: 'A minor',
    authors: 'Artist A',
    song_section: 'Verse',
    notes: 'Demo idea',
    is_used: 0,
    created_at: '2026-09-08T00:00:00Z',
    updated_at: '2026-09-08T00:00:00Z',
    instruments: [
      { id: 1, name: 'Acoustic Guitar' },
      { id: 2, name: 'Vocals' },
    ],
  };

  it('formats each field accurately', () => {
    expect(getNoteFieldDisplayValue(sampleNote, 'title')).toBe('Acoustic Riff');
    expect(getNoteFieldDisplayValue(sampleNote, 'bpm')).toBe('128');
    expect(getNoteFieldDisplayValue(sampleNote, 'musical_key')).toBe('A minor');
    expect(getNoteFieldDisplayValue(sampleNote, 'authors')).toBe('Artist A');
    expect(getNoteFieldDisplayValue(sampleNote, 'song_section')).toBe('Verse');
    expect(getNoteFieldDisplayValue(sampleNote, 'notes')).toBe('Demo idea');
    expect(getNoteFieldDisplayValue(sampleNote, 'instruments')).toBe(
      'Acoustic Guitar, Vocals'
    );
  });

  it('handles null and undefined values gracefully', () => {
    const emptyNote: NoteWithInstruments = {
      ...sampleNote,
      bpm: null,
      musical_key: null,
      authors: null,
      song_section: null,
      notes: null,
      instruments: [],
    };
    expect(getNoteFieldDisplayValue(emptyNote, 'bpm')).toBe('');
    expect(getNoteFieldDisplayValue(emptyNote, 'musical_key')).toBe('');
    expect(getNoteFieldDisplayValue(emptyNote, 'authors')).toBe('');
    expect(getNoteFieldDisplayValue(emptyNote, 'song_section')).toBe('');
    expect(getNoteFieldDisplayValue(emptyNote, 'notes')).toBe('');
    expect(getNoteFieldDisplayValue(emptyNote, 'instruments')).toBe('');
  });
});
