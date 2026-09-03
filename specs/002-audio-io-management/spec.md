# Feature Specification: Audio I/O Management

**Feature Branch**: `002-audio-io-management`

**Created**: 2026-09-02

**Status**: Draft

**Input**: User description: "I/O management in the Main process. The database should never store binary audio files, instead, it should save the relative path to the corresponding audio. The base directory should be in a /audio_vault directory and it should be automatically created and verified when the app starts. The input channels are internal recording using the app, or external imports. The accepted file extensions are .wav, .mp3, .m4a, .ogg, .flac. The app should validate the headers and extensions before copying and writing. If the file is deleted in the database it should also be removed from disk."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record Audio Internally and Persist to Disk (Priority: P1)

A musician opens Vault, presses the record button, and captures a new musical idea using their microphone. When the recording finishes, the audio data is sent from the Renderer to the Main process, which writes the file to the audio vault directory and stores the relative file path in the database alongside the note metadata.

**Why this priority**: Recording audio internally is the primary input channel for the application. Without the ability to persist recorded audio to disk, the app has no core value.

**Independent Test**: Can be fully tested by recording a short clip, verifying the file exists on disk in the expected directory, and confirming the database row references the correct relative path.

**Acceptance Scenarios**:

1. **Given** the app is running and the audio vault directory exists, **When** the user completes a recording, **Then** the audio file is written to the audio vault directory and a corresponding database entry is created with a relative file path.
2. **Given** the app is running and the audio vault directory exists, **When** the user completes a recording, **Then** the file on disk matches the binary content sent from the Renderer.
3. **Given** the recording produces a valid audio payload, **When** the Main process writes the file, **Then** the file receives a unique name to prevent collisions with existing files.

---

### User Story 2 - Import External Audio Files (Priority: P1)

A musician has existing audio recordings (voice memos, demos, bounces) stored elsewhere on their computer. They import one or more files into Vault via a file picker or drag-and-drop. The Main process validates each file, copies it into the audio vault directory, and creates a database entry with the relative path.

**Why this priority**: Importing external files is the second primary input channel and equally critical for users migrating existing material into Vault.

**Independent Test**: Can be tested by selecting an external `.wav` file through the import dialog, verifying it is copied into the audio vault directory, and confirming the database row references the copied file's relative path.

**Acceptance Scenarios**:

1. **Given** the user selects a valid `.mp3` file from their desktop, **When** the import completes, **Then** a copy of that file exists inside the audio vault directory and the original file remains untouched.
2. **Given** the user selects a file with an unsupported extension (e.g., `.aac`), **When** the import is attempted, **Then** the system rejects the file with a clear error message and no file is written to the audio vault.
3. **Given** the user selects a file with a valid extension but corrupted or mismatched content headers, **When** the import is attempted, **Then** the system rejects the file with an error describing the header mismatch.

---

### User Story 3 - Audio Vault Directory Initialization (Priority: P1)

When the musician launches Vault for the first time (or after the audio vault directory has been manually deleted), the application automatically creates the audio vault directory before any audio operations are attempted. On subsequent launches, the application verifies the directory still exists and recreates it if necessary.

**Why this priority**: All audio storage depends on this directory existing. Without automatic initialization, every other audio operation would fail.

**Independent Test**: Can be tested by deleting the audio vault directory, launching the app, and confirming the directory is recreated before any audio operations run.

**Acceptance Scenarios**:

1. **Given** the audio vault directory does not exist, **When** the application starts, **Then** the directory is created automatically.
2. **Given** the audio vault directory already exists, **When** the application starts, **Then** the directory is left intact and no files are modified.
3. **Given** the audio vault directory was deleted while the app was running, **When** an audio write operation is attempted, **Then** the system recreates the directory before writing and the operation succeeds.

---

### User Story 4 - Cascading Disk Deletion (Priority: P2)

When a musician deletes an audio note from the database, the corresponding audio file on disk is also removed. This prevents orphaned files from accumulating and consuming storage.

**Why this priority**: Disk cleanup is important for long-term usability and storage management, but the app is functional without it (users can manually delete orphaned files).

**Independent Test**: Can be tested by creating a note, confirming the file exists, deleting the note via the app, and verifying the file no longer exists on disk.

**Acceptance Scenarios**:

1. **Given** an audio note exists with a corresponding file on disk, **When** the note is deleted from the database, **Then** the physical file is removed from the audio vault directory.
2. **Given** an audio note exists but the corresponding file has already been manually removed from disk, **When** the note is deleted from the database, **Then** the database deletion succeeds and the missing-file condition is logged without causing an error to the user.

---

### User Story 5 - File Format Validation (Priority: P2)

When audio files are ingested (via import or recording), the system validates that the file extension is among the accepted formats and that the file's binary header (magic bytes) matches the claimed format. This prevents corrupted, renamed, or malicious files from polluting the vault.

**Why this priority**: Validation protects data integrity but is secondary to the ability to actually store and retrieve files.

**Independent Test**: Can be tested by attempting to import a `.txt` file renamed to `.wav` and verifying it is rejected.

**Acceptance Scenarios**:

1. **Given** a file with a `.flac` extension and valid FLAC headers, **When** the file is submitted for ingestion, **Then** the system accepts and stores the file.
2. **Given** a file with a `.wav` extension but JPEG binary headers, **When** the file is submitted for ingestion, **Then** the system rejects the file with an error indicating a header/extension mismatch.
3. **Given** a file with an unsupported extension (e.g., `.wma`), **When** the file is submitted for ingestion, **Then** the system rejects the file before reading its contents.

---

### Edge Cases

- What happens when the disk is full and a write operation fails? The system must report a clear error and must not create a partial database entry.
- What happens when two recordings finish at nearly the same time? File naming must guarantee uniqueness to prevent overwrites.
- What happens when the audio vault directory's parent path becomes unwritable (permissions change)? The system must report the error gracefully.
- What happens when an import source file is locked or unreadable? The system must report the error and skip the file without crashing.
- What happens when a file with the same name already exists in the audio vault? The system must never overwrite existing files; it must generate a unique name.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST store audio files exclusively on the local file system, never as binary data in the database.
- **FR-002**: The database MUST store only relative file paths (e.g., `recordings/{uuid}.wav`) pointing to audio files in the audio vault directory.
- **FR-003**: The system MUST automatically create the audio vault directory when the application starts if it does not already exist.
- **FR-004**: The system MUST verify the audio vault directory exists and is writable on every application launch.
- **FR-005**: The system MUST support two input channels for audio ingestion: internal recording (captured within the app) and external file import.
- **FR-006**: The system MUST accept only the following audio file extensions: `.wav`, `.mp3`, `.m4a`, `.ogg`, `.flac`.
- **FR-007**: The system MUST reject any file whose extension is not in the accepted list before performing any read or copy operations.
- **FR-008**: The system MUST validate that the binary header (magic bytes) of each ingested file matches the claimed file extension.
- **FR-009**: The system MUST reject files where the binary header does not match the file extension, returning a descriptive error.
- **FR-010**: When receiving a recorded audio payload from the Renderer, the system MUST write it to the audio vault directory with a unique filename.
- **FR-011**: When importing an external file, the system MUST copy the file into the audio vault directory rather than moving or linking it, preserving the original file.
- **FR-012**: The system MUST generate unique filenames for all ingested audio files to prevent collisions and overwrites.
- **FR-013**: When an audio note is deleted from the database, the system MUST also remove the corresponding physical file from disk.
- **FR-014**: If the physical file is already missing when a database deletion occurs, the system MUST complete the database deletion successfully and log the missing-file condition without surfacing an error to the user.
- **FR-015**: If a disk write fails (e.g., full disk, permission error), the system MUST NOT create a corresponding database entry, ensuring atomicity between file and record creation.
- **FR-016**: The system MUST recreate the audio vault directory if it is found missing during any audio write operation, not only at startup.

### Key Entities

- **Audio File**: A physical audio recording on disk, identified by a unique filename within the audio vault directory. Characterized by its format (extension), binary content, and file size.
- **Audio Vault Directory**: The single designated storage location for all audio files managed by the application. Automatically provisioned and verified by the system.
- **File Path Reference**: A relative path string stored in the database that links an `AudioNote` record to its corresponding physical file. The Main process resolves this against the audio vault base path at runtime.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of audio files ingested through either input channel are stored in the audio vault directory with correct content matching the source.
- **SC-002**: 100% of database entries for audio notes contain relative file paths that resolve to existing files on disk.
- **SC-003**: The audio vault directory is present and writable within 1 second of application launch on a standard system.
- **SC-004**: 100% of files with mismatched headers and extensions are rejected before any data is written.
- **SC-005**: When an audio note is deleted, the corresponding file is removed from disk in 100% of cases where the file exists.
- **SC-006**: Zero orphaned database entries exist after a failed write operation (atomicity between disk and database).
- **SC-007**: The system correctly accepts all 5 supported formats (.wav, .mp3, .m4a, .ogg, .flac) and rejects unsupported formats.

## Assumptions

- The application runs with sufficient file system permissions to create directories and write files within the user data path.
- Internal recording produces audio in one of the 5 accepted formats (typically `.wav` for raw PCM captures).
- The Renderer process serializes recorded audio into a binary payload before sending it over IPC to the Main process.
- Duration extraction and waveform analysis are handled by the Renderer via the Web Audio API before the payload reaches the Main process (as established in the constitution).
- The audio vault directory path is deterministic and consistent across launches (derived from the application's user data path).
- Spec 001 (Data Model) is fully implemented: `AudioNote` records with `file_path` fields exist in the database.
- File uniqueness is achieved through UUID-based naming or equivalent collision-resistant identifiers.
- No cloud sync or network storage is in scope; all operations are local.
