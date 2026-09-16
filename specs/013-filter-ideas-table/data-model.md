# Data Model & State Architecture: Filter Ideas Table

**Feature**: `013-filter-ideas-table` | **Date**: 2026-09-15

This document defines the TypeScript interfaces, data models, validation constraints, and state lifecycle transitions for the Ideas Table filtering feature.

---

## 1. Filter Criteria Entity

The core data structure representing active or draft filter constraints:

```typescript
export interface IdeaFilterCriteria {
  /** Optional minimum tempo (BPM >= bpmMin) */
  bpmMin?: number;
  /** Optional maximum tempo (BPM <= bpmMax) */
  bpmMax?: number;
  /** Optional musical key query (case-insensitive substring) */
  key?: string;
  /** Optional author/collaborator query (supports comma-separated multi-token AND matching) */
  authors?: string;
  /** Optional song section query (case-insensitive substring) */
  section?: string;
  /** Optional instrument query (supports comma-separated multi-token AND matching) */
  instruments?: string;
}

export const INITIAL_FILTER_CRITERIA: Readonly<IdeaFilterCriteria> = Object.freeze({
  bpmMin: undefined,
  bpmMax: undefined,
  key: '',
  authors: '',
  section: '',
  instruments: '',
});
```

### Parameter Tooltip Definitions

```typescript
export const FILTER_TOOLTIPS = {
  bpm: 'Tempo in beats per minute. Specify a minimum, maximum, or both to filter by range.',
  key: 'Musical key signature (e.g., C maj, A min, F#). Matches partial text.',
  authors: 'Songwriters and performers. Separate multiple authors with commas to require all of them (e.g., John, Paul).',
  section: 'Song section (e.g., Chorus, Verse, Bridge, Intro). Matches partial text.',
  instruments: 'Musical instruments tagged on the idea. Separate multiple instruments with commas to require all of them (e.g., Guitar, Piano).',
} as const;
```

---

## 2. Multi-Token Comma Tokenizer

```typescript
export function parseFilterTokens(query?: string): string[] {
  if (!query) return [];
  return query
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}
```

---

## 3. Active Filter Evaluation Utility

Helper function determining if any filter criterion is currently set:

```typescript
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
```

---

## 4. Filter Matching Engine (with Multi-Token AND Logic)

```typescript
import type { NoteWithInstruments } from '../hooks/useNotes';

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

export function filterIdeas(
  notes: NoteWithInstruments[],
  criteria: IdeaFilterCriteria
): NoteWithInstruments[] {
  if (!hasActiveFilters(criteria)) {
    return notes;
  }
  return notes.filter((note) => matchesFilterCriteria(note, criteria));
}
```

---

## 5. UI State Transitions & Lifecycle

```text
       ┌──────────────────────────────┐
       │   Table View: Unfiltered     │
       │    isFiltered = false        │
       │   Clear button = HIDDEN      │
       └──────────────┬───────────────┘
                      │ Click Filter Button
                      ▼
       ┌──────────────────────────────┐
       │     FilterModal Opened       │
       │  draftCriteria = applied     │
       │  Tooltips displayed on hover │
       └──────┬───────────────┬───────┘
              │               │ Click Close / Esc / Backdrop
              │               │ (Discard Draft)
              │ Click Apply   ▼
              │        ┌──────────────────────────────┐
              │        │   Table View: Unfiltered     │
              │        └──────────────────────────────┘
              ▼
       ┌──────────────────────────────┐
       │    Table View: Filtered      │
       │     isFiltered = true        │
       │    Clear button = VISIBLE    │
       │   FilterButton = HIGHLIGHTED │
       └──────────────┬───────────────┘
                      │ Click Clear 'X' Button
                      ▼
       ┌──────────────────────────────┐
       │   Table View: Unfiltered     │
       │    isFiltered = false        │
       │   Clear button = HIDDEN      │
       └──────────────────────────────┘
```
