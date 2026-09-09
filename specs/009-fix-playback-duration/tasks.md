# Tasks: Fix Audio Playback CSP and Real Duration Display

**Input**: Design documents from `specs/009-fix-playback-duration/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`
**Tests**: Includes targeted unit and integration tests for security policies, MIME mapping, duration backfilling, and audio metadata extraction.
**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- Paths follow standard Electron project structure:
  - `src/main/` for main process code and tests
  - `src/renderer/` for React UI components, hooks, contexts, and tests
  - `src/shared/` for shared TypeScript interfaces and contracts

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type definitions and shared data contracts

- [X] T001 Extend `UpdateAudioNoteInput` interface with `duration_seconds?: number` in `src/shared/types/audio-note.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core security policy, protocol handler, and database updates that MUST be complete before user stories can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 [P] Update Content Security Policy meta tag to include `media-src 'self' vault-audio: blob:;` in `src/renderer/index.html`
- [X] T003 [P] Add unit tests for `bypassCSP: true` privilege and MIME type header resolution in `src/main/audio/__tests__/audio-protocol-handler.test.ts`
- [X] T004 Update `registerVaultAudioScheme` to configure `bypassCSP: true` and update `handleVaultAudioProtocol` to set explicit audio MIME headers (`audio/mp4`, `audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/flac`) in `src/main/audio/audio-protocol-handler.ts`
- [X] T005 [P] Add unit tests for updating `duration_seconds` in `src/main/db/__tests__/note-repository.test.ts`
- [X] T006 Update `updateNote` to support updating `duration_seconds` in `src/main/db/note-repository.ts`

**Checkpoint**: Foundation ready — custom audio protocol serves correct MIME types and bypasses CSP, database accepts duration updates.

---

## Phase 3: User Story 1 - Unblocked Audio Playback Across All Supported Formats (Priority: P1) 🎯 MVP

**Goal**: Enable musicians to play any audio recording (`.m4a`, `.mp3`, `.wav`, `.ogg`, `.flac`) via `vault-audio://` without CSP violations or `NotSupportedError`.

**Independent Test**: Play `.m4a` and `.mp3` audio notes from the table. Verify audio plays immediately without `Refused to load media` CSP errors or `NotSupportedError` in the developer console.

### Tests for User Story 1 ⚠️

- [X] T007 [P] [US1] Add integration test for unblocked audio playback and MIME header verification in `src/renderer/context/__tests__/AudioPlayerContext.test.tsx`

### Implementation for User Story 1

- [X] T008 [US1] Ensure robust playback error reporting and format fallback in `src/renderer/context/AudioPlayerContext.tsx`

**Checkpoint**: At this point, User Story 1 is fully functional and testable independently. Audio playback works for all formats with zero CSP errors.

---

## Phase 4: User Story 2 - Accurate Audio Duration Display for All Ideas (Priority: P1)

**Goal**: Display accurate audio recording durations in the ideas table and player time bar, retroactively resolve and persist duration for existing notes with `duration_seconds <= 0`, and reliably extract durations during file import.

**Independent Test**: Load existing ideas with `00:00` duration and verify they resolve to their actual length (e.g. `1:24`) and remain persisted on refresh; import a new `.m4a` file and verify real duration is saved immediately.

### Tests for User Story 2 ⚠️

- [X] T009 [P] [US2] Add unit tests for timeout safety and fallback handling in `src/renderer/lib/__tests__/audio-metadata.test.ts`
- [X] T010 [P] [US2] Add unit tests for dynamic duration resolution on playback in `src/renderer/context/__tests__/AudioPlayerContext.test.tsx`
- [X] T011 [P] [US2] Add unit tests for automatic background duration resolution in `src/renderer/hooks/__tests__/useNotes.test.ts`

### Implementation for User Story 2

- [X] T012 [P] [US2] Add 3-second timeout and AudioContext fallback to `extractAudioDuration` in `src/renderer/lib/audio-metadata.ts`
- [X] T013 [US2] Implement automatic background duration resolution for notes with `duration_seconds <= 0` and persist via `window.vaultAPI.notes.update` in `src/renderer/hooks/useNotes.ts`
- [X] T014 [US2] Update `AudioPlayerContext.tsx` to detect `audio.duration > 0` when `currentNote.duration_seconds <= 0` and persist the resolved duration via `window.vaultAPI.notes.update`

**Checkpoint**: At this point, both User Stories 1 and 2 work independently. All audio notes show real durations, and playback plays all formats cleanly.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verification, build verification, and regression prevention

- [X] T015 [P] Run TypeScript type-checking and build validation via `npm run build`
- [X] T016 Run complete automated test suite via `npm test`
- [X] T017 Execute end-to-end quickstart validation scenarios from `specs/009-fix-playback-duration/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion (T002, T004)
- **User Story 2 (Phase 4)**: Depends on Foundational completion (T002, T004, T006)
- **Polish (Phase 5)**: Depends on US1 and US2 completion

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 2. Can be implemented and verified independently.
- **User Story 2 (P1)**: Depends on Phase 2 (specifically T006 for DB updates and T002 for CSP `blob:` access). Can run in parallel with or following US1.

### Parallel Opportunities

- **Phase 2 Foundational**:
  - T002 (`index.html`) can run in parallel with T003/T004 (`audio-protocol-handler.ts`) and T005/T006 (`note-repository.ts`)
- **Phase 4 Tests & Utilities**:
  - T009 (`audio-metadata.test.ts`), T010 (`AudioPlayerContext.test.tsx`), T011 (`useNotes.test.ts`), and T012 (`audio-metadata.ts`) can run in parallel

---

## Parallel Example: User Story 2

```bash
# Launch test creation tasks in parallel:
Task: "Add unit tests for timeout safety and fallback handling in src/renderer/lib/__tests__/audio-metadata.test.ts"
Task: "Add unit tests for dynamic duration resolution on playback in src/renderer/context/__tests__/AudioPlayerContext.test.tsx"
Task: "Add unit tests for automatic background duration resolution in src/renderer/hooks/__tests__/useNotes.test.ts"

# Implement extraction utility while tests run:
Task: "Add 3-second timeout and AudioContext fallback to extractAudioDuration in src/renderer/lib/audio-metadata.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (`src/shared/types/audio-note.ts`)
2. Complete Phase 2: Foundational (CSP in `index.html`, protocol handler in `audio-protocol-handler.ts`, SQLite update in `note-repository.ts`)
3. Complete Phase 3: User Story 1 (Unblocked audio playback)
4. **STOP and VALIDATE**: Verify `.m4a`, `.mp3`, `.wav` playback in browser without CSP or `NotSupportedError` logs
5. Deliver unblocked playback MVP

### Incremental Delivery

1. Complete Setup + Foundational → Security and streaming unblocked
2. Implement User Story 1 → Audio playback functional across all formats (MVP)
3. Implement User Story 2 → Duration display updated from `00:00` to real duration and backfilled in SQLite
4. Execute Polish tasks (Build + Test suite + Quickstart scenarios)
