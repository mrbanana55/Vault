import type { NoteWithInstruments } from '../hooks/useNotes';
import type { IdeaFilterCriteria } from '../types/filters';

/**
 * Parses a comma-separated filter string into normalized, trimmed, lowercase tokens.
 * Discards empty or whitespace-only tokens.
 */
export function parseFilterTokens(query?: string): string[] {
  if (!query) return [];
  return query
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Returns true if at least one filter criterion is active (non-empty).
 */
export function hasActiveFilters(criteria: IdeaFilterCriteria): boolean {
  return (
    criteria.bpmMin !== undefined ||
    criteria.bpmMax !== undefined ||
    Boolean(criteria.key?.trim()) ||
    Boolean(criteria.authors?.trim()) ||
    Boolean(criteria.section?.trim()) ||
    Boolean(criteria.instruments?.trim())
  );
}

/**
 * Evaluates whether an individual audio note satisfies all active filter criteria.
 * Supports BPM range bounds, case-insensitive partial text matching,
 * and comma-separated multi-token AND matching for Authors and Instruments.
 */
export function matchesFilterCriteria(
  note: NoteWithInstruments,
  criteria: IdeaFilterCriteria
): boolean {
  // 1. BPM minimum bound
  if (criteria.bpmMin !== undefined) {
    if (note.bpm === null || note.bpm === undefined || note.bpm < criteria.bpmMin) {
      return false;
    }
  }

  // 2. BPM maximum bound
  if (criteria.bpmMax !== undefined) {
    if (note.bpm === null || note.bpm === undefined || note.bpm > criteria.bpmMax) {
      return false;
    }
  }

  // 3. Musical Key (case-insensitive substring)
  if (criteria.key && criteria.key.trim() !== '') {
    const q = criteria.key.trim().toLowerCase();
    if (!note.musical_key || !note.musical_key.toLowerCase().includes(q)) {
      return false;
    }
  }

  // 4. Authors (comma-separated multi-token AND matching, order-independent)
  const authorTokens = parseFilterTokens(criteria.authors);
  if (authorTokens.length > 0) {
    const authorsText = note.authors?.toLowerCase() ?? '';
    const matchesAll = authorTokens.every((token) => authorsText.includes(token));
    if (!matchesAll) {
      return false;
    }
  }

  // 5. Song Section (case-insensitive substring)
  if (criteria.section && criteria.section.trim() !== '') {
    const q = criteria.section.trim().toLowerCase();
    if (!note.song_section || !note.song_section.toLowerCase().includes(q)) {
      return false;
    }
  }

  // 6. Instruments (comma-separated multi-token AND matching, order-independent)
  const instrumentTokens = parseFilterTokens(criteria.instruments);
  if (instrumentTokens.length > 0) {
    const matchesAll = instrumentTokens.every((token) =>
      note.instruments.some((inst) => inst.name.toLowerCase().includes(token))
    );
    if (!matchesAll) {
      return false;
    }
  }

  return true;
}

/**
 * Filters a collection of notes using active criteria.
 * Returns the original array reference if no filters are active.
 */
export function filterIdeas(
  notes: NoteWithInstruments[],
  criteria: IdeaFilterCriteria
): NoteWithInstruments[] {
  if (!hasActiveFilters(criteria)) {
    return notes;
  }
  return notes.filter((note) => matchesFilterCriteria(note, criteria));
}
