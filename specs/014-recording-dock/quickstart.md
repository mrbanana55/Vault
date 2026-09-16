# Quickstart Validation Guide: Bottom Recording Dock and Audio Settings

This guide outlines runnable scenarios to validate the complete Bottom Recording Dock and Audio Settings implementation end-to-end.

---

## Prerequisites

- Electron development environment running (`npm run start` or `npm run dev`)
- Host microphone or audio input hardware connected
- Headset, speakers, or system default audio output device available

---

## Validation Scenarios

### Scenario 1: Record and Save with Default Name ("Idea-XX")

1. Open the application.
2. Locate the persistent bottom recording dock.
3. Verify the centered record button displays as a red circular icon.
4. Click the red record button.
   - Button smoothly morphs into a red square icon.
   - An adjacent elapsed timer begins counting upwards from `00:00`.
   - The left input volume meter responds in real time to speech or musical sound.
5. Speak or play music for 3 seconds, then click the red square stop button.
6. Observe that `<SaveIdeaModal />` immediately opens:
   - Backdrop click and <kbd>Escape</kbd> key do NOT dismiss the dialog.
   - Title input placeholder displays "Idea-XX (leave blank for default)".
7. Leave all fields empty and click "Save Idea".
8. **Verification**:
   - The modal closes.
   - A new idea row appears at the top of the Active Ideas table with title `Idea-XX` (or `idea-XX`).
   - The duration matches the ~3-second take.

---

### Scenario 2: Record with Custom Metadata Fields

1. Click the red record button in the dock.
2. Record audio for 4 seconds, then click the red square stop button.
3. In the `<SaveIdeaModal />`, enter:
   - Title: `Chorus Acoustic Take 1`
   - Key: `D Major`
   - BPM: `118`
   - Authors: `John, Paul`
   - Section: `Chorus`
   - Instruments: `Acoustic Guitar, Vocals`
   - Notes: `Clean condenser mic take`
4. Click "Save Idea".
5. **Verification**:
   - The new row at the top displays `Chorus Acoustic Take 1`.
   - Columns for Key (`D Major`), BPM (`118`), Authors (`John, Paul`), Section (`Chorus`), and Instruments (`Acoustic Guitar`, `Vocals`) display the entered values correctly.

---

### Scenario 3: Real-Time Input Volume Metering & Gain Knob

1. Observe the left section of the recording dock.
2. Verify the `<VolumeMeter />` displays a live signal bar.
3. Turn the adjacent `<RotaryKnob />` labeled "GAIN" by dragging vertically upward:
   - Knob rotates clockwise up to 200%.
   - Speak into the microphone; verify the meter reaches higher amplitude and reflects louder signal.
4. Double-click the knob; verify it snaps back to the default `100%` (unity gain).
5. Speak loudly to peak the signal; verify the red clipping indicator illuminates and holds momentarily.

---

### Scenario 4: Real-Time Output Volume Metering & Master Volume Knob

1. Click Play on any idea row in the catalog.
2. Observe the right section of the recording dock:
   - The output `<VolumeMeter />` dances in sync with the playing track.
3. Drag the `<RotaryKnob />` labeled "VOL" vertically downward:
   - Knob rotates counter-clockwise towards 0%.
   - Playback sound attenuates smoothly without pops or distortion.
4. Double-click the knob; verify it snaps back to `100%`.

---

### Scenario 5: Discard Fresh Recording Take

1. Click the red record button, capture audio for 2 seconds, and click the red square stop button.
2. When the metadata modal opens, click "Discard".
3. An inline confirmation prompt asks: "Discard this take? This action cannot be undone."
4. Click "Confirm Discard".
5. **Verification**:
   - The modal closes.
   - No new entry appears in the ideas table.
   - The record button resets cleanly to the red circle idle state.

---

### Scenario 6: Audio Hardware Settings (Gear Icon)

1. Click the gear icon button in the recording dock.
2. Verify the `<AudioSettingsModal />` opens:
   - All connected audio input devices (microphones/interfaces) are listed in the Input Device dropdown.
   - Audio output devices are listed in the Output Device dropdown.
   - Channel Input options (`Stereo`, `Mono Channel 1`, `Mono Channel 2`) are visible.
3. Select an alternative input or output device, and switch channel mode.
4. Close the settings modal.
5. Reload the application and re-open the settings modal; verify the selected preferences were restored from storage.

---

### Scenario 7: Automated Test Suite Execution

Run all automated unit and integration tests:

```bash
npm test
```

**Expected Outcome**:
- All test suites pass cleanly with 0 failures (including new suites for `RecordingPanel`, `RotaryKnob`, `VolumeMeter`, `SaveIdeaModal`, and `AudioSettingsModal`).
- Strict TypeScript checks pass:
  ```bash
  npx tsc --noEmit
  npx tsc -p tsconfig.main.json --noEmit
  npx tsc -p tsconfig.renderer.json --noEmit
  ```
