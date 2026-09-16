# Feature Specification: Bottom Recording Dock and Audio Settings

**Feature Branch**: `014-recording-dock`

**Created**: 2026-09-15

**Status**: Draft

**Input**: User description: "In this spec we’ll add the recording section at the bottom of the app. This section should have an input volume meter at the left, a record button in the middle and an output volume meter at the right. For the input volume meter I should also have a knob to either increase or decrease the input gain. This should be the same for the output volume meter. Ther recording button should be a red circle and when clicked, it should morph into a red square. After recording an idea then a modal should open asking for the values for the idea (name, key, etc.). These parameters are optional. If name is null then the app should generate a default name “Idea-XX” where XX is the Idea number. There should also be a gear icon for settings. Inside settings i should be able to setup my input and output device and channel input if aviable."

## Clarifications

### Session 2026-09-15

- Q: How should the system handle the Post-Recording Metadata Modal if the user clicks the background backdrop or presses the Escape key? → A: Explicit action required — disable backdrop click and Escape dismissal so the user must intentionally click either "Save" (saves with entered or default values) or "Discard" (prompts confirmation to avoid accidental loss of takes).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record Audio Idea and Populate Metadata Modal (Priority: P1)

Musicians and songwriters need a prominent, persistent recording dock anchored at the bottom of the application to quickly capture musical ideas as soon as inspiration strikes. Clicking a prominent red circle button starts immediate audio recording and morphs the button into a red square indicating active recording. Clicking the red square stops the recording and immediately presents a metadata modal where the user can enter optional musical attributes (Title, Musical Key, BPM, Authors, Song Section, Instruments, and Notes). If the user leaves the title blank, the system automatically assigns a standardized sequential name ("Idea-XX", matching the next idea number in the catalog). Submitting the modal saves the recorded idea directly to the catalog table.

**Why this priority**: Core value of the application. Musicians must be able to record spontaneously without navigating away from their catalog and capture optional metadata immediately after playing.

**Independent Test**: Can be tested by clicking the red circle record button, recording audio for a few seconds, clicking the red square stop button, submitting the metadata dialog (both with custom fields and with empty fields), and verifying that a new playable idea appears in the catalog with the correct metadata or default title.

**Acceptance Scenarios**:

1. **Given** the user is viewing the application, **When** they look at the bottom dock, **Then** they see a centered record button styled as a red circular icon indicating readiness to record.
2. **Given** the system is idle, **When** the user clicks the red record button, **Then** audio capture begins immediately and the record button morphs into a red square icon.
3. **Given** the system is actively recording, **When** the user clicks the red square stop button, **Then** recording finishes immediately and a metadata entry modal automatically opens.
4. **Given** the metadata modal is displayed, **When** the user leaves the name field empty and confirms the dialog, **Then** the idea is saved with the auto-generated title "Idea-XX" (where XX is the sequential idea number) and empty optional fields.
5. **Given** the metadata modal is displayed, **When** the user fills in optional fields (e.g. title "Verse Acoustic", Key "G Major", BPM 120, Authors "Alice, Bob", Section "Verse", Instruments "Acoustic Guitar", Notes "Fingerpicking riff") and confirms, **Then** the idea is saved with all specified metadata and appears at the top of the ideas table.

---

### User Story 2 - Real-Time Dual Metering and Gain/Volume Knobs (Priority: P1)

Musicians need continuous visual feedback of audio levels to ensure their microphone is receiving signal without clipping or distortion, and to monitor playback output volume. The left side of the bottom dock features an input volume meter and an interactive input gain knob to adjust recording sensitivity. The right side of the bottom dock features an output volume meter and an interactive output volume knob to adjust monitor and playback loudness.

**Why this priority**: Audio recording without visual metering frequently leads to unusable takes due to clipping distortion or inaudibly low microphone levels. Dedicated knobs give immediate tactile control over sound levels without leaving the dock.

**Independent Test**: Can be tested by making sound into the microphone and watching the left input meter respond in real time, turning the input gain knob to verify signal amplification changes, and playing an existing idea to observe the right output meter respond while turning the output volume knob to verify master loudness adjustments.

**Acceptance Scenarios**:

1. **Given** the bottom dock is visible, **When** an audio input device is active, **Then** the left volume meter displays continuous, smooth real-time signal activity reflecting incoming audio levels.
2. **Given** the input volume meter on the left, **When** the user drags or scrolls the adjacent input gain knob, **Then** the recording gain increases or decreases smoothly, and the adjusted gain is reflected in incoming signal levels and recorded loudness.
3. **Given** any audio track is playing back in the application, **When** audio output is generated, **Then** the right volume meter displays real-time signal activity reflecting output sound levels.
4. **Given** the output volume meter on the right, **When** the user drags or scrolls the adjacent output volume knob, **Then** overall audio playback loudness increases or decreases accordingly.
5. **Given** either volume meter receives excessive signal reaching maximum capacity (clipping), **Then** a visible clipping indicator illuminates to warn the user to reduce gain.

---

### User Story 3 - Audio Hardware Settings & Channel Selection (Priority: P2)

Musicians use diverse audio interfaces, dedicated USB microphones, built-in laptop mics, and multi-channel input devices. The dock provides a settings gear icon that opens an audio settings dialog where the user can view, select, and configure their active input device, output device, and input channel (such as Mono Channel 1, Mono Channel 2, or Stereo) whenever supported by the audio hardware.

**Why this priority**: Musicians frequently plug in external USB microphones or multi-channel audio interfaces. Giving explicit control over devices and channel routing guarantees captured sound comes from the desired physical instrument or microphone.

**Independent Test**: Can be tested by clicking the gear icon in the bottom dock, opening the settings dialog, changing the active input and output devices, selecting a specific input channel, closing the dialog, and verifying that subsequent recordings capture sound from the chosen device and channel.

**Acceptance Scenarios**:

1. **Given** the bottom recording dock, **When** the user locates the dock controls, **Then** an accessible settings gear icon button is visible.
2. **Given** the settings gear icon is visible, **When** the user clicks it, **Then** an Audio Settings modal opens.
3. **Given** the Audio Settings modal is open, **When** the user inspects device options, **Then** all detected audio input devices and audio output devices are listed in clear selector dropdowns with current selections highlighted.
4. **Given** the selected input device supports multi-channel routing, **When** the user inspects channel configuration options, **Then** available channel choices (e.g., Stereo, Channel 1 / Left, Channel 2 / Right) are displayed for selection.
5. **Given** the user selects a new input device, output device, or input channel, **When** the settings are applied or closed, **Then** the application immediately routes audio through the newly selected hardware configuration and remembers these preferences across sessions.

---

### User Story 4 - Discard and Safeguard Recording Flows (Priority: P3)

When a musician records a take they immediately know is a mistake or unusable, they must be able to cleanly discard the take from the metadata modal without cluttering their catalog or storage with unwanted files.

**Why this priority**: Prevents catalog bloat and saves storage space by letting users abort failed takes immediately rather than saving and manually deleting them later.

**Independent Test**: Can be tested by recording a short take, clicking "Discard" on the metadata modal, confirming the discard prompt, and verifying that no new idea is created in the catalog and the system resets to idle.

**Acceptance Scenarios**:

1. **Given** the post-recording metadata modal is open, **When** the user clicks an explicit "Discard" button, **Then** a brief confirmation prompt asks if they want to discard the recording without saving.
2. **Given** the user confirms discarding the recording, **Then** the modal closes, the captured audio take is permanently eliminated, no catalog idea is registered, and the recording button resets to the red circle idle state.
3. **Given** the user cancels the discard confirmation, **Then** they return to the metadata modal with their entered draft values preserved.

---

### Edge Cases

- **Zero Audio Devices Detected**: If no microphone or audio input hardware is connected, the record button displays a disabled visual state with an explanatory tooltip ("No microphone detected"), preventing unhandled recording attempts.
- **Device Disconnection Mid-Recording**: If an external USB audio interface is disconnected while recording is active, the recording gracefully finalizes with whatever audio was captured up to that point, surfaces a notification, and opens the metadata modal so the take can still be preserved or discarded.
- **Accidental Close / Navigation During Recording**: The application prohibits closing the window or navigating away during an active recording without an explicit warning prompt to avoid losing live takes.
- **Extremely Short / Accidental Clicks**: If a recording is stopped within less than 0.5 seconds of starting, the system prompts the user or detects an empty take and asks if they want to discard it, avoiding 0-second blank entries.
- **Volume Meter Inactivity While Idle**: When the app is running but the user is not actively recording or monitoring, input level meters update efficiently without creating high CPU consumption.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST render a dedicated recording dock anchored persistently at the bottom of the main application window.
- **FR-002**: The recording dock MUST feature a centrally positioned Record button that displays as a solid red circle in the idle state.
- **FR-003**: When clicked in the idle state, the Record button MUST immediately start audio capture and visually morph into a solid red square.
- **FR-004**: While actively recording, the system MUST display an elapsed recording time counter adjacent to the Record button.
- **FR-005**: When clicked while recording, the Record button (red square) MUST immediately stop recording and open the Post-Recording Metadata Modal.
- **FR-006**: The Post-Recording Metadata Modal MUST provide input fields for Title, Musical Key, BPM, Authors, Song Section, Instruments, and Notes.
- **FR-007**: All metadata fields in the Post-Recording Metadata Modal MUST be optional.
- **FR-008**: If the Title field is submitted empty or whitespace-only, the system MUST generate and assign a default title formatted as "Idea-XX", where XX corresponds to the next sequential idea number.
- **FR-009**: Submitting the Post-Recording Metadata Modal with "Save" MUST persist the audio recording to internal storage, register the new idea in the catalog with its specified or generated metadata, and refresh the catalog view.
- **FR-010**: The Post-Recording Metadata Modal MUST require explicit user action (disabling backdrop click and Escape key dismissal) and provide an explicit "Discard" action that cancels the save, deletes temporary audio buffers, and leaves the catalog untouched after user confirmation.
- **FR-011**: The left section of the recording dock MUST feature a real-time input volume meter displaying current microphone signal levels.
- **FR-012**: The left section of the recording dock MUST include an interactive rotary knob to adjust input recording gain.
- **FR-013**: The right section of the recording dock MUST feature a real-time output volume meter displaying current audio playback levels.
- **FR-014**: The right section of the recording dock MUST include an interactive rotary knob to adjust master output playback volume.
- **FR-015**: Both volume meters MUST incorporate a visual clipping indicator that highlights when audio signal levels reach or exceed 0 dB (distortion threshold).
- **FR-016**: The recording dock MUST feature a settings button represented by a gear icon.
- **FR-017**: Clicking the settings gear button MUST open an Audio Settings dialog.
- **FR-018**: The Audio Settings dialog MUST allow users to select from all available audio input devices detected by the operating system.
- **FR-019**: The Audio Settings dialog MUST allow users to select from all available audio output devices detected by the operating system.
- **FR-020**: When the active input device supports multiple input channels, the Audio Settings dialog MUST provide a channel selector allowing the user to select Stereo or specific mono input channels.
- **FR-021**: Selected audio hardware devices and channel configurations MUST persist across application restarts.

---

### Key Entities *(include if feature involves data)*

- **Recording Session**: Transient state representing an ongoing or just-completed audio capture, tracking duration, audio buffers, input gain applied, and hardware device identifiers.
- **Audio Idea Metadata Prompt**: Data transfer entity collecting user-entered or default attributes (Title, Musical Key, BPM, Authors, Song Section, Instruments, Notes) to create a finalized catalog entry.
- **Audio Hardware Profile**: Configuration entity representing the user's selected input device ID, output device ID, input channel routing selection, input gain level, and master output volume level.
- **Volume Level & Gain State**: Real-time signal metrics representing instantaneous RMS and peak amplitude levels for input and output channels, including clipping flags and user gain multipliers.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can initiate audio recording with a single click in under 200 milliseconds of latency.
- **SC-002**: Visual transition of the record button between the idle circle and recording square occurs fluidly and instantaneously upon click.
- **SC-003**: 100% of recorded ideas submitted with a blank title are successfully saved with the sequential "Idea-XX" default naming scheme without requiring manual text entry.
- **SC-004**: Real-time input and output volume meters reflect signal level changes with a refresh rate of at least 30 frames per second during active audio processing.
- **SC-005**: Adjusting the input gain knob or output volume knob updates signal amplification immediately with zero audible pops, clicks, or dropouts.
- **SC-006**: Users can switch their audio input device, output device, or channel routing in under 10 seconds through the settings modal.
- **SC-007**: Discarding a recording take immediately removes transient audio buffers and results in zero orphan database records.

---

## Assumptions

- **Knob Interaction Model**: Gain and volume rotary knobs support both vertical drag (dragging upward increases level, dragging downward decreases level) and mouse scroll wheel adjustment, with default input gain set to unity (100%) and default output volume set to 100%.
- **Sequential Idea Numbering**: The default title "Idea-XX" utilizes the existing catalog monotonic counter (e.g., "Idea-1", "Idea-2", etc.) so numbers increment reliably even when previous ideas have been deleted.
- **Audio Channels**: When an input device exposes multiple channels, the default configuration is Stereo or Channel 1 (Mono) if mono-only.
- **Dock Height and Visibility**: The bottom recording dock is permanently visible across all table tabs (Available, Archived, and Filtered views) to ensure recording is always one click away.
- **Discard Confirmation**: Clicking Discard on the post-recording metadata modal shows a short inline confirmation ("Are you sure you want to discard this recording?") to prevent accidental loss of a performance.
