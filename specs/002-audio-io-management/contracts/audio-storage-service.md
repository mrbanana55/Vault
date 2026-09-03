# Contract: AudioStorageService

**Date**: 2026-09-02 | **Module**: `src/main/audio/audio-storage-service.ts`

## Overview

The `AudioStorageService` is the single entry point for all audio file I/O in the Main process. It enforces format validation, path security, UUID naming, and disk lifecycle management.

## Constructor

| Parameter       | Type     | Description                                     |
|-----------------|----------|-------------------------------------------------|
| `audioVaultBase`| `string` | Absolute path to the audio vault root directory  |

On construction, the service ensures `audioVaultBase/recordings/` exists (creates it if missing).

## Public Methods

### `ensureVaultDirectory(): void`

Verifies that the audio vault directory and `recordings/` subdirectory exist. Creates them if missing. Called at app startup and before each write operation.

- **Throws**: If the directory cannot be created (permission error, disk full).
- **FR**: FR-003, FR-004, FR-016

---

### `writeRecording(buffer: Buffer, format: AudioFormat): AudioIngestionResult`

Writes a raw audio buffer (received from the Renderer via IPC) to disk.

| Parameter | Type          | Description                           |
|-----------|---------------|---------------------------------------|
| `buffer`  | `Buffer`      | Raw audio data from the Renderer      |
| `format`  | `AudioFormat` | Target format (determines extension)  |

**Returns**: `AudioIngestionResult` with `relativePath` suitable for DB storage.

**Behavior**:
1. Validates that `format` is in the accepted whitelist
2. Validates the buffer's magic bytes match the claimed format
3. Generates a UUID filename: `recordings/{uuid}.{format}`
4. Ensures the vault directory exists
5. Writes the buffer to disk synchronously
6. Returns the result with relative path, absolute path, format, and file size

- **Throws**: `AudioValidationError` if format is unsupported or headers mismatch.
- **Throws**: System error if disk write fails.
- **FR**: FR-001, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-012

---

### `importFile(sourcePath: string): AudioIngestionResult`

Copies an external audio file into the vault after validation.

| Parameter    | Type     | Description                              |
|--------------|----------|------------------------------------------|
| `sourcePath` | `string` | Absolute path to the source file on disk |

**Returns**: `AudioIngestionResult` with `relativePath` suitable for DB storage.

**Behavior**:
1. Extracts extension from `sourcePath` and validates against the whitelist
2. Reads the file header (first 12 bytes) and validates magic bytes
3. Generates a UUID filename: `recordings/{uuid}.{ext}`
4. Ensures the vault directory exists
5. Copies the file synchronously into the vault
6. Returns the result with relative path, absolute path, format, and file size

- **Throws**: `AudioValidationError` if extension unsupported, headers mismatch, or source unreadable.
- **Throws**: System error if copy fails.
- **FR**: FR-005, FR-006, FR-007, FR-008, FR-009, FR-011, FR-012

---

### `deleteFile(relativePath: string): { deleted: boolean; missing: boolean }`

Removes a physical audio file from the vault.

| Parameter      | Type     | Description                                   |
|----------------|----------|-----------------------------------------------|
| `relativePath` | `string` | Relative path as stored in the database       |

**Returns**: Object indicating whether the file was deleted or was already missing.

**Behavior**:
1. Resolves the relative path against `audioVaultBase`
2. Validates the resolved path is within the vault (path traversal check)
3. Attempts to unlink the file
4. If `ENOENT`, returns `{ deleted: false, missing: true }`
5. Otherwise returns `{ deleted: true, missing: false }`

- **Throws**: System error if unlink fails for reasons other than `ENOENT`.
- **FR**: FR-013, FR-014

---

### `resolveAbsolutePath(relativePath: string): string`

Resolves a relative path to an absolute path within the vault, with path traversal protection.

| Parameter      | Type     | Description                             |
|----------------|----------|-----------------------------------------|
| `relativePath` | `string` | Relative path from the database         |

**Returns**: Absolute path.

**Throws**: Error if the resolved path escapes the vault directory.

## Companion Utilities (src/shared/types/audio.ts)

### `SUPPORTED_AUDIO_FORMATS: readonly AudioFormat[]`

The canonical whitelist: `['wav', 'mp3', 'm4a', 'ogg', 'flac']`

### `isSupportedAudioFormat(ext: string): ext is AudioFormat`

Type guard checking if a string is a valid `AudioFormat`.

## Companion Utilities (src/main/audio/validate-audio-header.ts)

### `validateAudioHeader(header: Buffer, format: AudioFormat): boolean`

Compares the first N bytes of a buffer against the expected magic bytes for the given format. Returns `true` if the header matches.
