# Feature Specification: Audio Ideas Import

**Feature Branch**: `006-import-audio-ideas`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "The next spec is about importing audio ideas to the program. I want to be able to import my audio ideas via drag and drop. There should also be an option to import my files in the option bar. When I import the data i want to see a loading circle showing the load percentage. The program should make a copy from the original audios. Original audios shoud not be removed."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drag and Drop Audio Import (Priority: P1)

A musician has existing audio recordings (such as voice memos, demo snippets, or riff drafts) stored in folders on their computer. They drag one or more audio files directly from their operating system file manager and drop them onto the Vault application window. The application accepts the files, displays visual drop feedback, imports each audio file into the local vault, creates corresponding idea records, and displays them immediately in the active ideas table without altering or deleting the original source files.

**Why this priority**: Drag and drop is the most direct and frictionless way for musicians to bring existing ideas and sketches into Vault. It establishes the primary user journey for bulk and quick ingestion.

**Independent Test**: Can be tested independently by dragging a supported audio file (e.g., a `.wav` or `.mp3` file) from the file system onto the application window and verifying that the file is copied into the vault, a new idea row appears in the Active Ideas table with the audio's name and duration, and the original file remains unchanged at its original source path.

**Acceptance Scenarios**:

1. **Given** a musician is viewing the Vault application, **When** they drag a supported audio file over the window, **Then** the interface displays a clear visual drop target indicating the window is ready to receive audio files.
2. **Given** a musician drops a single supported audio file (`.wav`, `.mp3`, `.m4a`, `.ogg`, or `.flac`) onto the drop target, **Then** the application copies the file to the internal audio storage, extracts duration, registers the idea with the file's base name as its title, and displays it in the Active Ideas table.
3. **Given** a musician drops multiple supported audio files at once, **Then** the application queues and imports each file, displaying all new ideas in the Active Ideas table once imported.
4. **Given** any audio file is imported via drag and drop, **When** the import finishes, **Then** the original source audio file remains intact at its source location with identical contents and timestamps.
5. **Given** a musician drops an unsupported file type (e.g., `.txt`, `.pdf`, `.mp4`) or a corrupted audio file, **Then** the application rejects the invalid file with an informative error message and leaves existing ideas unaffected.

---

### User Story 2 - Import via Option Bar (Priority: P2)

A musician prefers using standard menu controls or keyboard-accessible triggers rather than drag and drop. They click an "Import" button located in the application header/option bar. This opens a native file selection dialog configured to filter for supported audio formats. The user chooses one or multiple files, confirms selection, and the application imports them identically to the drag-and-drop workflow.

**Why this priority**: Provides an accessible, conventional alternative to drag and drop for users who prefer dialog navigation, assistive tech, or cannot easily arrange side-by-side windows.

**Independent Test**: Can be tested independently by clicking the "Import" button in the header bar, selecting one or more audio files through the file picker dialog, confirming, and verifying that the selected audio files are copied and registered in the ideas table while preserving original source files.

**Acceptance Scenarios**:

1. **Given** the user is viewing the application header, **When** they look at the option bar / header, **Then** a clearly labeled "Import" button with an import icon is visible.
2. **Given** the user clicks the "Import" button, **When** the dialog opens, **Then** a native file picker is presented allowing multi-file selection restricted to supported audio formats (`.wav`, `.mp3`, `.m4a`, `.ogg`, `.flac`).
3. **Given** the user selects one or more audio files in the file picker and confirms, **Then** the selected files are copied into the internal storage and registered in the catalog.
4. **Given** the user cancels the file selection dialog, **Then** no changes occur and no errors are shown.

---

### User Story 3 - Visual Progress with Loading Percentage Circle (Priority: P3)

When importing audio files (especially larger files or batches of multiple files), the musician wants immediate feedback that their files are being processed. A circular loading indicator displays the real-time progress percentage (0% to 100%) during the copy and indexing operation, smoothly closing once the operation is complete.

**Why this priority**: Prevents user uncertainty and duplicate import attempts during large file operations, giving confidence that the application is actively processing their data.

**Independent Test**: Can be tested independently by importing a large audio file or a batch of files and verifying that a circular progress indicator appears, accurately reflects percentage completion from 0% to 100%, and disappears upon completion.

**Acceptance Scenarios**:

1. **Given** an import operation is initiated (via drag and drop or option bar), **When** file copying and processing begins, **Then** an overlay or modal displays a circular progress indicator showing the numeric completion percentage (e.g., `0%` to `100%`).
2. **Given** multiple files are being imported in a batch, **When** progress updates, **Then** the circular indicator reflects the overall progress across the entire batch.
3. **Given** the import completes successfully, **When** progress reaches 100%, **Then** the progress indicator cleanly dismisses and a subtle completion notification or confirmation is presented.
4. **Given** an error occurs on one file during a multi-file import, **When** the operation finishes, **Then** successfully processed files are preserved in the catalog and an error summary identifies which file failed and why.

---

### Edge Cases

- **Non-audio or unsupported files dropped**: If a user drops unsupported files (e.g., image, text, video), the application must reject them without crashing, notifying the user which file formats are supported.
- **Mixed batches**: If a user drops a mix of valid audio files and invalid files, the system must process the valid audio files and alert the user about the skipped invalid files.
- **Large audio files**: Very long or large audio files (e.g., 200MB+ WAV files) must stream or copy with responsive progress updates without freezing the user interface.
- **Duplicate filenames**: If an imported file has the same filename as an existing note, the system must generate a unique internal storage path and append or retain the title without overwriting existing files or database records.
- **Original file permissions**: If the original source file has read-only permissions, the system must successfully read and copy the file into the internal storage without attempting to modify the source.
- **Premature window closure / cancel**: If the application window is closed during an import, partial files must be cleaned up safely on next launch.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow users to import audio files by dragging and dropping them anywhere onto the application window or designated drop zone.
- **FR-002**: The system MUST display clear visual feedback (such as an overlay or boundary highlight) while audio files are being dragged over the application window.
- **FR-003**: The system MUST provide an "Import" button in the option bar / header that opens a native file picker dialog.
- **FR-004**: The native file picker dialog MUST allow multi-file selection and filter for supported audio extensions (`.wav`, `.mp3`, `.m4a`, `.ogg`, `.flac`).
- **FR-005**: The system MUST support importing the following audio formats: WAV, MP3, M4A, OGG, and FLAC.
- **FR-006**: The system MUST copy the imported audio files into the internal application storage directory with unique identifiers to avoid collisions.
- **FR-007**: The system MUST NOT delete, move, rename, or alter the original source audio files under any circumstances.
- **FR-008**: The system MUST validate file format and header integrity prior to saving the audio file into the internal storage.
- **FR-009**: The system MUST display a circular loading indicator showing the real-time progress percentage (0% to 100%) while files are being copied and processed.
- **FR-010**: For multi-file batch imports, the circular loading indicator MUST represent cumulative progress across all files in the batch.
- **FR-011**: The system MUST extract the audio duration for each imported file and store it with the created idea record.
- **FR-012**: The system MUST default the imported note's title to the original file's name (excluding the file extension), trimming excess whitespace.
- **FR-013**: The system MUST register each imported audio idea in the database with `is_used = 0` (Active state).
- **FR-014**: The active ideas table MUST immediately refresh to display the newly imported ideas upon completion of the import.
- **FR-015**: In the event of an import failure (corrupt file, unreadable disk, header mismatch), the system MUST display an error message explaining the failure without interrupting successfully imported files in the same batch.

### Key Entities

- **ImportJob**: Represents an in-flight import operation consisting of one or more files, tracking total files, processed files, current percentage, and any encountered errors.
- **AudioNote**: The resulting musical idea record created in the database containing title, relative storage path, duration, `is_used = 0`, and creation timestamp.
- **SourceAudioFile**: The external file selected by the user, read as a stream or buffer, verified, and copied without modifying the source.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can import a single audio file via drag-and-drop in under 3 seconds from drop to display in the table (for typical audio files under 50MB).
- **SC-002**: 100% of original source audio files remain untouched, identical in checksum and file attributes, after import.
- **SC-003**: The circular loading progress indicator updates smoothly during import operations, displaying numeric percentages from 0% to 100%.
- **SC-004**: Users can initiate an import from both drag-and-drop and the header option bar with a maximum of 2 clicks.
- **SC-005**: When importing a batch of 10 supported audio files, all 10 are cataloged in the Active Ideas table with accurate durations and titles without user intervention.
- **SC-006**: Zero application crashes occur when users drop non-audio files or corrupt files; clear rejection feedback is shown within 1 second.

---

## Assumptions

- The existing internal audio storage service correctly handles header validation, unique UUID naming, and safe file copying without altering source files.
- Audio duration extraction will occur either in the Renderer using Web Audio decoding or via lightweight header metadata inspection in the Main process.
- Native open file dialogs will be mediated through the desktop window bridge via secure IPC.
- All newly imported audio notes start in the active (unused) ideas list (`is_used = 0`).
- Metadata fields other than title and duration (BPM, musical key, authors, song section, notes, instruments) remain null/empty upon initial import and can be edited later.
