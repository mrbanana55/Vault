import { describe, it, expect } from 'vitest';
import {
  parseFilterTokens,
  hasActiveFilters,
  matchesFilterCriteria,
  filterIdeas,
} from '../filter-ideas';
import type { NoteWithInstruments } from '../../hooks/useNotes';
import type { IdeaFilterCriteria } from '../../types/filters';
import { INITIAL_FILTER_CRITERIA } from '../../types/filters';

describe('filter-ideas', () => {
  const mockNotes: NoteWithInstruments[] = [
    {
      id: 1,
      title: 'Acoustic Jam',
      file_path: 'recordings/1.wav',
      duration_seconds: 120,
      bpm: 110,
      musical_key: 'C maj',
      authors: 'John Lennon, Paul McCartney',
      song_section: 'Verse',
      notes: 'Initial take',
      is_used: 0,
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-01T10:00:00Z',
      instruments: [
        { id: 101, name: 'Acoustic Guitar' },
        { id: 102, name: 'Vocals' },
      ],
    },
    {
      id: 2,
      title: 'Rock Riff',
      file_path: 'recordings/2.wav',
      duration_seconds: 90,
      bpm: 140,
      musical_key: 'A min',
      authors: 'George Harrison',
      song_section: 'Chorus',
      notes: 'Heavy distortion',
      is_used: 0,
      created_at: '2026-09-02T11:00:00Z',
      updated_at: '2026-09-02T11:00:00Z',
      instruments: [
        { id: 103, name: 'Electric Guitar' },
        { id: 104, name: 'Drums' },
      ],
    },
    {
      id: 3,
      title: 'Piano Ballad',
      file_path: 'recordings/3.wav',
      duration_seconds: 180,
      bpm: 85,
      musical_key: 'F# minor',
      authors: 'Paul McCartney, Ringo Starr',
      song_section: 'Bridge',
      notes: null,
      is_used: 0,
      created_at: '2026-09-03T12:00:00Z',
      updated_at: '2026-09-03T12:00:00Z',
      instruments: [
        { id: 105, name: 'Grand Piano' },
        { id: 101, name: 'Acoustic Guitar' },
      ],
    },
    {
      id: 4,
      title: 'Synth Beat',
      file_path: 'recordings/4.wav',
      duration_seconds: 60,
      bpm: null,
      musical_key: null,
      authors: null,
      song_section: null,
      notes: null,
      is_used: 0,
      created_at: '2026-09-04T13:00:00Z',
      updated_at: '2026-09-04T13:00:00Z',
      instruments: [],
    },
  ];

  describe('parseFilterTokens', () => {
    it('returns empty array for undefined or empty string', () => {
      expect(parseFilterTokens(undefined)).toEqual([]);
      expect(parseFilterTokens('')).toEqual([]);
      expect(parseFilterTokens('   ')).toEqual([]);
    });

    it('parses single token with trim and lowercase', () => {
      expect(parseFilterTokens('  John  ')).toEqual(['john']);
    });

    it('parses comma-separated tokens with trim and lowercase', () => {
      expect(parseFilterTokens('John, Paul, George')).toEqual(['john', 'paul', 'george']);
    });

    it('ignores empty tokens and trailing commas', () => {
      expect(parseFilterTokens('Guitar, , Piano, ')).toEqual(['guitar', 'piano']);
    });
  });

  describe('hasActiveFilters', () => {
    it('returns false for initial empty criteria', () => {
      expect(hasActiveFilters(INITIAL_FILTER_CRITERIA)).toBe(false);
    });

    it('returns false for whitespace-only strings', () => {
      expect(
        hasActiveFilters({
          key: '   ',
          authors: '  ',
          section: ' ',
          instruments: ' ',
        })
      ).toBe(false);
    });

    it('returns true when any filter field is active', () => {
      expect(hasActiveFilters({ bpmMin: 100 })).toBe(true);
      expect(hasActiveFilters({ bpmMax: 120 })).toBe(true);
      expect(hasActiveFilters({ key: 'C' })).toBe(true);
      expect(hasActiveFilters({ authors: 'John' })).toBe(true);
      expect(hasActiveFilters({ section: 'Verse' })).toBe(true);
      expect(hasActiveFilters({ instruments: 'Guitar' })).toBe(true);
    });
  });

  describe('matchesFilterCriteria', () => {
    it('matches note when all criteria are empty', () => {
      expect(matchesFilterCriteria(mockNotes[0], INITIAL_FILTER_CRITERIA)).toBe(true);
    });

    it('filters by BPM minimum bound', () => {
      expect(matchesFilterCriteria(mockNotes[0], { bpmMin: 100 })).toBe(true);
      expect(matchesFilterCriteria(mockNotes[0], { bpmMin: 120 })).toBe(false);
      // Note 4 has null BPM
      expect(matchesFilterCriteria(mockNotes[3], { bpmMin: 80 })).toBe(false);
    });

    it('filters by BPM maximum bound', () => {
      expect(matchesFilterCriteria(mockNotes[0], { bpmMax: 120 })).toBe(true);
      expect(matchesFilterCriteria(mockNotes[0], { bpmMax: 100 })).toBe(false);
      expect(matchesFilterCriteria(mockNotes[3], { bpmMax: 200 })).toBe(false);
    });

    it('filters by BPM range', () => {
      expect(matchesFilterCriteria(mockNotes[0], { bpmMin: 100, bpmMax: 120 })).toBe(true);
      expect(matchesFilterCriteria(mockNotes[1], { bpmMin: 100, bpmMax: 120 })).toBe(false);
    });

    it('returns false for inverted BPM range', () => {
      expect(matchesFilterCriteria(mockNotes[0], { bpmMin: 140, bpmMax: 100 })).toBe(false);
    });

    it('filters by musical key (case-insensitive substring)', () => {
      expect(matchesFilterCriteria(mockNotes[0], { key: 'c maj' })).toBe(true);
      expect(matchesFilterCriteria(mockNotes[0], { key: 'C' })).toBe(true);
      expect(matchesFilterCriteria(mockNotes[0], { key: 'd' })).toBe(false);
      expect(matchesFilterCriteria(mockNotes[3], { key: 'C' })).toBe(false);
    });

    it('filters by song section (case-insensitive substring)', () => {
      expect(matchesFilterCriteria(mockNotes[0], { section: 'verse' })).toBe(true);
      expect(matchesFilterCriteria(mockNotes[0], { section: 'VER' })).toBe(true);
      expect(matchesFilterCriteria(mockNotes[0], { section: 'Chorus' })).toBe(false);
    });

    describe('multi-author matching with AND logic', () => {
      it('matches single author query case-insensitively', () => {
        expect(matchesFilterCriteria(mockNotes[0], { authors: 'john' })).toBe(true);
        expect(matchesFilterCriteria(mockNotes[0], { authors: 'JOHN' })).toBe(true);
        expect(matchesFilterCriteria(mockNotes[0], { authors: 'mccartney' })).toBe(true);
      });

      it('matches comma-separated authors when all are present (order-independent)', () => {
        expect(matchesFilterCriteria(mockNotes[0], { authors: 'John, Paul' })).toBe(true);
        expect(matchesFilterCriteria(mockNotes[0], { authors: 'Paul, John' })).toBe(true);
      });

      it('fails when one requested author is missing', () => {
        expect(matchesFilterCriteria(mockNotes[0], { authors: 'John, George' })).toBe(false);
      });

      it('fails when note has no authors', () => {
        expect(matchesFilterCriteria(mockNotes[3], { authors: 'John' })).toBe(false);
      });
    });

    describe('multi-instrument matching with AND logic', () => {
      it('matches single instrument query case-insensitively', () => {
        expect(matchesFilterCriteria(mockNotes[0], { instruments: 'guitar' })).toBe(true);
        expect(matchesFilterCriteria(mockNotes[0], { instruments: 'VOCALS' })).toBe(true);
        expect(matchesFilterCriteria(mockNotes[0], { instruments: 'piano' })).toBe(false);
      });

      it('matches comma-separated instruments when all are present (order-independent)', () => {
        expect(matchesFilterCriteria(mockNotes[0], { instruments: 'Guitar, Vocals' })).toBe(true);
        expect(matchesFilterCriteria(mockNotes[0], { instruments: 'Vocals, Guitar' })).toBe(true);
        expect(matchesFilterCriteria(mockNotes[2], { instruments: 'Piano, Guitar' })).toBe(true);
      });

      it('fails when one requested instrument is missing', () => {
        expect(matchesFilterCriteria(mockNotes[0], { instruments: 'Guitar, Drums' })).toBe(false);
      });

      it('fails when note has no instruments', () => {
        expect(matchesFilterCriteria(mockNotes[3], { instruments: 'Guitar' })).toBe(false);
      });
    });

    it('matches when multiple criteria are combined (BPM + Key + Authors + Instruments)', () => {
      const criteria: IdeaFilterCriteria = {
        bpmMin: 100,
        bpmMax: 120,
        key: 'C',
        authors: 'John, Paul',
        instruments: 'Guitar',
      };
      expect(matchesFilterCriteria(mockNotes[0], criteria)).toBe(true);
      expect(matchesFilterCriteria(mockNotes[1], criteria)).toBe(false);
      expect(matchesFilterCriteria(mockNotes[2], criteria)).toBe(false);
    });
  });

  describe('filterIdeas', () => {
    it('returns the same notes array reference when no filters are active', () => {
      const result = filterIdeas(mockNotes, INITIAL_FILTER_CRITERIA);
      expect(result).toBe(mockNotes);
      expect(result.length).toBe(4);
    });

    it('filters down to matching subset', () => {
      const result = filterIdeas(mockNotes, { authors: 'Paul' });
      expect(result.map((n) => n.id)).toEqual([1, 3]);
    });

    it('returns empty array when no ideas match', () => {
      const result = filterIdeas(mockNotes, { bpmMin: 200 });
      expect(result).toEqual([]);
    });
  });
});
