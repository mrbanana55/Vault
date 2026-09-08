# Feature Specification: Play Audio Ideas

**Feature Branch**: `008-play-audio-ideas`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Right now the ideas shown in the table are not playable. I would like to be able to play this ideas by clicking on a play/pause button. This button should be on the left side of the corresponding audio row. When i play an audio i should see a time bar in the top center of the app, i want to be able to move to a certain moment of the audio and i want to see the current time i am in the audio and the audio duration at the right, like the time bar that you find in music streaming apps like apple music or spotify. Space bar should be for play/pause actions."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Row-Level Playback Controls (Priority: P1)

A musician viewing their ideas table wants to listen to a specific musical idea. They click the play button located on the left side of that idea's table row. The audio immediately begins playing, and the button transitions to a pause icon. Clicking the button again pauses the playback, keeping the current audio position. If the user clicks play on a different idea row, the previously playing idea stops, and the newly selected idea begins playing from the beginning.

**Why this priority**: Listening to recorded musical ideas directly from the catalog table is the core functional requirement. Without row-level playback triggers, users cannot audition or review their ideas.

**Independent Test**: Can be tested independently by adding audio ideas to the table, clicking the play button on a row to confirm audio plays and the icon toggles to pause, clicking pause to verify playback stops, and clicking play on a different row to verify track switching.

**Acceptance Scenarios**:

1. **Given** an audio idea row in the ideas table, **When** the user clicks the play button on the left side of the row, **Then** audio playback starts for that idea, and the button changes into a pause button.
2. **Given** an audio idea is actively playing, **When** the user clicks its pause button, **Then** playback pauses at the current position, and the button changes back into a play button.
3. **Given** an audio idea is paused, **When** the user clicks its play button again, **Then** playback resumes from where it was paused.
4. **Given** Idea A is actively playing, **When** the user clicks the play button on Idea B, **Then** Idea A stops playing, Idea B begins playing from the beginning (00:00), and Idea B's row reflects the active playing state.
5. **Given** an audio idea is actively playing or paused, **When** viewing the ideas table, **Then** the active idea row is visually distinguished from other rows.

---

### User Story 2 - Top-Center Interactive Time Bar and Duration Display (Priority: P1)

While listening to an audio idea, the musician looks at the top center of the application to see playback progress on an interactive time bar (scrubber), similar to music streaming apps like Apple Music or Spotify. On the right side of the time bar, they can see the current playback timestamp alongside the total duration of the track (e.g., "0:34 / 2:15"). The user can click or drag along the time bar to jump (scrub) to any specific point in the audio, allowing them to quickly find a specific section or riff.

**Why this priority**: Providing visual temporal feedback and scrubbing control is essential for musicians analyzing specific sections of a take or demo.

**Independent Test**: Can be tested independently by playing an idea, verifying the top-center time bar reflects playback progress in real time, verifying current time and total duration timestamps appear on the right, and clicking/dragging on the time bar to confirm playback seeks accurately to that point.

**Acceptance Scenarios**:

1. **Given** an audio idea begins playing, **When** the user observes the top-center area of the application, **Then** an interactive time bar is visible, smoothly advancing as playback progresses.
2. **Given** an active audio idea, **When** viewing the time bar, **Then** the current elapsed time and the total track duration are displayed formatted as minutes and seconds (e.g., "mm:ss / mm:ss") on the right side of the time bar.
3. **Given** an audio idea is playing or paused, **When** the user clicks at a specific position along the time bar, **Then** the audio playback position immediately jumps to the corresponding time and continues playback (if playing) or remains paused at that position (if paused).
4. **Given** an audio idea is playing or paused, **When** the user drags the scrubber thumb/handle along the time bar, **Then** the playback position updates to match the dragged location upon release.
5. **Given** no audio idea has been played since application launch, **When** the user views the top-center area, **Then** the time bar displays an inactive/empty state without throwing errors.

---

### User Story 3 - Space Bar Global Play/Pause Control (Priority: P2)

A musician wants quick, hands-free or keyboard-driven control over audio playback while reviewing ideas. Pressing the Space bar toggles playback between play and pause for the active idea. To prevent conflicts when editing metadata, if the user is currently typing in an editable field (such as idea Title, BPM, Key, Authors, or Notes), pressing Space bar inserts a space character as normal and does not trigger play/pause.

**Why this priority**: Keyboard playback control is a universally expected standard in desktop media and music software that significantly speeds up review workflows, but depends on basic playback existing first.

**Independent Test**: Can be tested independently by playing an idea, pressing the Space bar to toggle between pause and play, and subsequently opening an inline text edit field to confirm Space bar types spaces without altering playback state.

**Acceptance Scenarios**:

1. **Given** an audio idea is actively playing and no text input is focused, **When** the user presses the Space bar, **Then** playback pauses.
2. **Given** an audio idea is paused and no text input is focused, **When** the user presses the Space bar, **Then** playback resumes from the current position.
3. **Given** the user is actively editing a text field (e.g., editing Title, BPM, Key, Notes, or Authors in edit mode), **When** the user presses the Space bar, **Then** a space character is inserted into the text field and playback status does not change.
4. **Given** no audio idea has been played yet and no text input is focused, **When** the user presses the Space bar, **Then** the system either starts playback of the first available idea in the table or maintains idle state without unexpected behavior.

---

### Edge Cases

- **Track Reaches End**: When audio playback reaches the end of an idea, playback stops automatically, the playback position resets to the beginning (00:00), and both the row button and top controls return to the play/idle state.
- **Missing or Inaccessible Audio File**: If the audio file for an idea cannot be located on disk or is corrupt when the user clicks play, the system displays an informative error message to the user, does not crash, and restores playback controls to an idle state.
- **Switching Between Available and Archived Ideas**: If an idea is actively playing and the user switches tabs (e.g., between Available and Used/Archived ideas), playback continues uninterrupted and the top-center time bar remains interactive.
- **Deleting or Archiving the Playing Idea**: If the currently playing idea is archived or deleted from the table, playback stops cleanly and the time bar resets.
- **Rapid Scrubbing and Clicking**: If the user rapidly clicks different positions on the time bar or repeatedly clicks play/pause, the audio engine and UI state remain synchronized without audio glitches, stuttering, or desynchronized timers.
- **Audio Duration Extremes**: Very short clips (< 1 second) or long clips (> 1 hour) format elapsed time and duration cleanly without layout distortion.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The ideas table MUST display a play/pause button in a dedicated column on the left side of each audio idea row.
- **FR-002**: Clicking the play button on an idle or paused row MUST start playing that idea's audio from the current position (or 00:00 if newly selected) and toggle the button icon to pause.
- **FR-003**: Clicking the pause button on an actively playing row MUST pause audio playback and toggle the button icon to play.
- **FR-004**: Clicking play on an idea while another idea is playing MUST immediately stop the previous track and begin playing the newly chosen idea from the beginning (00:00).
- **FR-005**: The table row corresponding to the currently active (playing or paused) audio idea MUST display clear visual feedback distinguishing it from inactive rows.
- **FR-006**: The application MUST feature an interactive time bar positioned in the top-center area of the header layout.
- **FR-007**: The time bar MUST display real-time playback progress proportional to the current position and total duration of the active audio idea.
- **FR-008**: Users MUST be able to click or drag on the time bar to scrub/seek to any timestamp in the audio track, updating playback instantly.
- **FR-009**: The top-center playback area MUST display the current playback timestamp and the total track duration formatted as minutes and seconds on the right side of the time bar.
- **FR-010**: Pressing the Space bar MUST toggle playback between play and pause for the active idea when focus is not inside an editable text input.
- **FR-011**: Pressing the Space bar while focused inside an active text input or editable cell MUST enter a whitespace character and MUST NOT affect audio playback.
- **FR-012**: When audio playback reaches the end of the track, the system MUST stop playback, reset the position to 00:00, and revert play/pause controls to the stopped state.
- **FR-013**: If an audio file cannot be loaded or played, the system MUST display a clear notification and reset playback controls to idle without disrupting application state.

### Key Entities

- **Audio Idea**: Represents a cataloged musical recording with attributes including identifier, title, duration, relative file path, musical key, tempo (BPM), tags, instruments, and creation date.
- **Playback Session**: Represents the runtime playback state, including the currently active idea, playback status (idle, playing, paused), elapsed playback time in seconds, and track total duration in seconds.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Clicking a play button or pressing the Space bar initiates audio playback with an audible start latency under 200 milliseconds.
- **SC-002**: Seeking to a new position via the top-center time bar updates playback position within 100 milliseconds without audible stuttering or desynchronization.
- **SC-003**: The time bar progress and elapsed time display update at least 4 times per second during playback, ensuring visually smooth progression.
- **SC-004**: 100% of Space bar keystrokes entered while editing metadata in text fields register as character inputs without triggering play/pause events.
- **SC-005**: 100% of audio tracks reaching their end cleanly reset to 00:00 and stopped state without manual user intervention or visual desynchronization.
- **SC-006**: Switching playback between two different ideas completes within 300 milliseconds with zero overlap of simultaneous audio streams.

## Assumptions

- Each audio idea listed in the table is associated with a valid audio file in a supported format (.wav, .mp3, .m4a, .ogg, .flac) accessible to the system.
- Playback operates in single-stream mode: only one audio idea plays at a time.
- Standard default behavior when a track finishes playing is to stop and reset to the beginning rather than automatically advancing to the next row in the table.
- Space bar shortcut is global to the application window, except when a form control or editable cell has active text focus.
- The top-center header area has adequate visual space to accommodate the time bar and timestamp display across standard desktop window sizes.
