# Quickstart Validation Guide: Audio Capture & Real-Time Recording

**Feature**: 004-audio-capture  
**Date**: 2026-09-03  

---

## Prerequisites

- Node.js 18+ installed
- Project dependencies installed (`npm install`)
- Prior test suites passing (`npm test`)

---

## Validation Scenarios

### 1. Shared Types Compilation
**What it proves**: `AudioInputDevice`, `RecordingState`, `VolumeMeterLevels`, and `SaveAudioFileInput` are defined in `@shared/types` without type errors or `any`.

**Run Command**:
```bash
npx tsc --noEmit
npx tsc -p tsconfig.main.json --noEmit
```
**Expected Outcome**: Clean exit with code 0 and 0 errors.

---

### 2. IPC `audio:save-file` Handler & Preload Bridge Tests
**What it proves**: `window.vaultAPI.saveAudioFile` invokes the `IPC_CHANNELS.AUDIO.SAVE_FILE` channel, successfully writes a valid WAV `ArrayBuffer` to `<audioVault>/recordings/{uuid}.wav`, and returns an `IPCResult<AudioIngestionResult>`.

**Run Command**:
```bash
npm test -- src/main/ipc/__tests__/ipc-handlers.test.ts
npm test -- src/preload/__tests__/preload.test.ts
```
**Expected Outcome**:
- `audio:save-file` writes valid WAV buffer and returns `relativePath: "recordings/{uuid}.wav"`.
- Rejecting invalid/corrupt audio buffer returns `{ success: false, error: ... }`.
- Preload bridge exposes `window.vaultAPI.saveAudioFile`.

---

### 3. Audio Metering & WAV Encoding Unit Tests
**What it proves**:
- Pre-gain and post-gain metering formulas accurately compute RMS and peak amplitudes from Float32Array PCM samples.
- Clipping flag is correctly raised when peak amplitude exceeds 0.99.
- AudioBuffer / PCM samples are encoded into standard 44-byte RIFF/WAVE header buffers accepted by `validateAudioHeader`.

**Run Command**:
```bash
npm test -- src/renderer/audio/__tests__/
```
**Expected Outcome**: All math, encoding, and device manager tests pass.

---

### 4. Full Suite Regression Verification
**What it proves**: Existing database, audio storage, and IPC tests continue to pass without regressions.

**Run Command**:
```bash
npm test
```
**Expected Outcome**: 100% of test suites pass cleanly.

---

## Cross-Reference Matrix

| User Story / Requirement | Validation Scenario |
|---|---|
| US1 / FR-001, FR-002, FR-003 | Scenario 2 (saveAudioFile & note creation) |
| US2 / FR-005, FR-006, FR-007 | Scenario 1, 3 (AudioInputDevice, device management) |
| US3 / FR-008, FR-009, FR-010 | Scenario 3 (Hot-plug & fallback listener) |
| US4 / FR-011, FR-012, FR-017, FR-018 | Scenario 3 (Dual AnalyserNode RMS/Peak & clipping calculation) |
| IPC & Preload Contract | Scenario 2 (Channel registry & preload bridge) |
