# Implementation Plan: Audio Capture & Real-Time Recording

**Branch**: `004-audio-capture` | **Date**: 2026-09-03 | **Spec**: [spec.md](file:///Users/andresdelgado/Documents/Coding/Vault/specs/004-audio-capture/spec.md)

**Input**: Feature specification from `/specs/004-audio-capture/spec.md` and user directives for Web Audio API & MediaStream Recording API inside the Renderer process.

---

## Summary

Build an audio capture and real-time recording engine inside the Electron Renderer process that enables musicians to record musical ideas through available audio hardware (built-in microphones, USB audio interfaces). The Renderer handles input device enumeration and hot-plugging, manages recording sessions via the MediaStream Recording API, calculates real-time pre-gain and post-gain signal levels with clipping detection via dual `AnalyserNode` instances, encodes captured PCM audio into a standard WAV `ArrayBuffer`, and securely transmits the binary payload across IPC through `window.vaultAPI.saveAudioFile(...)` without any direct `fs` access in the Renderer.

---

## Technical Context

**Language/Version**: TypeScript 5.5 (strict mode, ES2022)  
**Primary Dependencies**: Electron 35, better-sqlite3 11.8, Node.js v24 (Main), Web Audio API / MediaStream Recording API (Renderer). No third-party dependencies.  
**Storage**: Local file system (`<userData>/audio_vault/recordings/{uuid}.wav`) + SQLite (`vault.db`) via existing `AudioStorageService` and `note-repository`.  
**Testing**: Vitest 3.2 (`npm test`)  
**Target Platform**: Desktop (macOS, Windows, Linux)  
**Project Type**: Electron Desktop Application (React / Node.js)  
**Performance Goals**: Dual volume meters updating at 30–60 FPS with minimal main-thread audio processing jitter; <100ms recording stop-to-save latency for typical ideas.  
**Constraints**: Zero `fs` imports in Renderer; strict typed IPC contracts with `IPCResult<T>`; zero `any` usage.  
**Scale/Scope**: Real-time audio capture pipeline, hardware device abstraction, dual volume metering, and IPC save bridge. UI presentation components are deferred to Spec 005.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Verification |
|---|---|---|---|
| **STACK SIMPLICITY** | Stick strictly to Electron, React, TypeScript, Tailwind, Node, SQLite. No third-party audio packages. | ✅ PASS | Uses native browser Web Audio API (`AudioContext`, `AnalyserNode`, `GainNode`) and MediaStream Recording API (`MediaRecorder`). Pure TS WAV encoder. |
| **PROCESS SEPARATION** | UI/recording logic strictly in Renderer; disk/SQLite access strictly in Main via IPC and Preload. | ✅ PASS | Renderer captures audio and extracts levels via `AnalyserNode`. ArrayBuffer sent across bridge via `window.vaultAPI.saveAudioFile`. Zero `fs` calls in Renderer. |
| **VERIFIABLE TESTS** | Automated tests passing cleanly before merge. | ✅ PASS | Unit tests for shared types, IPC handlers (`audio:save-file`), preload exposure, metering calculations, and WAV encoder. |
| **DATA INTEGRITY** | Audio files stored on local filesystem. SQLite stores relative paths only. | ✅ PASS | Audio written to `recordings/{uuid}.wav` in `audio_vault`; database stores relative paths only. |
| **UNIFIED LANGUAGE** | English for all code, comments, docs. | ✅ PASS | All code, types, and documentation in English. |

*Gate outcome: All 5 constitutional principles pass without exceptions or violations.*

---

## Project Structure

### Documentation (this feature)

```text
specs/004-audio-capture/
├── spec.md                       # Feature specification & clarifications
├── plan.md                       # This implementation plan
├── research.md                   # Phase 0: Audio capture & pipeline decisions
├── data-model.md                 # Phase 1: Domain types (AudioInputDevice, RecordingState, etc.)
├── quickstart.md                 # Phase 1: Validation scenarios & commands
├── contracts/
│   └── audio-capture-contract.md # Phase 1: IPC channel & VaultAPI bridge contracts
├── checklists/
│   └── requirements.md           # Quality checklist (15/15 passing)
└── tasks.md                      # Phase 2: Actionable task list (created via /speckit-tasks)
```

### Source Code Architecture

```text
src/
├── shared/
│   ├── ipc-channels.ts                    # [MODIFY] Add IPC_CHANNELS.AUDIO.SAVE_FILE
│   ├── types/
│   │   ├── audio-capture.ts               # [NEW] AudioInputDevice, RecordingState, VolumeMeterLevels, SaveAudioFileInput
│   │   ├── vault-api.ts                   # [MODIFY] Add saveAudioFile to VaultAPI
│   │   └── index.ts                       # [MODIFY] Re-export audio-capture types
├── main/
│   ├── ipc/
│   │   ├── audio-handlers.ts              # [NEW] Handler for IPC_CHANNELS.AUDIO.SAVE_FILE
│   │   ├── index.ts                       # [MODIFY] Register audio handlers
│   │   └── __tests__/
│   │       └── ipc-handlers.test.ts       # [MODIFY] Test audio:save-file channel
├── preload/
│   ├── index.ts                           # [MODIFY] Expose vaultAPI.saveAudioFile
│   └── __tests__/
│       └── preload.test.ts                # [MODIFY] Test saveAudioFile bridge method
└── renderer/
    └── audio/                             # [NEW] Renderer audio capture layer
        ├── device-manager.ts              # Enumerate, select, hot-plug listener
        ├── meter-service.ts               # RMS, Peak, clipping math from AnalyserNode
        ├── wav-encoder.ts                 # PCM to WAV ArrayBuffer encoder
        ├── audio-recorder.ts              # MediaRecorder + Web Audio pipeline coordinator
        └── __tests__/
            ├── meter-service.test.ts      # Test volume calculations & clipping
            ├── wav-encoder.test.ts        # Test WAV header generation against validateAudioHeader
            └── device-manager.test.ts     # Test device listing and fallback logic
```

---

## Complexity Tracking

> **No constitutional violations detected. Table intentionally empty.**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| None | N/A | N/A |
