# Quickstart Validation Guide: Audio I/O Management

**Date**: 2026-09-02 | **Spec**: [spec.md](file:///Users/andresdelgado/Documents/Coding/Vault/specs/002-audio-io-management/spec.md)

## Prerequisites

- Node.js 20+ installed
- Project dependencies installed (`npm install`)
- Spec 001 (Data Model) fully implemented and tests passing
- Vitest configured (`npm test` runs successfully)

## Validation Scenarios

### Scenario 1: Run the Full Test Suite

**Purpose**: Verify all acceptance criteria are met through automated tests.

```bash
npm test
```

**Expected outcome**: All existing tests (30 from Spec 001) plus all new audio I/O tests pass. Zero failures.

---

### Scenario 2: Verify Vault Directory Bootstrap

**Purpose**: Confirm the audio vault directory is created automatically.

**Test approach**: The test suite creates a temporary directory, constructs an `AudioStorageService` pointing at it, and verifies:
1. The `audio_vault/` directory is created
2. The `recordings/` subdirectory is created
3. Calling `ensureVaultDirectory()` again is idempotent (no errors)
4. Deleting the directory and calling `ensureVaultDirectory()` recreates it

---

### Scenario 3: Verify Recording Write

**Purpose**: Confirm raw audio buffers are written to disk correctly.

**Test approach**: Construct a `Buffer` with valid WAV magic bytes + payload, call `writeRecording()`, verify:
1. The file exists at the returned `absolutePath`
2. The `relativePath` matches pattern `recordings/{uuid}.wav`
3. File contents on disk match the original buffer
4. The `sizeBytes` matches the buffer length

---

### Scenario 4: Verify External File Import

**Purpose**: Confirm external files are copied (not moved) into the vault.

**Test approach**: Create a temporary `.mp3` file with valid MP3 headers, call `importFile()`, verify:
1. The original source file still exists (not moved)
2. A copy exists inside `recordings/` with a UUID filename
3. Source and destination file contents are byte-identical
4. The returned `format` is `'mp3'`

---

### Scenario 5: Verify Format Validation (Rejection)

**Purpose**: Confirm unsupported formats and header mismatches are rejected.

**Test approach**:
1. Attempt to import a `.aac` file → expect `UNSUPPORTED_EXTENSION` error
2. Attempt to import a `.wav` file with JPEG headers → expect `HEADER_MISMATCH` error
3. Attempt to write a buffer claiming `mp3` format but containing WAV headers → expect `HEADER_MISMATCH` error

---

### Scenario 6: Verify File Deletion

**Purpose**: Confirm audio files are removed from disk when requested.

**Test approach**:
1. Write a recording, then call `deleteFile()` with its relative path → verify file no longer exists, returns `{ deleted: true, missing: false }`
2. Call `deleteFile()` with a path that doesn't exist → returns `{ deleted: false, missing: true }` without throwing

---

### Scenario 7: Verify Path Traversal Protection

**Purpose**: Confirm the service rejects paths that escape the vault.

**Test approach**:
1. Call `resolveAbsolutePath('../../etc/passwd')` → expect error thrown
2. Call `deleteFile('../../../important-file')` → expect error thrown
3. Call `resolveAbsolutePath('recordings/valid-uuid.wav')` → expect success

---

### Scenario 8: Verify TypeScript Compilation

**Purpose**: Confirm strict typing with zero errors.

```bash
npx tsc --noEmit
npx tsc -p tsconfig.main.json --noEmit
```

**Expected outcome**: Both commands exit with code 0 and produce no errors.

## Build & Test Commands

| Command | Purpose |
|---------|---------|
| `npm test` | Run all Vitest tests |
| `npx tsc --noEmit` | Type-check the full project |
| `npx tsc -p tsconfig.main.json --noEmit` | Type-check main + shared |
| `npm run build:main` | Compile main process to `dist/main/` |
