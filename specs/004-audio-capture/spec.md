# Feature Specification: Audio Capture & Real-Time Recording

**Feature Branch**: `004-audio-capture`

**Created**: 2026-09-03

**Status**: Draft

**Input**: User description: "This spec is about audio capturing and real time recording. This allows musicians to record ideas using the input devices (built-in microphone, external audio interface, etc.). We should have input device enumeration, selection, and hot-plugging change detection. I also want to have a volume level metering, we will use it in the UI."

## Clarifications

### Session 2026-09-03

- Q: Should the application support loading VST/AU audio effect plugins to process audio during recording, use built-in Web Audio effects, or defer all effects? → A: No effects processing in this spec — keep focused on clean capture only; defer all effects (VST and built-in) to a separate future spec.
- Q: Does "modify the volume level" mean adjustable input gain affecting the recorded audio, monitoring volume only, or both? → A: Recording input gain — an adjustable gain slider that scales the captured audio before it is written to disk (affects the saved file). Monitoring volume is out of scope.
- Q: Should the volume meter show post-gain level only, or two meters (pre-gain and post-gain)? → A: Two meters — pre-gain (raw input) and post-gain (what gets recorded) — so the user can distinguish input issues from gain issues.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record an Audio Idea (Priority: P1)

A musician opens Vault, presses a record button, captures their musical idea through the active input device, and stops recording. The captured audio is immediately persisted as a new audio note in the system, ready for playback, tagging, and organizing.

**Why this priority**: Recording is the core value proposition of this feature. Without the ability to capture audio, no other capability (device selection, metering) is meaningful.

**Independent Test**: Can be fully tested by clicking record, singing/playing into the default input device, pressing stop, and verifying the resulting audio note appears in the note list with correct duration and file path.

**Acceptance Scenarios**:

1. **Given** the application is open and an input device is available, **When** the user presses the record button, **Then** audio capture begins immediately from the active input device.
2. **Given** recording is in progress, **When** the user presses the stop button, **Then** recording stops, the captured audio is persisted to disk, and a new audio note is created in the database with the correct duration, file path, and creation timestamp.
3. **Given** recording is in progress, **When** elapsed time advances, **Then** the user sees a live elapsed-time indicator showing the current recording duration.
4. **Given** recording has completed and the note has been created, **When** the user views the note list, **Then** the newly recorded note appears at the top (most recent first) with an auto-generated title.

---

### User Story 2 - Select an Input Device (Priority: P2)

A musician with multiple audio input devices (e.g., a built-in laptop microphone and an external USB audio interface) wants to choose which device to record from. The application lists all available input devices and allows the user to select one before or between recordings.

**Why this priority**: Musicians commonly use external audio interfaces for higher quality. Without device selection, the feature is limited to whatever the system default happens to be.

**Independent Test**: Can be fully tested by connecting two or more input devices, opening the device selector, verifying all devices are listed with human-readable names, selecting a non-default device, and confirming subsequent recording captures audio from the selected device.

**Acceptance Scenarios**:

1. **Given** the application is open and the system has at least one audio input device, **When** the user opens the input device selector, **Then** all available audio input devices are listed with human-readable labels.
2. **Given** the device selector is displayed, **When** the user selects a different input device, **Then** that device becomes the active recording source for future recordings.
3. **Given** no audio input device is available, **When** the user attempts to access the device selector, **Then** a clear message is displayed indicating no input devices are detected.

---

### User Story 3 - Hot-Plug Device Change Detection (Priority: P3)

A musician plugs in or unplugs an external audio interface while the application is running. The application automatically detects the change and updates the available device list in real time without requiring a restart or manual refresh.

**Why this priority**: Hot-plugging is a natural part of a musician's workflow (connecting interfaces, headsets, etc.). Reacting to device changes without restarts provides a seamless experience, but it is supplemental to core recording and device selection.

**Independent Test**: Can be fully tested by opening the application, plugging in a new audio input device, and verifying it appears in the device list within a few seconds without user action. Similarly, unplugging a device removes it from the list.

**Acceptance Scenarios**:

1. **Given** the application is running and the device list is visible, **When** the user connects a new audio input device, **Then** the new device appears in the device list within 3 seconds without any manual refresh.
2. **Given** the application is running and the device list is visible, **When** the user disconnects an audio input device, **Then** the removed device disappears from the device list within 3 seconds.
3. **Given** the currently active input device is disconnected during an idle state (not recording), **When** the device is removed, **Then** the application falls back to the system default input device and notifies the user of the change.
4. **Given** the currently active input device is disconnected during an active recording, **When** the device is removed, **Then** the recording is stopped gracefully, the partial audio captured so far is persisted as a valid note, and the user is notified that the recording was interrupted due to device disconnection.

---

### User Story 4 - Volume Level Metering & Input Gain Control (Priority: P4)

A musician wants to see a real-time visual indicator of the input audio signal level while idle (pre-recording monitoring) and during recording. They also want to adjust the recording input gain via a slider so the captured audio is at the right loudness — not too quiet, not clipping. This helps them position their instrument or microphone correctly and fine-tune the recording level before and during capture.

**Why this priority**: Volume metering and gain control provide critical visual and interactive feedback that improves recording quality and user confidence. They depend on an active input device stream, making them a natural complement to recording and device selection rather than a prerequisite.

**Independent Test**: Can be fully tested by selecting an input device, observing the volume meter responding to ambient sound, adjusting the gain slider to increase or decrease the captured level, recording a short clip, and verifying the saved audio reflects the gain adjustment.

**Acceptance Scenarios**:

1. **Given** an input device is selected and the user is on the recording screen, **When** sound is detected by the input device, **Then** two volume level meters are displayed: one showing the raw pre-gain input level and one showing the post-gain level.
2. **Given** the volume meters are active, **When** the post-gain signal approaches the maximum level (clipping threshold), **Then** the post-gain meter provides a visual warning (e.g., color change to red) indicating potential clipping.
3. **Given** the volume meters are active, **When** the environment is silent, **Then** both meters show a near-zero or minimum level.
4. **Given** a recording is in progress, **When** the user observes the volume meters, **Then** both meters continue to display real-time input levels throughout the recording session.
5. **Given** the user adjusts the input gain slider, **When** a recording is subsequently made, **Then** the saved audio file reflects the adjusted gain level (louder or quieter than the raw input signal).
6. **Given** the user sets the gain slider to its default (unity) position, **When** a recording is made, **Then** the saved audio is identical in loudness to the raw input signal.

---

### Edge Cases

- What happens when microphone permission is denied by the operating system? The application must display a clear, actionable message guiding the user to grant microphone access in system settings.
- What happens when a recording fails mid-capture due to a disk write error? The system must attempt to save whatever audio has been captured up to that point and notify the user of the partial save.
- What happens when the user starts a recording but no audio input device is detected? The record action must be disabled or blocked with a clear message explaining that no input device is available.
- What happens when the system has only one input device and it is disconnected? The application falls back to a "no device available" state and disables recording until a device is reconnected.
- What happens if the user rapidly starts and stops recording in quick succession? Each start/stop cycle must produce a distinct, valid audio note without data corruption or dropped recordings.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST capture audio in real time from the active input device when the user initiates recording.
- **FR-002**: System MUST stop audio capture and persist the recorded audio as a file on disk when the user stops recording.
- **FR-003**: System MUST create a new audio note in the database upon recording completion, with auto-generated title, file path, duration, and creation timestamp.
- **FR-004**: System MUST display the elapsed recording time to the user during an active recording session.
- **FR-005**: System MUST enumerate all available audio input devices and present them with human-readable labels.
- **FR-006**: System MUST allow the user to select an active input device from the enumerated list.
- **FR-007**: System MUST persist the user's selected input device preference so it is remembered across application launches.
- **FR-008**: System MUST detect audio input device connection and disconnection events in real time and update the device list within 3 seconds.
- **FR-009**: System MUST fall back to the system default input device when the currently active device is disconnected while not recording.
- **FR-010**: System MUST gracefully stop recording and persist the partial audio when the active device is disconnected during an active recording.
- **FR-011**: System MUST provide two real-time volume level meters: one showing the raw pre-gain input level and one showing the post-gain signal level (what will be recorded).
- **FR-012**: System MUST indicate when the input signal level approaches clipping threshold.
- **FR-013**: System MUST request microphone access permission from the operating system and handle denial gracefully with an actionable user message.
- **FR-014**: System MUST disable recording controls when no audio input device is available.
- **FR-015**: System MUST handle rapid consecutive start/stop recording cycles without data corruption, producing a distinct valid audio note for each completed cycle.
- **FR-016**: System MUST notify the user when a device change occurs that affects their active selection (disconnection, fallback).
- **FR-017**: System MUST provide an adjustable input gain control that scales the captured audio signal before it is written to disk.
- **FR-018**: System MUST default the input gain to unity (no amplification or attenuation) when no user adjustment has been made.
- **FR-019**: System MUST persist the user's gain setting so it is remembered across application launches.

### Key Entities

- **Input Device**: Represents an available audio input device on the system. Attributes: unique device identifier, human-readable label, active/selected status.
- **Recording Session**: Represents an in-progress audio capture. Attributes: start time, elapsed duration, active input device reference, applied gain level, audio data buffer, recording state (idle, recording, stopping).
- **Volume Level**: Represents real-time audio signal measurements from the input device. Attributes: pre-gain level (normalized raw input value), post-gain level (normalized value after gain is applied), peak level, clipping status.
- **Input Gain**: Represents the user's adjustable gain setting. Attributes: gain value (normalized, default unity), persisted preference.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can start a recording, capture audio, and stop recording to produce a playable audio note in under 5 seconds of interaction time (press record → press stop → note exists).
- **SC-002**: All connected audio input devices are listed within 2 seconds of opening the device selector.
- **SC-003**: Newly connected or disconnected devices are reflected in the device list within 3 seconds of the hardware change.
- **SC-004**: Both volume level meters (pre-gain and post-gain) update at a minimum of 15 frames per second during active monitoring and recording, providing smooth visual feedback.
- **SC-005**: Partial recordings due to device disconnection preserve at least 90% of the audio captured before the disconnection event.
- **SC-006**: Users who have denied microphone permission see an actionable guidance message within 1 second of attempting to record.

## Assumptions

- The user's operating system supports audio input device enumeration and microphone access permission management (macOS, Windows, Linux).
- The application uses the browser-standard `navigator.mediaDevices.getUserMedia` and `navigator.mediaDevices.enumerateDevices` APIs available within the Electron Renderer process for audio capture and device enumeration (per the constitution's Process Separation and Audio Processing Delegation principles).
- Audio is captured in a single supported format (WAV) to minimize encoding complexity at capture time; format conversion is out of scope for this spec.
- Volume metering is derived from the raw audio input stream in the Renderer process using the Web Audio API (AnalyserNode) and does not require Main process involvement.
- This spec covers the audio capture pipeline and device management layer only. UI component design, layout, and visual styling are out of scope and will be addressed in a future Renderer/UI specification.
- The existing `AudioStorageService` (Spec 002) and IPC bridge (Spec 003) will be used for persisting recorded audio and creating database records.
- The user's selected device preference is stored locally (e.g., in the SQLite database or app settings) and is best-effort — if the stored device is no longer available at launch, the system falls back to the default.
