# Tasks: Audio I/O Management

**Branch**: `002-audio-io-management` | **Date**: 2026-09-02
**Spec**: [spec.md](file:///Users/andresdelgado/Documents/Coding/Vault/specs/002-audio-io-management/spec.md) | **Plan**: [plan.md](file:///Users/andresdelgado/Documents/Coding/Vault/specs/002-audio-io-management/plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish shared types, format whitelist, and validation utilities that all user stories depend on.

- [x] T001 Create `AudioFormat` union type, `SUPPORTED_AUDIO_FORMATS` const array, and `isSupportedAudioFormat()` type guard in src/shared/types/audio.ts
- [x] T002 Create `AudioIngestionResult` interface with `relativePath`, `absolutePath`, `format`, and `sizeBytes` fields in src/shared/types/audio.ts
- [x] T003 Create `AudioValidationError` class extending `Error` with `code` field (`UNSUPPORTED_EXTENSION`, `HEADER_MISMATCH`, `FILE_UNREADABLE`) in src/shared/types/audio.ts
- [x] T004 Add `export * from './audio'` re-export to src/shared/types/index.ts
- [x] T005 Verify `npx tsc --noEmit` passes with the new types

**Checkpoint**: Shared type foundation is in place. All downstream phases can import from `@shared/types`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core audio infrastructure that MUST be complete before any user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 Create magic byte signature map for WAV (RIFF+WAVE at offsets 0,8), MP3 (frame sync FF FB/F3/F2 or ID3 tag), M4A (ftyp at offset 4), OGG (OggS at offset 0), and FLAC (fLaC at offset 0) in src/main/audio/validate-audio-header.ts
- [x] T007 Implement `validateAudioHeader(header: Buffer, format: AudioFormat): boolean` function using the signature map in src/main/audio/validate-audio-header.ts
- [x] T008 Create `AudioStorageService` class with constructor accepting `audioVaultBase: string` and `ensureVaultDirectory()` method using `fs.mkdirSync(path, { recursive: true })` for both `audio_vault/` and `recordings/` subdirectory in src/main/audio/audio-storage-service.ts
- [x] T009 Implement `resolveAbsolutePath(relativePath: string): string` with path traversal protection (`path.resolve()` + `startsWith` check against `audioVaultBase + path.sep`) in src/main/audio/audio-storage-service.ts
- [x] T010 Create barrel export in src/main/audio/index.ts re-exporting `AudioStorageService`, `validateAudioHeader`
- [x] T011 Update src/main/index.ts to instantiate `AudioStorageService` with `path.join(app.getPath('userData'), 'audio_vault')` and call `ensureVaultDirectory()` before `createWindow()` in the `app.whenReady()` handler

**Checkpoint**: Foundation ready — AudioStorageService exists, vault directory is bootstrapped on startup, header validation is available.

---

## Phase 3: User Story 1 — Record Audio Internally and Persist to Disk (Priority: P1) 🎯 MVP

**Goal**: Enable the Main process to receive a raw audio buffer from the Renderer and write it to the vault with a unique UUID filename.

**Independent Test**: Write a buffer with valid WAV headers → verify file exists on disk at `recordings/{uuid}.wav` with matching content, and `relativePath` is returned.

### Implementation for User Story 1

- [x] T012 [US1] Implement `writeRecording(buffer: Buffer, format: AudioFormat): AudioIngestionResult` in src/main/audio/audio-storage-service.ts — validate format with `isSupportedAudioFormat()`, validate buffer magic bytes with `validateAudioHeader()`, generate UUID filename with `crypto.randomUUID()`, call `ensureVaultDirectory()`, write file with `fs.writeFileSync()`, return `AudioIngestionResult` with relative path `recordings/{uuid}.{format}`, absolute path, format, and file size
- [x] T013 [US1] Verify `npm run build:main` compiles cleanly with the new `writeRecording()` method

**Checkpoint**: User Story 1 is fully functional — buffers can be written to disk with validation and unique naming.

---

## Phase 4: User Story 2 — Import External Audio Files (Priority: P1)

**Goal**: Enable the Main process to copy an external audio file into the vault after validating its extension and headers.

**Independent Test**: Copy a valid `.mp3` file from a temp location → verify it is copied (not moved) into `recordings/{uuid}.mp3`, original remains, and `AudioIngestionResult` is correct.

### Implementation for User Story 2

- [x] T014 [US2] Implement `importFile(sourcePath: string): AudioIngestionResult` in src/main/audio/audio-storage-service.ts — extract extension with `path.extname()`, validate with `isSupportedAudioFormat()`, read first 12 bytes with `fs.openSync()`/`fs.readSync()` for header validation via `validateAudioHeader()`, generate UUID filename, call `ensureVaultDirectory()`, copy with `fs.copyFileSync()`, stat for size, return `AudioIngestionResult`
- [x] T015 [US2] Verify `npm run build:main` compiles cleanly with the new `importFile()` method

**Checkpoint**: User Story 2 is fully functional — external files can be imported with full validation.

---

## Phase 5: User Story 3 — Audio Vault Directory Initialization (Priority: P1)

**Goal**: Guarantee the audio vault directory exists and is writable at startup and before every write, with resilient recreation.

**Independent Test**: Delete the vault directory, call `ensureVaultDirectory()`, confirm it is recreated.

### Implementation for User Story 3

- [x] T016 [US3] Verify `ensureVaultDirectory()` is called in the `AudioStorageService` constructor (already done in T008) AND called again inside `writeRecording()` and `importFile()` before every write (FR-016) in src/main/audio/audio-storage-service.ts
- [x] T017 [US3] Verify `ensureVaultDirectory()` in src/main/index.ts is called at startup before `createWindow()` (already done in T011), confirm idempotent behavior when directory already exists

**Checkpoint**: Directory lifecycle is fully guaranteed — startup creation, runtime resilience, and idempotent verification.

---

## Phase 6: User Story 4 — Cascading Disk Deletion (Priority: P2)

**Goal**: When a database note is deleted, the corresponding audio file is removed from disk. Handle missing files gracefully.

**Independent Test**: Write a file, delete via `deleteFile()`, verify file is gone. Call `deleteFile()` on a missing file, verify no error.

### Implementation for User Story 4

- [x] T018 [US4] Implement `deleteFile(relativePath: string): { deleted: boolean; missing: boolean }` in src/main/audio/audio-storage-service.ts — resolve path with `resolveAbsolutePath()` (validates containment), attempt `fs.unlinkSync()`, catch `ENOENT` and return `{ deleted: false, missing: true }`, otherwise return `{ deleted: true, missing: false }`
- [x] T019 [US4] Update `registerNoteHandlers()` signature in src/main/ipc/note-handlers.ts to accept `AudioStorageService` as third parameter
- [x] T020 [US4] Refactor the `notes:delete` IPC handler in src/main/ipc/note-handlers.ts to call `audioService.deleteFile(result.file_path)` instead of raw `fs.promises.unlink(result.file_path)`, removing the direct `fs` import for audio operations
- [x] T021 [US4] Update src/main/ipc/index.ts (if barrel exists) and src/main/index.ts to pass the `AudioStorageService` instance to `registerNoteHandlers(ipcMain, db, audioService)`
- [x] T022 [US4] Verify `npm run build:main` compiles cleanly after IPC handler refactor

**Checkpoint**: Cascading deletion works — database deletions trigger disk cleanup, missing files are handled gracefully.

---

## Phase 7: User Story 5 — File Format Validation (Priority: P2)

**Goal**: Verify that extension whitelist and header validation are enforced across all ingestion paths.

**Independent Test**: Attempt to import a `.txt` renamed to `.wav` → verify rejection with `HEADER_MISMATCH`. Attempt a `.aac` file → verify rejection with `UNSUPPORTED_EXTENSION`.

### Implementation for User Story 5

- [x] T023 [US5] Verify that `writeRecording()` throws `AudioValidationError` with code `UNSUPPORTED_EXTENSION` when called with a format not in `SUPPORTED_AUDIO_FORMATS` in src/main/audio/audio-storage-service.ts
- [x] T024 [US5] Verify that `writeRecording()` throws `AudioValidationError` with code `HEADER_MISMATCH` when buffer magic bytes do not match the claimed format in src/main/audio/audio-storage-service.ts
- [x] T025 [US5] Verify that `importFile()` throws `AudioValidationError` with code `UNSUPPORTED_EXTENSION` for files with unsupported extensions in src/main/audio/audio-storage-service.ts
- [x] T026 [US5] Verify that `importFile()` throws `AudioValidationError` with code `HEADER_MISMATCH` for files with valid extensions but mismatched binary headers in src/main/audio/audio-storage-service.ts

**Checkpoint**: All validation paths are confirmed — the system rejects bad data at every entry point.

---

## Phase 8: Automated Test Suite

**Purpose**: Comprehensive Vitest tests covering all acceptance criteria and edge cases.

### Header Validation Tests

- [x] T027 [P] Create test file src/main/audio/__tests__/validate-audio-header.test.ts with describe block for `validateAudioHeader()`
- [x] T028 [P] Test that `validateAudioHeader()` returns `true` for valid WAV header (RIFF + WAVE bytes) in src/main/audio/__tests__/validate-audio-header.test.ts
- [x] T029 [P] Test that `validateAudioHeader()` returns `true` for valid MP3 header (frame sync `FF FB` and ID3 tag `49 44 33`) in src/main/audio/__tests__/validate-audio-header.test.ts
- [x] T030 [P] Test that `validateAudioHeader()` returns `true` for valid M4A header (`ftyp` at offset 4) in src/main/audio/__tests__/validate-audio-header.test.ts
- [x] T031 [P] Test that `validateAudioHeader()` returns `true` for valid OGG header (`OggS`) in src/main/audio/__tests__/validate-audio-header.test.ts
- [x] T032 [P] Test that `validateAudioHeader()` returns `true` for valid FLAC header (`fLaC`) in src/main/audio/__tests__/validate-audio-header.test.ts
- [x] T033 [P] Test that `validateAudioHeader()` returns `false` for mismatched format (e.g., WAV header with `mp3` format) in src/main/audio/__tests__/validate-audio-header.test.ts

### AudioStorageService Tests

- [x] T034 Create test file src/main/audio/__tests__/audio-storage-service.test.ts with `beforeEach` creating a temp directory and `afterEach` cleaning it up (matching existing test patterns from Spec 001)
- [x] T035 Test that `AudioStorageService` constructor creates `recordings/` subdirectory inside the provided base path in src/main/audio/__tests__/audio-storage-service.test.ts
- [x] T036 Test that `ensureVaultDirectory()` recreates the directory if it was deleted after construction in src/main/audio/__tests__/audio-storage-service.test.ts
- [x] T037 Test that `ensureVaultDirectory()` is idempotent — calling it twice when directory exists causes no errors in src/main/audio/__tests__/audio-storage-service.test.ts
- [x] T038 Test that `writeRecording()` creates a file on disk with content matching the input buffer in src/main/audio/__tests__/audio-storage-service.test.ts
- [x] T039 Test that `writeRecording()` returns `relativePath` matching pattern `recordings/{uuid}.wav` in src/main/audio/__tests__/audio-storage-service.test.ts
- [x] T040 Test that `writeRecording()` returns correct `sizeBytes` matching the buffer length in src/main/audio/__tests__/audio-storage-service.test.ts
- [x] T041 Test that `writeRecording()` throws `AudioValidationError` with code `UNSUPPORTED_EXTENSION` for unsupported format in src/main/audio/__tests__/audio-storage-service.test.ts
- [x] T042 Test that `writeRecording()` throws `AudioValidationError` with code `HEADER_MISMATCH` when buffer headers don't match claimed format in src/main/audio/__tests__/audio-storage-service.test.ts
- [x] T043 Test that `importFile()` copies source file into `recordings/` with UUID filename and original remains untouched in src/main/audio/__tests__/audio-storage-service.test.ts
- [x] T044 Test that `importFile()` returns correct `format`, `relativePath`, `absolutePath`, and `sizeBytes` in src/main/audio/__tests__/audio-storage-service.test.ts
- [x] T045 Test that `importFile()` throws `AudioValidationError` with code `UNSUPPORTED_EXTENSION` for `.aac` file in src/main/audio/__tests__/audio-storage-service.test.ts
- [x] T046 Test that `importFile()` throws `AudioValidationError` with code `HEADER_MISMATCH` for `.wav` file with JPEG headers in src/main/audio/__tests__/audio-storage-service.test.ts
- [x] T047 Test that `deleteFile()` removes an existing file and returns `{ deleted: true, missing: false }` in src/main/audio/__tests__/audio-storage-service.test.ts
- [x] T048 Test that `deleteFile()` returns `{ deleted: false, missing: true }` without throwing when file is already missing in src/main/audio/__tests__/audio-storage-service.test.ts
- [x] T049 Test that `resolveAbsolutePath()` throws an error for path traversal attempts (e.g., `../../etc/passwd`) in src/main/audio/__tests__/audio-storage-service.test.ts
- [x] T050 Test that `resolveAbsolutePath()` succeeds for valid relative paths like `recordings/valid-uuid.wav` in src/main/audio/__tests__/audio-storage-service.test.ts
- [x] T051 Run `npm test` and verify all new tests plus existing 30 Spec 001 tests pass
- [x] T052 Run `npx tsc --noEmit` and `npx tsc -p tsconfig.main.json --noEmit` and verify zero errors

**Checkpoint**: Full test suite passes. All acceptance criteria verified. TypeScript strict compilation clean.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, cleanup, and documentation.

- [x] T053 [P] Verify no raw `fs.unlink` or `fs.writeFile` calls for audio operations remain outside of `AudioStorageService` in src/main/
- [x] T054 [P] Verify all code comments and documentation are in English (constitution: Unified Language)
- [x] T055 Run `npm run build:main` and verify clean compilation to dist/main/
- [x] T056 Run quickstart.md validation scenarios and confirm all 8 pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (shared types must exist)
- **User Story 1 (Phase 3)**: Depends on Phase 2 (service and header validation must exist)
- **User Story 2 (Phase 4)**: Depends on Phase 2 (service foundation must exist)
- **User Story 3 (Phase 5)**: Depends on Phase 2 (verifies existing `ensureVaultDirectory()`)
- **User Story 4 (Phase 6)**: Depends on Phase 2 + Phase 3 (needs service + delete method)
- **User Story 5 (Phase 7)**: Depends on Phase 3 + Phase 4 (verifies validation in both paths)
- **Test Suite (Phase 8)**: Depends on Phases 1–7 (all implementation must be complete)
- **Polish (Phase 9)**: Depends on Phase 8 (all tests must pass first)

### User Story Dependencies

- **US1 (Record)**: Can start after Phase 2 — no dependency on other stories
- **US2 (Import)**: Can start after Phase 2 — independent of US1
- **US3 (Directory Init)**: Can start after Phase 2 — verifies foundation work
- **US4 (Deletion)**: Depends on having a working service with files to delete
- **US5 (Validation)**: Depends on US1 + US2 being implemented (verifies their validation paths)

### Within Each User Story

- Implementation tasks are sequential within each story
- Build verification follows implementation

### Parallel Opportunities

- T001, T002, T003 can be done together (same file, different sections)
- T006, T007 can be done together (same file)
- T012 and T014 can be parallelized (different methods, no cross-dependency)
- T027–T033 (header validation tests) are all [P] — can be written in parallel
- T053, T054 (polish) are [P] — can be done in parallel

---

## Parallel Example: Phase 8 Header Tests

```bash
# Launch all header validation tests together:
Task: "T028 — Test valid WAV header in validate-audio-header.test.ts"
Task: "T029 — Test valid MP3 header in validate-audio-header.test.ts"
Task: "T030 — Test valid M4A header in validate-audio-header.test.ts"
Task: "T031 — Test valid OGG header in validate-audio-header.test.ts"
Task: "T032 — Test valid FLAC header in validate-audio-header.test.ts"
Task: "T033 — Test mismatched format in validate-audio-header.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (shared types)
2. Complete Phase 2: Foundational (service skeleton + header validation)
3. Complete Phase 3: User Story 1 (writeRecording)
4. **STOP and VALIDATE**: Build compiles, manual buffer write test works
5. Proceed to remaining stories

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Add US1 (writeRecording) → Record works → MVP!
3. Add US2 (importFile) → Import works
4. Add US3 (directory init verification) → Resilience confirmed
5. Add US4 (deleteFile + IPC refactor) → Cleanup works
6. Add US5 (validation verification) → Integrity confirmed
7. Phase 8 → Full test coverage
8. Phase 9 → Polish and ship

---

## Notes

- [P] tasks = different files or independent sections, no dependencies
- [US*] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each phase completion
- Stop at any checkpoint to validate the story independently
- Existing Spec 001 tests (30 tests) must continue to pass throughout
