# Tasks: Play Audio Ideas

**Branch**: `008-play-audio-ideas` | **Date**: 2026-09-08 | **Spec**: [spec.md](file:///Users/andresdelgado/Documents/Coding/Vault/specs/008-play-audio-ideas/spec.md) | **Plan**: [plan.md](file:///Users/andresdelgado/Documents/Coding/Vault/specs/008-play-audio-ideas/plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Module structure and initial exports for custom audio protocol

- [X] T001 Create audio protocol handler module skeleton in src/main/audio/audio-protocol-handler.ts
- [X] T002 [P] Export audio protocol handler functions in src/main/audio/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core streaming protocol and playback state context that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Implement registerVaultAudioScheme and handleVaultAudioProtocol in src/main/audio/audio-protocol-handler.ts
- [X] T004 Register vault-audio scheme privilege before app.ready and attach protocol handler on ready in src/main/index.ts
- [X] T005 [P] Create unit tests for vault-audio protocol URL parsing and path containment in src/main/audio/__tests__/audio-protocol-handler.test.ts
- [X] T006 Create AudioPlayerContext and AudioPlayerProvider with HTMLAudioElement and playback state in src/renderer/context/AudioPlayerContext.tsx
- [X] T007 [P] Create convenience hook useAudioPlayer in src/renderer/hooks/useAudioPlayer.ts
- [X] T008 [P] Create unit tests for AudioPlayerContext playback state and controls in src/renderer/context/__tests__/AudioPlayerContext.test.tsx
- [X] T009 Wrap AppLayout with AudioPlayerProvider in src/renderer/App.tsx

**Checkpoint**: Foundation ready — custom audio protocol serves chunks with Range request support, and AudioPlayerContext is available throughout the Renderer tree.

---

## Phase 3: User Story 1 - Row-Level Playback Controls (Priority: P1) 🎯 MVP

**Goal**: Allow users to play, pause, resume, and switch playback of audio ideas directly by clicking a play/pause button located on the leftmost side of each row in the ideas table.

**Independent Test**: Mount IdeasTable with mock notes, click the play button on a row to confirm audio starts and the icon changes to pause, click pause to confirm audio halts and icon reverts to play, and click play on a different row to verify previous playback stops and the new idea begins from 00:00.

### Tests for User Story 1 ⚠️

- [X] T010 [P] [US1] Add unit and component tests for TableRow play/pause button and active row styling in src/renderer/components/__tests__/TableRow.test.tsx

### Implementation for User Story 1

- [X] T011 [P] [US1] Update table header columns to include leftmost play column in src/renderer/components/IdeasTable.tsx
- [X] T012 [US1] Implement play/pause button, active track styling, and togglePlay hook integration in src/renderer/components/TableRow.tsx
- [X] T013 [US1] Update IdeasTable component tests for new column layout in src/renderer/components/__tests__/IdeasTable.test.tsx

**Checkpoint**: User Story 1 is fully functional and testable independently as an MVP. Users can listen to any idea from their table.

---

## Phase 4: User Story 2 - Top-Center Interactive Time Bar and Duration Display (Priority: P1)

**Goal**: Display an interactive scrubber time bar in the top-center header area with real-time playback progress, drag/click seek functionality, and formatted elapsed/total duration on the right.

**Independent Test**: Mount AudioTimeBar with mock player state, verify scrubber position and `{current} / {duration}` formatting, simulate click/drag seek events to verify position updates, and test automatic reset upon track completion.

### Tests for User Story 2 ⚠️

- [X] T014 [P] [US2] Create component tests for scrubber slider and duration display in src/renderer/components/__tests__/AudioTimeBar.test.tsx

### Implementation for User Story 2

- [X] T015 [P] [US2] Implement AudioTimeBar component with range slider and formatted time display in src/renderer/components/AudioTimeBar.tsx
- [X] T016 [US2] Embed AudioTimeBar in top-center layout in src/renderer/components/Header.tsx
- [X] T017 [US2] Update Header component tests to verify AudioTimeBar integration in src/renderer/components/__tests__/Header.test.tsx

**Checkpoint**: User Stories 1 and 2 are complete. Users can play ideas from rows and scrub/monitor playback progress from the top center time bar.

---

## Phase 5: User Story 3 - Space Bar Global Play/Pause Control (Priority: P2)

**Goal**: Provide global Space bar play/pause toggle functionality that is strictly disabled when editing metadata in text inputs or active inline edit cells.

**Independent Test**: Simulate Space bar press in AudioPlayerContext when no inputs are focused to verify play/pause toggles, and simulate Space bar press when an `<input>`, `<textarea>`, or contentEditable element is active to verify event propagation is preserved without triggering playback.

### Tests for User Story 3 ⚠️

- [X] T018 [P] [US3] Create tests for Space bar playback shortcut and text field input isolation in src/renderer/context/__tests__/audio-keyboard-shortcuts.test.tsx

### Implementation for User Story 3

- [X] T019 [US3] Implement keyboard event listener with active input guard in src/renderer/context/AudioPlayerContext.tsx

**Checkpoint**: All user stories functional. Space bar controls playback hands-free without interfering with inline metadata edits.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification, end-to-end validation, and final integration checks

- [X] T020 Run TypeScript type check and build validation with npm run build
- [X] T021 Run complete Vitest test suite with npm test
- [X] T022 Execute manual validation scenarios defined in specs/008-play-audio-ideas/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion.
- **User Story 2 (Phase 4)**: Depends on Phase 2 completion (can proceed in parallel with US1).
- **User Story 3 (Phase 5)**: Depends on Phase 2 completion (refines AudioPlayerContext).
- **Polish (Phase 6)**: Depends on completion of all user stories.

### User Story Dependencies

- **User Story 1 (P1)**: Independent after Foundational phase. Requires `useAudioPlayer` and `vault-audio://`.
- **User Story 2 (P1)**: Independent after Foundational phase. Requires `useAudioPlayer` (reads `currentTime`, `duration`, `seek`).
- **User Story 3 (P2)**: Independent after Foundational phase. Enhances `AudioPlayerContext` with global shortcut listener.

### Parallel Opportunities

- Phase 1: `T002` can run alongside `T001`.
- Phase 2: `T005`, `T007`, `T008` can run in parallel with `T003`/`T004`/`T006`.
- Phase 3 (US1): `T010` (test) and `T011` (IdeasTable header) can run in parallel before `T012`.
- Phase 4 (US2): `T014` (test) and `T015` (AudioTimeBar) can run in parallel before `T016`.
- User Story 1 and User Story 2 can be developed in parallel since they touch separate UI areas (`TableRow`/`IdeasTable` vs `Header`/`AudioTimeBar`).

---

## Parallel Example: User Story 1

```bash
# Launch test and table header update concurrently:
Task: "Add unit and component tests for TableRow play/pause button in src/renderer/components/__tests__/TableRow.test.tsx"
Task: "Update table header columns to include leftmost play column in src/renderer/components/IdeasTable.tsx"
```

---

## Parallel Example: User Story 2

```bash
# Launch test and AudioTimeBar component concurrently:
Task: "Create component tests for scrubber slider and duration display in src/renderer/components/__tests__/AudioTimeBar.test.tsx"
Task: "Implement AudioTimeBar component with range slider and formatted time display in src/renderer/components/AudioTimeBar.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002).
2. Complete Phase 2: Foundational (T003-T009) — protocol handler and audio context.
3. Complete Phase 3: User Story 1 (T010-T013) — play/pause buttons on rows.
4. **STOP and VALIDATE**: Test row playback independently. Users can now audition audio ideas.

### Incremental Delivery

1. Setup + Foundation complete → audio pipeline operational.
2. User Story 1 complete → audible MVP (ideas can be played and paused).
3. User Story 2 complete → visual scrubber and duration tracking in top header.
4. User Story 3 complete → hands-free Space bar playback workflow with text editing protection.
5. Polish complete → all tests green and end-to-end verified.

---

## Notes

- All tasks use strict checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`.
- Tests are placed before implementation in each user story phase.
- Audio file access is strictly mediated by Main process via `vault-audio://` with Range request support.
- No third-party packages added; relies strictly on standard web APIs and React.
