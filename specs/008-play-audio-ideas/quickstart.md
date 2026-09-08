# Quickstart Validation Guide: Play Audio Ideas

**Feature**: Play Audio Ideas
**Branch**: `008-play-audio-ideas`
**Date**: 2026-09-08

This guide describes end-to-end manual and automated scenarios to validate that audio playback, top-center scrubbing, time display, and Space bar shortcuts function correctly according to specification.

---

## Prerequisites

1. Node.js environment configured.
2. Dependencies installed: `npm install`.
3. Application builds cleanly: `npm run build`.

---

## Scenario 1: Row Play/Pause Toggle & Track Switching

### Steps:
1. Launch the application: `npm start` (or launch in dev mode).
2. Ensure at least two audio ideas are present in the table (import via "Import" button or record via the microphone panel).
3. Locate the first row in the table. Click the play button on the left side of the row.
4. Verify:
   - The button icon changes from a play triangle to a pause double-bar.
   - Audio is heard from speakers/headphones.
   - The row displays active visual styling.
5. Click the pause button on that same row.
   - Audio stops.
   - The button icon reverts to a play triangle.
6. Click the play button on the *second* row.
   - The first row remains idle.
   - The second row's button turns into pause and its audio starts playing from 00:00.

---

## Scenario 2: Top-Center Interactive Time Bar and Scrubber

### Steps:
1. Play an audio idea.
2. Look at the top center of the window (in the header bar).
3. Verify:
   - An interactive time bar is visible.
   - The progress indicator moves forward smoothly in real-time.
   - On the right side of the time bar, formatted numbers display `{current_time} / {duration}` (e.g. `0:15 / 1:30`).
4. Click halfway across the time bar.
   - The audio playback immediately jumps to the middle of the track without stuttering.
   - The current time display updates to reflect the new position.
5. Drag the slider thumb backward.
   - Playback repositions to the earlier timestamp and continues seamlessly.
6. Allow the audio track to play to its end.
   - When the track completes, playback stops automatically, the time bar resets to `0:00`, and the row button returns to the play icon.

---

## Scenario 3: Global Space Bar Control & Text Field Isolation

### Steps:
1. While an audio track is playing, click in any neutral space (not in an input field).
2. Press the `Space` bar:
   - Playback pauses immediately. Page does not scroll.
3. Press `Space` again:
   - Playback resumes immediately from the paused position.
4. Switch to Edit Mode (using the mode toggle in the top right).
5. Click on an editable cell (e.g., the Title or Notes column) to enter inline text edit mode.
6. Press the `Space` bar while typing:
   - A space character is inserted into the text field.
   - Playback is NOT toggled (audio does not play or pause).
7. Press `Escape` to commit the edit.
8. Press `Space` again:
   - Playback toggles normally.

---

## Scenario 4: Automated Test Suite

Run the Vitest test suite to verify unit and component tests:

```bash
npm test
```

Expected Outcome:
- All unit and component tests for `AudioPlayerContext`, `AudioTimeBar`, `TableRow` play controls, and protocol handlers pass cleanly.
