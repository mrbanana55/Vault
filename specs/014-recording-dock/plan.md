# Implementation Plan: Bottom Recording Dock and Audio Settings

**Branch**: `014-recording-dock` | **Date**: 2026-09-15 | **Spec**: [`specs/014-recording-dock/spec.md`](spec.md)

**Input**: Feature specification from `specs/014-recording-dock/spec.md`

## Summary

Implement a full-featured, persistent recording dock anchored at the bottom of the Vault desktop window. The dock provides real-time dual audio level metering (input meter on the left, output meter on the right), tactile rotary knobs for input gain and master output volume, a centrally positioned Record button that smoothly morphs from a red circle into a red square while recording (accompanied by an elapsed time indicator), a post-recording metadata entry modal with automatic "Idea-XX" default naming and backdrop/Escape dismissal suppression, and an audio hardware settings modal triggered by a gear icon allowing input/output device selection and channel routing.

## Technical Context

**Language/Version**: TypeScript 5.7+ / Node.js 20+
**Primary Dependencies**: React 19, Tailwind CSS v3, Electron 35, Vitest, `@testing-library/react`, Web Audio API
**Storage**: SQLite (`better-sqlite3`) for metadata persistence; local file system (`app.getPath('userData')/audio_vault/recordings/`) for linear PCM WAV files; `localStorage` for hardware device/gain preferences
**Testing**: Vitest (`npm test`) with jsdom environment
**Target Platform**: macOS, Windows, Linux desktop via Electron
**Project Type**: Desktop Application (Electron + React)
**Performance Goals**:
- Recording latency < 200ms upon click
- Real-time volume metering refresh rate &ge; 30 FPS synchronized via `requestAnimationFrame`
- Smooth rotary knob updates with zero audio dropouts or clicks
**Constraints**:
- Strict Process Separation: File system writes and SQLite operations isolated in Main process via IPC (`saveAudioFile`, `notes.create`)
- Stack Simplicity: Zero third-party packages added (pure React, SVG, Tailwind CSS, Web Audio API)
- Data Integrity: Audio captured as Float32 linear PCM WAV; physical takes unlinked or discarded cleanly
- Unified Language: 100% English code, comments, documentation, and commit messages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

- [x] **Process Separation**: All audio recording, gain scaling, and metering occur in Renderer via Web Audio API. Disk persistence and database rows pass through existing `window.vaultAPI` IPC bridge (`saveAudioFile` and `notes.create`).
- [x] **Stack Simplicity**: Implemented entirely with native Web Audio API (`AudioContext`, `GainNode`, `AnalyserNode`), React hooks, SVG rendering for rotary knobs and meters, and Tailwind CSS. No external UI or audio libraries added.
- [x] **Verifiable Tests**: Comprehensive unit and integration test coverage planned for `useAudioRecordingDock`, `<RotaryKnob />`, `<VolumeMeter />`, `<SaveIdeaModal />`, `<AudioSettingsModal />`, and `<RecordingPanel />`.
- [x] **Data Integrity**: Clean disposal of rejected audio buffers upon discard; atomic SQLite insertion and monotonic counter generation (`Idea-XX`).
- [x] **Unified Language**: All interfaces, types, component names, and documentation are authored strictly in English.

## Project Structure

### Documentation (this feature)

```text
specs/014-recording-dock/
├── spec.md              # Feature specification
├── plan.md              # This technical implementation plan
├── research.md          # Technical research & architectural decisions
├── data-model.md        # Entities, types, and state transitions
├── quickstart.md        # End-to-end runnable validation scenarios
├── contracts/
│   └── recording-dock-contract.md # UI component & hook contracts
└── checklists/
    └── requirements.md  # Specification quality checklist (16/16 passing)
```

### Source Code

```text
src/
├── renderer/
│   ├── audio/
│   │   ├── audio-recorder.ts          # Existing Web Audio recorder engine
│   │   ├── device-manager.ts          # Extended for output device enumeration
│   │   ├── meter-service.ts           # Volume level calculation (RMS, peak, clipping)
│   │   └── wav-encoder.ts             # Linear PCM WAV encoder
│   ├── components/
│   │   ├── RecordingPanel.tsx         # [MODIFY] Persistent bottom recording dock
│   │   ├── RotaryKnob.tsx             # [NEW] Tactile circular rotary knob
│   │   ├── VolumeMeter.tsx            # [NEW] Real-time signal meter with clipping LED
│   │   ├── SaveIdeaModal.tsx          # [NEW] Post-recording metadata entry dialog
│   │   └── AudioSettingsModal.tsx     # [NEW] Hardware input/output & channel dialog
│   ├── context/
│   │   └── AudioPlayerContext.tsx     # [MODIFY] Connect output analyser & master volume
│   ├── hooks/
│   │   └── useAudioRecordingDock.ts   # [NEW] Coordinates recording, metering, and modal
│   └── types/
│       └── recording-dock.ts          # [NEW] Component and state type definitions
```

## Complexity Tracking

> *No violations found. All principles pass cleanly.*
