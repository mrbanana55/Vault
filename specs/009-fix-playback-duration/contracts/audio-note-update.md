# Contract: Audio Note Update Schema & Duration Resolution

**Scope**: Shared types and SQLite Repository
**Date**: 2026-09-08

---

## 1. Updated Interface Contract

Located in `src/shared/types/audio-note.ts`:

```typescript
export interface UpdateAudioNoteInput {
  id: number;
  duration_seconds?: number;
  title?: string;
  bpm?: number | null;
  musical_key?: string | null;
  authors?: string | null;
  song_section?: string | null;
  notes?: string | null;
  is_used?: 0 | 1;
  instrument_names?: string[];
}
```

---

## 2. Database Update Implementation

Located in `src/main/db/note-repository.ts`:

```typescript
if (input.duration_seconds !== undefined && input.duration_seconds >= 0) {
  setClauses.push('duration_seconds = :duration_seconds');
  params['duration_seconds'] = input.duration_seconds;
}
```

- When `duration_seconds` is provided in `updateNote`, it is persisted to the `audio_notes` row, updating the database record permanently.
