# Feature Specification: Fix Audio Playback CSP and Real Duration Display

**Feature Branch**: `009-fix-playback-duration`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Let's fix some things. When I try to play some audio i get these errors in console: 'localhost/:1 Refused to load media from 'vault-audio://stream/recordings/a48c2271-0be3-4813-876a-c57b7a04ff4b.m4a' because it violates the following Content Security Policy directive: 'default-src 'self''. Note that 'media-src' was not explicitly set, so 'default-src' is used as a fallback.' and 'Audio play error: NotSupportedError: Failed to load because no supported source was found.' We need to fix this. Also, the idea's duration is shown as 00:00 but that's not true. Show the real audio duration on each idea"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unblocked Audio Playback Across All Supported Formats (Priority: P1)

A musician browsing their catalog clicks the play button on any audio idea (including `.m4a`, `.mp3`, `.wav`, `.ogg`, `.flac`). The application's security policy permits media streams from the local audio vault, and the audio immediately plays through their speakers or headphones without throwing Content Security Policy violations or source errors.

**Why this priority**: Playing audio is the foundational value proposition of the playback feature. If the security policy blocks media loading or reports unsupported source errors, playback is completely broken.

**Independent Test**: Can be tested independently by importing or selecting audio files in `.m4a`, `.wav`, and `.mp3` formats, clicking play on each row, and verifying that audio plays clearly with zero security policy or media source error logs in the developer console.

**Acceptance Scenarios**:

1. **Given** an audio idea with an `.m4a` file in the ideas table, **When** the user clicks the row play button, **Then** the audio plays smoothly without any security policy violation or unsupported source error.
2. **Given** an audio idea with a `.wav`, `.mp3`, `.ogg`, or `.flac` file, **When** the user initiates playback, **Then** the media stream loads and plays without console errors.
3. **Given** the application is running in development or production mode, **When** audio streams are requested via the custom audio scheme, **Then** the browser media engine permits the stream under the declared security policy.

---

### User Story 2 - Accurate Audio Duration Display for All Ideas (Priority: P1)

A musician views their list of ideas in the ideas table. In the "Duration" column, each row displays the actual length of the audio recording (e.g., `0:45`, `2:14`, `1:03`) rather than `0:00`. For any ideas previously cataloged with a missing or zero duration, the application detects and displays the true audio duration and updates the stored record so subsequent launches retain the accurate duration.

**Why this priority**: Knowing the exact length of an idea or take is vital for musicians when organizing, arranging, and reviewing voice memos. Showing `00:00` misleads the user and breaks scrubber time bar synchronization.

**Independent Test**: Can be tested independently by checking existing ideas that previously displayed `0:00`, verifying that their actual duration is calculated and displayed in the Duration column, and verifying that newly imported audio files immediately register and display their real duration.

**Acceptance Scenarios**:

1. **Given** an idea previously stored with `00:00` duration, **When** the user views the ideas table or plays the idea, **Then** the duration column updates from `0:00` to the actual length of the audio track.
2. **Given** a user imports a new audio file (e.g., a 30-second `.m4a` file), **When** the import completes, **Then** the idea row displays `0:30` in the Duration column instead of `0:00`.
3. **Given** an audio idea with a newly resolved duration, **When** the application is restarted, **Then** the accurate duration is retained from storage and displays immediately upon launch.
4. **Given** an audio idea is playing, **When** observing the top-center time bar, **Then** the total duration counter on the right displays the actual track duration matching the ideas table.

---

### Edge Cases

- **Corrupted or Unreadable Audio File**: If an audio file cannot have its duration extracted because it is truncated or invalid, the system displays a clear fallback indicator without crashing the table or blocking other ideas.
- **Variable Bitrate (VBR) Audio**: Duration extraction for compressed formats (like `.m4a` or `.mp3` with VBR) accurately resolves the full duration rather than estimating from initial packet headers.
- **Audio Idea With Duration 0 Played by User**: When the user clicks play on an idea that has a stored duration of 0, the audio engine dynamically retrieves the true duration from the media stream metadata upon load, updates the table row, and corrects the database record.
- **Large Audio File Imports**: Batch importing multiple files extracts and displays the duration for each individual file without blocking the user interface.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application security policy MUST explicitly permit media loading from the application origin, the custom audio protocol scheme (`vault-audio:`), and binary object URLs (`blob:`).
- **FR-002**: The custom audio scheme registration MUST bypass content security policy restrictions to ensure seamless streaming in Chromium media elements.
- **FR-003**: The audio player MUST successfully load and play all supported audio formats (`.wav`, `.mp3`, `.m4a`, `.ogg`, `.flac`) without generating `NotSupportedError` or media source errors.
- **FR-004**: During audio import, the system MUST extract the real duration of the incoming audio file and store the accurate duration value in seconds.
- **FR-005**: The ideas table Duration column MUST display the formatted actual duration (`m:ss` or `h:mm:ss`) for every audio idea.
- **FR-006**: For any existing audio ideas whose duration is recorded as zero or invalid, the system MUST automatically resolve the true duration and persist the updated duration to storage.
- **FR-007**: The top-center playback time bar MUST display the real total duration of the active audio idea on the right side of the scrubber.

### Key Entities

- **Audio Idea**: Represents a cataloged musical recording, including its unique identifier, title, relative audio file path, and actual audio duration in seconds.
- **Security Policy**: The application configuration governing allowed sources for scripts, styles, and media resources.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of playback attempts across all supported formats (`.m4a`, `.mp3`, `.wav`, `.ogg`, `.flac`) load and play with zero Content Security Policy errors and zero `NotSupportedError` logs.
- **SC-002**: 100% of newly imported audio files display their true duration in the Duration column with 0% resulting in `0:00` (unless the audio file itself is truly 0 seconds).
- **SC-003**: 100% of existing audio ideas with `00:00` duration resolve and display their actual duration within 1 second of being displayed or played.
- **SC-004**: Stored durations match the physical audio file duration within an accuracy tolerance of ±1 second.

## Assumptions

- Audio files in supported formats (`.wav`, `.mp3`, `.m4a`, `.ogg`, `.flac`) contain valid audio streams decodable by the Chromium desktop runtime.
- The application environment allows updating audio note metadata when a missing duration is resolved.
- Media streams originating from the local audio vault via `vault-audio://` are trusted internal resources.
