# Phase 0 Research: Bottom Recording Dock and Audio Settings

## Technical Decisions and Architecture

### 1. Recording Engine Coordination and Dock Architecture

- **Decision**: Integrate `src/renderer/audio/audio-recorder.ts` directly into a custom hook `useAudioRecordingDock` to manage the complete recording lifecycle, timer, real-time input level polling, and modal transition.
- **Rationale**: Vault already possesses a production-grade Web Audio recording engine (`AudioRecorder`) supporting linear PCM WAV encoding (`wav-encoder.ts`), hardware hot-plug detection (`device-manager.ts`), dual `AnalyserNode` metering (`meter-service.ts`), and pre/post gain adjustment (`GainNode`). Wrapping this engine in a cohesive React hook ensures clean state isolation, automatic RAF cleanup, and reactive rendering.
- **Alternatives Considered**:
  - Direct MediaRecorder webm capture: Rejected because standard linear PCM WAV guarantees immediate compatibility with our custom `vault-audio://` streaming protocol, fast scrubbing, and lossless musical quality.
  - Global recorder singleton: Encapsulated in React context or hook avoids memory leaks and ensures cleanup on unmount.

---

### 2. Record Button Morphing Animation

- **Decision**: Use Tailwind CSS transitions (`transition-all duration-300 ease-in-out`) to morph the record button from a circular badge (`rounded-full w-12 h-12 bg-red-600`) in the idle state into a square stop button (`rounded-md w-8 h-8 bg-red-600`) within a centered 48x48 touch target when actively recording.
- **Rationale**: Morphing provides clear, tactile visual feedback recognized universally in audio recording and video capture software (e.g., Apple Voice Memos, Logic Pro, Ableton). Smooth border-radius and scale transitions deliver an Apple HIG-aligned aesthetic without extra animation libraries.
- **Alternatives Considered**:
  - Separate Start and Stop buttons: Takes up more horizontal dock real estate and reduces visual focus.
  - Canvas-based custom rendering: Adds unnecessary complexity; pure HTML/CSS is easily testable in jsdom.

---

### 3. Post-Recording Metadata Modal & Auto-Generated Naming

- **Decision**: Open `<SaveIdeaModal />` immediately upon stopping a recording. Disable background backdrop click and Escape key dismissal (per explicit user clarification). If the user leaves the title empty, pass `null` or `""` to `vaultAPI.notes.create()`.
- **Rationale**: `createNote()` in `src/main/db/note-repository.ts` already implements an atomic monotonic counter in SQLite (`app_meta.next_note_number`) that automatically generates `idea-${currentNum}` when `title` is empty or null. We will ensure the display reflects `Idea-${currentNum}` for clean presentation. Disabling accidental backdrop/Escape dismissal guarantees a live musical take is never discarded inadvertently.
- **Alternatives Considered**:
  - Prompting metadata *before* recording: Interrupts musical spontaneous inspiration; artists want to press record instantly.
  - Auto-saving immediately without modal: Prevents musicians from tagging BPM, key, and instruments while the performance is fresh in their minds.

---

### 4. Interactive Rotary Knob UX & Math

- **Decision**: Implement `<RotaryKnob />` with radial angle rendering (from -135° to +135°, total 270° sweep), supporting both vertical click-and-drag (`deltaY`), mouse wheel adjustments, and keyboard arrow navigation. Double-clicking resets the knob to unity/default.
- **Rationale**: Rotary knobs are the universal standard in digital audio workstations (DAWs) and hardware mixers. Dragging vertically (up for increase, down for decrease) is the standard interaction pattern in modern web audio plugins and DAWs.
- **Alternatives Considered**:
  - Standard HTML linear sliders (`<input type="range">`): Takes up significant horizontal space in a compact bottom dock and looks like generic forms rather than a musical instrument interface.
  - Circular arc SVG drag: Angular tracking around the center can be awkward when dragging across the top or bottom; linear vertical drag is much more ergonomic and predictable.

---

### 5. Input and Output Volume Metering

- **Decision**:
  - **Input Meter**: Sample `audioRecorder.getMeterLevels()` via `requestAnimationFrame` while monitoring or recording. Display dual Peak and RMS bars with a persistent 500ms clipping indicator if peak reaches &ge; 0.99 (0 dB).
  - **Output Meter**: Hook into `AudioPlayerContext`. Connect the playback audio stream to a Web Audio `AnalyserNode` or sample amplitude levels during playback to drive the right-side output volume meter.
- **Rationale**: Dual RMS (perceived loudness) and Peak (instantaneous transients) metering gives musicians accurate visibility into input headroom and clipping distortion.
- **Alternatives Considered**:
  - Polling with `setInterval(100)`: Causes stuttering and visual lag. `requestAnimationFrame` ensures smooth 60 FPS rendering synchronized with browser repaints, with zero work when idle.

---

### 6. Hardware Audio Settings & Channel Selection

- **Decision**:
  - Implement `<AudioSettingsModal />` triggered by a gear button in the recording dock.
  - **Input Device**: Enumerate `audioinput` devices using existing `device-manager.ts` and persist to `localStorage`.
  - **Output Device**: Enumerate `audiooutput` devices and persist to `localStorage`. Apply via `HTMLAudioElement.setSinkId(deviceId)` on the playback element if supported.
  - **Input Channel**: Allow selecting `Stereo`, `Mono Channel 1 (Left)`, or `Mono Channel 2 (Right)`. For mono selection on multi-channel streams, utilize Web Audio `ChannelSplitterNode` or `MediaTrackConstraints.channelCount`.
- **Rationale**: External USB interfaces often feature two inputs (e.g. Channel 1 for Mic, Channel 2 for Guitar). Allowing explicit channel selection prevents guitarists from recording only into the left ear of a stereo file.
