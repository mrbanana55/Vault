# Implementation Plan: Audio I/O Management

**Branch**: `002-audio-io-management` | **Date**: 2026-09-02 | **Spec**: [spec.md](file:///Users/andresdelgado/Documents/Coding/Vault/specs/002-audio-io-management/spec.md)

**Input**: Feature specification from `specs/002-audio-io-management/spec.md`

## Summary

Implement the audio file I/O layer in the Electron Main process, providing validated storage, import, and deletion of audio files within a dedicated `audio_vault/` directory. The database never stores binary audio data — only relative file paths. This plan is organized into 4 sequential, atomic phases: shared types, core storage service, deletion/security, and automated tests.

## Technical Context

**Language/Version**: TypeScript 5.5+ (strict mode, no `any`)

**Primary Dependencies**: `better-sqlite3` (existing), Node.js `fs`, `path`, `crypto` (built-in)

**Storage**: SQLite (existing `audio_notes.file_path` column) + local file system (`audio_vault/recordings/`)

**Testing**: Vitest 3.2+ (existing configuration, 30 tests from Spec 001)

**Target Platform**: macOS, Windows, Linux (Electron 35 desktop app)

**Project Type**: Desktop application (Electron)

**Performance Goals**: File write/copy operations complete within standard OS I/O bounds; no audio processing in Main

**Constraints**: Zero new third-party dependencies (constitution). All file I/O in Main process only. No `any` types.

**Scale/Scope**: Single-user local app; audio files typically 1–50 MB each

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| **Stack Simplicity** | ✅ PASS | No new dependencies. Uses Node.js built-in `fs`, `path`, `crypto` only. |
| **Process Separation** | ✅ PASS | All file I/O is in `src/main/audio/`. Renderer sends `ArrayBuffer` over IPC. |
| **Verifiable Tests** | ✅ PASS | Phase 4 delivers comprehensive Vitest test suite covering all FRs. |
| **Data Integrity** | ✅ PASS | DB stores relative paths only (FR-002). Files in `userData/audio_vault/`. No BLOBs. |
| **Unified Language** | ✅ PASS | All code, comments, and docs in English. |
| **No `any`** | ✅ PASS | Strict types in `@shared/types/audio.ts`. All service methods fully typed. |
| **IPC Contract** | ✅ PASS | All handlers return `IPCResult<T>`. Audio payloads as `ArrayBuffer`. |
| **Audio in userData** | ✅ PASS | Base path: `app.getPath('userData')/audio_vault/`. |

## Project Structure

### Documentation (this feature)

```text
specs/002-audio-io-management/
├── plan.md              # This file
├── research.md          # Phase 0 output — magic bytes, UUID strategy, path security
├── data-model.md        # Phase 1 output — entity definitions and relationships
├── quickstart.md        # Phase 1 output — validation guide
├── contracts/
│   └── audio-storage-service.md  # Phase 1 output — service API contract
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── main/
│   ├── audio/
│   │   ├── audio-storage-service.ts   # Phase 2–3: Core service class
│   │   ├── validate-audio-header.ts   # Phase 2: Magic byte validation
│   │   ├── index.ts                   # Phase 2: Barrel export
│   │   └── __tests__/
│   │       ├── audio-storage-service.test.ts  # Phase 4: Service tests
│   │       └── validate-audio-header.test.ts  # Phase 4: Validation tests
│   ├── db/                            # Existing (Spec 001)
│   ├── ipc/                           # Existing (Spec 001), updated in Phase 3
│   └── index.ts                       # Updated in Phase 2 (vault bootstrap)
├── preload/                           # Existing (Spec 001)
└── shared/
    └── types/
        ├── audio.ts                   # Phase 1: AudioFormat, whitelist, type guard
        └── index.ts                   # Updated in Phase 1: re-export audio.ts
```

**Structure Decision**: Follows the existing Vault directory layout from Spec 001. New code lands in `src/main/audio/` (service + validation) and `src/shared/types/audio.ts` (shared types). No structural changes to existing modules.

## Implementation Phases

### Phase 1: Shared Types & Validation Utilities

**Goal**: Establish the type foundation and format whitelist in `src/shared/types/audio.ts`.

**Files created/modified**:
- **CREATE** `src/shared/types/audio.ts` — `AudioFormat` union, `SUPPORTED_AUDIO_FORMATS` const array, `isSupportedAudioFormat()` type guard, `AudioIngestionResult` interface, `AudioValidationError` interface
- **MODIFY** `src/shared/types/index.ts` — add `export * from './audio'`

**Key decisions**:
- `AudioFormat` is a string literal union: `'wav' | 'mp3' | 'm4a' | 'ogg' | 'flac'`
- `SUPPORTED_AUDIO_FORMATS` is `as const` readonly array for runtime checks
- `isSupportedAudioFormat()` is a type guard for narrowing unknown extensions
- UUID generation uses `crypto.randomUUID()` — referenced as a naming convention, but the actual call lives in Phase 2's service

**Acceptance gate**: `npx tsc --noEmit` passes with the new types.

---

### Phase 2: Core AudioStorageService

**Goal**: Implement the main service for directory bootstrap, buffer writing, and file copying.

**Files created/modified**:
- **CREATE** `src/main/audio/validate-audio-header.ts` — magic byte signature map + `validateAudioHeader(header, format)` function
- **CREATE** `src/main/audio/audio-storage-service.ts` — class with constructor, `ensureVaultDirectory()`, `writeRecording()`, `importFile()`, `resolveAbsolutePath()`
- **CREATE** `src/main/audio/index.ts` — barrel exports
- **MODIFY** `src/main/index.ts` — instantiate `AudioStorageService` at startup, call `ensureVaultDirectory()` before `createWindow()`

**Key decisions**:
- Service is a plain class (no singleton pattern) — instantiated in `index.ts` with `audioVaultBase` injected
- `writeRecording()` is synchronous (`fs.writeFileSync`) for atomicity guarantees within the Electron main thread
- `importFile()` uses `fs.copyFileSync` to copy (not move) the source file
- Both methods call `ensureVaultDirectory()` before writing (FR-016)
- Magic byte validation reads the first 12 bytes (sufficient for all 5 formats)
- Path traversal protection via `path.resolve()` + startsWith check is applied in `resolveAbsolutePath()`, called by all methods

**Acceptance gate**: `npm run build:main` compiles cleanly. Service is instantiated at startup.

---

### Phase 3: File Deletion & Security

**Goal**: Implement `deleteFile()`, harden path traversal checks, and update the existing note deletion IPC handler to use the new service.

**Files created/modified**:
- **MODIFY** `src/main/audio/audio-storage-service.ts` — add `deleteFile(relativePath)` method
- **MODIFY** `src/main/ipc/note-handlers.ts` — inject `AudioStorageService`, update `notes:delete` handler to call `service.deleteFile()` instead of raw `fs.promises.unlink()` with hardcoded path
- **MODIFY** `src/main/index.ts` — pass `AudioStorageService` instance to `registerNoteHandlers()`

**Key decisions**:
- `deleteFile()` resolves the relative path, validates containment, then unlinks
- `ENOENT` is caught and returns `{ deleted: false, missing: true }` (FR-014)
- The existing `notes:delete` handler currently uses `fs.promises.unlink(result.file_path)` with what appears to be the raw `file_path` from DB. This is replaced with `service.deleteFile(result.file_path)` which resolves relative → absolute and validates path containment first
- Path traversal check throws a descriptive error if the resolved path escapes the vault

**Acceptance gate**: The `notes:delete` handler uses the service for all file operations. No raw `fs` calls for audio files remain in IPC handlers.

---

### Phase 4: Automated Test Suite

**Goal**: Comprehensive Vitest tests covering all acceptance criteria.

**Files created**:
- **CREATE** `src/main/audio/__tests__/validate-audio-header.test.ts`
- **CREATE** `src/main/audio/__tests__/audio-storage-service.test.ts`

**Test coverage map**:

| Test | Covers FR | Description |
|------|-----------|-------------|
| Vault directory created on construction | FR-003, FR-004 | Verify `recordings/` dir exists after `new AudioStorageService()` |
| Vault directory recreated if deleted | FR-016 | Delete dir, call `ensureVaultDirectory()`, verify it exists again |
| `writeRecording()` creates file with correct content | FR-001, FR-010 | Write buffer, read back, compare |
| `writeRecording()` generates UUID filename | FR-012 | Verify `relativePath` matches `recordings/{uuid}.{ext}` pattern |
| `writeRecording()` validates format whitelist | FR-006, FR-007 | Pass unsupported format → expect error |
| `writeRecording()` validates magic bytes | FR-008, FR-009 | Pass mismatched headers → expect `HEADER_MISMATCH` |
| `importFile()` copies file into vault | FR-005, FR-011 | Verify source unchanged, copy in vault |
| `importFile()` rejects unsupported extension | FR-006, FR-007 | `.aac` file → expect error |
| `importFile()` rejects header mismatch | FR-008, FR-009 | `.wav` extension with JPEG bytes → error |
| `deleteFile()` removes existing file | FR-013 | Write, delete, verify gone |
| `deleteFile()` handles missing file gracefully | FR-014 | Delete non-existent → `{ deleted: false, missing: true }` |
| Path traversal blocked | Security | `../../etc/passwd` → error thrown |
| All 5 formats accepted with valid headers | FR-006 | WAV, MP3, M4A, OGG, FLAC each validated |
| `validateAudioHeader()` unit tests | FR-008 | Each format's magic bytes verified |

**Acceptance gate**: `npm test` passes all new + existing tests. `npx tsc --noEmit` clean.

## Complexity Tracking

No constitution violations. No complexity justifications needed.
