# Tasks: Bottom Recording Dock and Audio Settings

**Feature**: Bottom Recording Dock and Audio Settings (`specs/014-recording-dock/spec.md`)  
**Implementation Plan**: `specs/014-recording-dock/plan.md`  
**Status**: Complete  

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type definitions and shared contracts for recording dock, hardware settings, and metering.

- [x] T001 [P] Define types and interfaces (`DockRecordingState`, `AudioHardwareSettings`, `ChannelMode`, `MeterSignalLevels`, `PostRecordingIdeaInput`) in `src/renderer/types/recording-dock.ts`
- [x] T002 [P] Export recording dock types in `src/renderer/types/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Audio device enumeration extensions and player context volume/metering hooks that all user stories depend on.

**⚠️ CRITICAL**: Must complete before user story component assembly.

- [x] T003 [P] Implement output device enumeration and channel mode persistence in `src/renderer/audio/device-manager.ts` (`getAudioOutputDevices`, `getSelectedOutputDeviceId`, `setSelectedOutputDeviceId`, `getChannelMode`, `setChannelMode`)
- [x] T004 [P] Update unit test suite for device manager extensions in `src/renderer/audio/__tests__/device-manager.test.ts`
- [x] T005 Update `AudioPlayerContext.tsx` in `src/renderer/context/AudioPlayerContext.tsx` to expose master volume control (`outputVolume`, `setOutputVolume`), `stopPlayback()` trigger, and output Web Audio analyser node
- [x] T006 Update unit tests in `src/renderer/context/__tests__/AudioPlayerContext.test.tsx` verifying output volume control and `stopPlayback()` coordination

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 - Record Audio Idea & Populate Metadata Modal (Priority: P1) 🎯 MVP

**Goal**: Enable users to click a red circle record button that morphs into a red square while recording, view an elapsed timer, stop recording, and fill an optional metadata modal with blank title defaulting to "Idea-XX".

**Independent Test**: Click Record, speak into microphone, click Stop, leave title empty and submit modal; verify newly created note appears at the top of the table with title `Idea-XX` and correct duration.

### Tests for User Story 1

- [x] T007 [P] [US1] Create unit test suite for `SaveIdeaModal` in `src/renderer/components/__tests__/SaveIdeaModal.test.tsx` verifying backdrop and Escape dismissal suppression, form fields, and submit payloads
- [x] T008 [P] [US1] Create unit test suite for `useAudioRecordingDock` in `src/renderer/hooks/__tests__/useAudioRecordingDock.test.ts` testing state transitions, timer increments, and saving flow
- [x] T009 [P] [US1] Create component test suite for `RecordingPanel` in `src/renderer/components/__tests__/RecordingPanel.test.tsx` asserting idle and active recording button states

### Implementation for User Story 1

- [x] T010 [P] [US1] Implement `<SaveIdeaModal />` in `src/renderer/components/SaveIdeaModal.tsx` with Title, Key, BPM, Authors, Section, Instruments, Notes, disabled backdrop/Escape dismissal, and "Idea-XX" default placeholder
- [x] T011 [US1] Implement recording orchestration hook `useAudioRecordingDock` in `src/renderer/hooks/useAudioRecordingDock.ts` coordinating `AudioRecorder`, elapsed timer, stopping playback on record start, and saving via `vaultAPI.saveAudioFile` + `vaultAPI.notes.create`
- [x] T012 [US1] Implement morphing Record button (red circle ⇄ red square) with elapsed timer display in `src/renderer/components/RecordingPanel.tsx`
- [x] T013 [US1] Integrate `RecordingPanel` into `src/renderer/components/AppLayout.tsx` with table refetch callback on note creation

**Checkpoint**: User Story 1 functional and independently testable as an MVP!

---

## Phase 4: User Story 2 - Real-Time Dual Metering & Gain/Volume Knobs (Priority: P1)

**Goal**: Provide tactile rotary knobs for input gain (0% to 200%) and master output volume (0% to 100%), alongside real-time volume level meters with 0 dB clipping indicators.

**Independent Test**: Speak into microphone and observe left meter response; turn input gain knob and verify level scaling; play audio track and observe right output meter response while turning master volume knob to adjust loudness.

### Tests for User Story 2

- [x] T014 [P] [US2] Create unit test suite for `RotaryKnob` in `src/renderer/components/__tests__/RotaryKnob.test.tsx` verifying angle rendering, vertical drag, mouse wheel, double-click reset, and ARIA slider attributes
- [x] T015 [P] [US2] Create unit test suite for `VolumeMeter` in `src/renderer/components/__tests__/VolumeMeter.test.tsx` verifying RMS/peak bars and clipping LED indicator activation

### Implementation for User Story 2

- [x] T016 [P] [US2] Implement `<RotaryKnob />` in `src/renderer/components/RotaryKnob.tsx` with SVG circular arc, vertical pointer drag, mouse wheel, double-click reset to default, and value formatting
- [x] T017 [P] [US2] Implement `<VolumeMeter />` in `src/renderer/components/VolumeMeter.tsx` displaying real-time RMS, Peak, and 500ms hold clipping LED
- [x] T018 [US2] Integrate input volume meter and input gain knob into the left section of `src/renderer/components/RecordingPanel.tsx`
- [x] T019 [US2] Integrate output volume meter and master volume knob into the right section of `src/renderer/components/RecordingPanel.tsx`
- [x] T020 [US2] Wire real-time level polling via `requestAnimationFrame` in `src/renderer/hooks/useAudioRecordingDock.ts` for both input and output meters

**Checkpoint**: User Stories 1 and 2 functional together with full metering and tactile gain/volume controls.

---

## Phase 5: User Story 3 - Audio Hardware Settings & Channel Selection (Priority: P2)

**Goal**: Allow users to open an Audio Settings dialog via a gear icon in the dock to select active input device, output device, and channel routing (Stereo, Mono Ch1, Mono Ch2).

**Independent Test**: Click gear icon in dock, change input/output device and channel mode, close dialog, reload app, and verify preferences are restored and applied.

### Tests for User Story 3

- [x] T021 [P] [US3] Create unit test suite for `AudioSettingsModal` in `src/renderer/components/__tests__/AudioSettingsModal.test.tsx` asserting device lists, channel selection, and storage persistence

### Implementation for User Story 3

- [x] T022 [P] [US3] Implement `<AudioSettingsModal />` in `src/renderer/components/AudioSettingsModal.tsx` with input device selector, output device selector, and channel mode selector
- [x] T023 [US3] Add settings gear icon button to the recording dock in `src/renderer/components/RecordingPanel.tsx` and wire modal toggle in `useAudioRecordingDock.ts`
- [x] T024 [US3] Extend `AudioRecorder` in `src/renderer/audio/audio-recorder.ts` to support mono channel selection (Channel 1 vs Channel 2) on multi-channel audio streams

**Checkpoint**: Hardware device configuration and channel routing fully operational.

---

## Phase 6: User Story 4 - Discard & Safeguard Recording Flows (Priority: P3)

**Goal**: Protect live musical takes from accidental loss by requiring an explicit confirmation before discarding a newly recorded take.

**Independent Test**: Record a take, click "Discard" in metadata modal, verify confirmation prompt appears; click "Confirm Discard" and verify buffer is purged and no catalog entry is created.

### Tests for User Story 4

- [x] T025 [P] [US4] Add discard confirmation tests to `src/renderer/components/__tests__/SaveIdeaModal.test.tsx`

### Implementation for User Story 4

- [x] T026 [US4] Implement inline discard confirmation state in `src/renderer/components/SaveIdeaModal.tsx` ("Discard take? This cannot be undone." → "Confirm Discard" / "Keep")
- [x] T027 [US4] Implement buffer disposal and dock reset upon discard in `src/renderer/hooks/useAudioRecordingDock.ts`


**Checkpoint**: Complete safeguards against accidental take deletion in place.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verify type integrity, run full test suite with regression checks, and validate production build.

- [x] T028 [P] Run strict TypeScript type checks across all configs (`npx tsc --noEmit`, `npx tsc -p tsconfig.main.json --noEmit`, `npx tsc -p tsconfig.renderer.json --noEmit`)
- [x] T029 Run full automated test suite (`npm test`) ensuring 100% test pass rate with zero regressions
- [x] T030 Verify clean production build (`npm run build`)
- [x] T031 Validate end-to-end user scenarios against `specs/014-recording-dock/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational completion. Delivers the MVP.
- **User Story 2 (Phase 4)**: Depends on Foundational and integrates with US1 dock.
- **User Story 3 (Phase 5)**: Depends on Foundational and integrates with dock gear icon.
- **User Story 4 (Phase 6)**: Depends on US1 modal components.
- **Polish (Phase 7)**: Depends on all user stories being complete.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (User Story 1).
3. Validate MVP: capture audio, click stop, save note with default "Idea-XX", verify row in table.

### Incremental Delivery
1. Add Phase 4 (User Story 2): Introduce rotary knobs and real-time volume meters.
2. Add Phase 5 (User Story 3): Introduce Audio Settings modal for hardware configuration.
3. Add Phase 6 (User Story 4): Introduce discard confirmation protection.
4. Execute Phase 7 (Polish): Complete test suite, typecheck, build validation.
