# Spec 001 — Data Model for Audio Notes

## Context and Objective

Vault needs a persistent local data model to store and organize musical ideas.
Each idea is an audio recording accompanied by rich metadata that helps the user
catalog, search, and filter their creative output. Without a well-defined data
model, the app cannot reliably persist, query, or relate the information that
makes Vault useful. This spec defines **what** data the system must persist, the
relationships between entities, and the behavioral rules that govern their
lifecycle.

## Users / Actors

- **Musician (primary user):** Records or imports audio ideas and attaches
  metadata to organize them.

## User Stories

- US-1: As a musician I want each audio idea to carry descriptive metadata
  (title, tempo, key, authors, section, instruments, notes) so that I can find
  it later without re-listening.
- US-2: As a musician I want the app to remember instruments I've used before so
  that I can quickly pick from a growing list instead of retyping.
- US-3: As a musician I want to mark ideas as "available" or "used" so that I
  can separate fresh material from ideas I've already incorporated into songs.
- US-4: As a musician I want to delete an idea permanently when I no longer need
  it, removing both the record and the audio file.

## Functional Requirements (EARS acceptance criteria)

### Audio Note entity

- FR-1: THE SYSTEM will persist each audio note with the following attributes:
  title, file path, duration in seconds, BPM, musical key, authors, song
  section, text notes, used/available state, creation timestamp, and last-update
  timestamp.
- FR-2: THE SYSTEM will store the audio file path as a string reference; it will
  never store the audio binary data inside the database.
- FR-3: WHEN an audio note is created without a user-supplied title, THE SYSTEM
  will assign a default title following the pattern `idea-N` where N is the
  sequential count of all ideas ever created in the app (including deleted ones)
  so that the number never repeats.
- FR-4: WHEN an audio note is created or imported, THE SYSTEM will automatically
  compute the audio duration in seconds and persist it alongside the note.
- FR-5: THE SYSTEM will treat the following attributes as optional (they may be
  absent): BPM, musical key, authors, song section, text notes, and instruments.
- FR-6: THE SYSTEM will store authors as a single free-text value; it will not
  maintain a separate catalog of authors.
- FR-7: THE SYSTEM will store musical key and song section each as a single
  free-text value with no constrained list of allowed values.
- FR-8: THE SYSTEM will default every new audio note's state to "available"
  (not used).

### Instrument catalog

- FR-9: THE SYSTEM will maintain a reusable catalog of instruments; each
  instrument has a unique name.
- FR-10: WHEN the user assigns an instrument that does not yet exist in the
  catalog, THE SYSTEM will add it automatically.
- FR-11: THE SYSTEM will allow a single audio note to be associated with zero,
  one, or many instruments from the catalog.
- FR-12: THE SYSTEM will allow a single instrument to be associated with zero,
  one, or many audio notes.

### Querying and filtering

- FR-13: THE SYSTEM will return audio notes sorted by creation date descending
  by default.
- FR-14: THE SYSTEM will support filtering audio notes by their used/available
  state.

### Deletion

- FR-15: WHEN the user deletes an audio note, THE SYSTEM will permanently remove
  the database record, all its instrument associations, and the physical audio
  file from disk.
- FR-16: IF the physical audio file cannot be found during deletion, THEN THE
  SYSTEM will still remove the database record and its associations and report
  that the file was already missing.

## Non-Functional Requirements

- NFR-1: All data must be stored locally using the project's established
  persistence technology; no network calls or cloud storage.
- NFR-2: All entity names, column identifiers, and stored values produced by the
  system must be in English.
- NFR-3: Queries that combine multiple optional filters must use parameterized
  inputs to prevent injection.

## Edge Cases

- **Duplicate default titles:** The sequential counter for `idea-N` must never
  produce a duplicate, even after deletions. It must be based on a monotonically
  increasing counter, not a count of existing rows.
- **Orphaned instruments:** When all audio notes associated with an instrument
  are deleted, the instrument remains in the catalog for future reuse.
- **Missing audio file on playback:** If the file referenced by `file_path` does
  not exist on disk, the system must surface a clear error rather than crash.
- **Empty optional fields:** All optional text fields that are not provided must
  be stored as null, not as empty strings, to distinguish "not set" from
  "intentionally blank."
- **BPM bounds:** BPM, if provided, must be a positive number.

## Out of Scope

- Cloud sync or multi-device replication.
- Audio file format conversion or transcoding.
- Version history or undo for edits to metadata.
- Soft delete, trash, or archive functionality.
- Full-text search indexing beyond basic SQL filtering.
- A reusable catalog for authors, musical keys, or song sections.
- Tagging or genre classification.
- Audio waveform or spectrogram storage.

## Completion Criteria

- All FRs are reflected in the implemented data model with passing automated
  tests that exercise each requirement.
- A manual demo creates a note (with and without a title), attaches instruments,
  toggles the used/available state, filters by state, and performs a hard delete
  confirming the file is removed from disk.

## Open Questions

- None at this time; all requirements were clarified during the interview.
