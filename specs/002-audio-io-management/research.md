# Research: Audio I/O Management

**Date**: 2026-09-02 | **Spec**: [spec.md](file:///Users/andresdelgado/Documents/Coding/Vault/specs/002-audio-io-management/spec.md)

## R1: Magic Byte Signatures for Accepted Audio Formats

**Decision**: Validate file authenticity by comparing the first N bytes against known magic byte signatures for each accepted format.

**Rationale**: Magic byte validation is the industry-standard approach for verifying file type integrity without parsing the entire file. It catches renamed/corrupted files at minimal performance cost.

**Signatures**:

| Format | Extension | Magic Bytes (hex) | Offset | Notes |
|--------|-----------|-------------------|--------|-------|
| WAV    | `.wav`    | `52 49 46 46` ("RIFF") + `57 41 56 45` ("WAVE") at offset 8 | 0, 8 | RIFF container; must verify both RIFF header and WAVE sub-type |
| MP3    | `.mp3`    | `FF FB`, `FF F3`, `FF F2` (frame sync) or `49 44 33` ("ID3" tag) | 0 | ID3v2 tag may precede frame sync bytes |
| M4A    | `.m4a`    | `00 00 00 xx 66 74 79 70` ("ftyp" at offset 4) | 4 | MPEG-4 container; the 4th-byte offset contains `ftyp` atom marker |
| OGG    | `.ogg`    | `4F 67 67 53` ("OggS") | 0 | Ogg container page header |
| FLAC   | `.flac`   | `66 4C 61 43` ("fLaC") | 0 | FLAC stream marker |

**Alternatives considered**:
- Full file parsing with an audio codec library: Rejected — too heavy for a validation gate; saves processing for actual playback.
- Extension-only validation: Rejected — trivially bypassed by renaming files.

---

## R2: UUID-Based File Naming Strategy

**Decision**: Use `crypto.randomUUID()` (Node.js built-in) to generate v4 UUIDs for all ingested audio filenames.

**Rationale**: UUIDs provide collision-resistant unique identifiers without requiring coordination (no database counter needed). Node.js 19+ (and Electron 35's bundled Node) provides `crypto.randomUUID()` natively with zero dependencies.

**Naming convention**: `recordings/{uuid}.{original_extension}`
- Example: `recordings/a3f1b2c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c.wav`
- The `recordings/` subdirectory prefix keeps the vault organized and matches the existing `file_path` pattern used in Spec 001.

**Alternatives considered**:
- Timestamp-based naming (`YYYYMMDD-HHmmss-SSS`): Rejected — sub-millisecond collisions possible with concurrent recordings.
- Monotonic counter from `app_meta`: Rejected — adds unnecessary DB coupling for file naming; the counter is already used for note titles.

---

## R3: Path Traversal Security

**Decision**: Validate that all resolved file paths remain within the `audio_vault` base directory using `path.resolve()` + prefix comparison.

**Rationale**: Prevents directory traversal attacks (e.g., `../../etc/passwd`) when constructing file paths from user-supplied filenames or relative paths stored in the database. This is a defense-in-depth measure.

**Implementation approach**:
1. Resolve the candidate path with `path.resolve(audioVaultBase, relativePath)`
2. Verify the resolved path starts with `audioVaultBase + path.sep`
3. Reject any path that escapes the sandbox

**Alternatives considered**:
- Sanitizing input strings with regex: Rejected — fragile and platform-dependent; `path.resolve()` handles all edge cases natively.

---

## R4: Atomicity Between Disk Write and Database Insert

**Decision**: Write-then-insert with rollback cleanup. Write the file to disk first, then insert the database row. If the database insert fails, delete the orphaned file.

**Rationale**: SQLite transactions cannot span file system operations. Writing the file first and cleaning up on DB failure is simpler and more reliable than the reverse (which would leave a DB row pointing at a non-existent file).

**Error handling**:
- Disk write fails → return error immediately, no DB row created (FR-015 satisfied)
- Disk write succeeds, DB insert fails → delete the written file, return error
- Disk write succeeds, DB insert succeeds → return success with the new AudioNote

**Alternatives considered**:
- Two-phase commit: Rejected — over-engineered for a local desktop app.
- Insert-then-write: Rejected — a failed write leaves an orphaned DB record pointing to nothing.

---

## R5: Audio Vault Directory Lifecycle

**Decision**: Use `fs.mkdirSync(vaultPath, { recursive: true })` at startup (idempotent) and re-check before each write operation.

**Rationale**: `recursive: true` is idempotent — safe to call on every launch without error if the directory already exists. Re-checking before writes handles the edge case where the directory is deleted while the app is running (FR-016).

**Base path**: `path.join(app.getPath('userData'), 'audio_vault')` — follows the constitution's directive.

**Subdirectory**: `recordings/` inside `audio_vault/` — keeps ingested files organized.

**Alternatives considered**:
- Lazy initialization (only create on first write): Rejected — startup verification catches permission issues early.
- Using `os.tmpdir()`: Rejected — constitution requires `userData` path.
