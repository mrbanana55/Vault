# Implementation Plan: Play Audio Ideas

**Branch**: `008-play-audio-ideas` | **Date**: 2026-09-08 | **Spec**: [spec.md](file:///Users/andresdelgado/Documents/Coding/Vault/specs/008-play-audio-ideas/spec.md)

**Input**: Feature specification from `specs/008-play-audio-ideas/spec.md`

## Summary

Enable audio playback for musical ideas directly within the application:
1. **Main Process**: Register the privileged `vault-audio://` custom protocol before `app.ready` to stream audio files from `userData/audio_vault/` with native HTTP Range (`bytes=...`) request support for instant scrubbing.
2. **Renderer State**: Provide an `AudioPlayerContext` and `useAudioPlayer` hook managing a single HTML5 audio element instance, maintaining single-track playback state, seeking, and global Space bar play/pause keyboard shortcuts isolated from text editing inputs.
3. **UI Components**:
   - Add a play/pause button to the leftmost column of each row in `IdeasTable` / `TableRow`.
   - Embed an interactive `AudioTimeBar` (scrubber slider + elapsed/total duration display) in the top center of `Header`.

## Technical Context

**Language/Version**: TypeScript 5.5+ (strict mode, no `any`)

**Primary Dependencies**: React 19, Tailwind CSS 3.4, Electron 35 (Node.js 22 built-in)

**Storage**: Local file system (`userData/audio_vault/`) for audio files; SQLite (`better-sqlite3`) for metadata and relative paths. No database schema changes required.

**Testing**: Vitest 3.2 + `@testing-library/react` 16 (unit tests and React component tests)

**Target Platform**: Cross-platform desktop (macOS, Windows, Linux) via Electron

**Project Type**: Desktop application (Electron + React)

**Performance Goals**: Playback start latency < 200ms; scrub seeking latency < 100ms; time bar updates >= 4Hz.

**Constraints**: Strict process separation. All file system streaming isolated in Main process via `vault-audio://`. Renderer uses only standard web media APIs. Space bar must never interfere with inline cell editing. No third-party dependencies added.

**Scale/Scope**: Single-track playback across tables of dozens to hundreds of ideas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked post-design.*

| Gate | Status | Notes |
|---|---|---|
| **STACK SIMPLICITY** | ✅ PASS | Zero new dependencies. Uses built-in Electron `protocol`, HTML5 `Audio`, React, TypeScript, and Tailwind CSS. |
| **PROCESS SEPARATION** | ✅ PASS | Main process handles filesystem resolution and protocol serving. Renderer consumes `vault-audio://stream/...` via HTML5 Audio and context bridge. No `fs` or DB calls in Renderer. |
| **AUDIO PROTOCOL SPEC** | ✅ PASS | `vault-audio` registered before `app.ready` with `{ standard: true, secure: true, supportFetchAPI: true, stream: true }`. Supports HTTP Range requests for scrubbing. |
| **VERIFIABLE TESTS** | ✅ PASS | Automated unit tests for protocol handler, `AudioPlayerContext`, `AudioTimeBar`, and `TableRow` play controls. |
| **DATA INTEGRITY** | ✅ PASS | Preserves relative path model in SQLite and local disk isolation. No schema migrations needed. |
| **UNIFIED LANGUAGE** | ✅ PASS | All code, types, interfaces, tests, and documentation authored strictly in English. |
| **Strict Typing** | ✅ PASS | Fully typed interfaces, zero `any` declarations. |
| **Functional Components** | ✅ PASS | React components are modular functional components styled with Tailwind CSS. |

All gates pass cleanly. No complexity violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/008-play-audio-ideas/
├── spec.md                     # Feature specification
├── plan.md                     # This implementation plan
├── research.md                 # Technical decisions & research
├── data-model.md               # Playback entities & state machine
├── quickstart.md               # Validation & testing guide
├── contracts/
│   ├── protocol-contract.md    # vault-audio:// streaming protocol specification
│   └── ui-contracts.md         # Component props, context API & keyboard contract
└── checklists/
    └── requirements.md         # Specification quality checklist
```

### Source Code (repository root)

```text
src/
├── main/
│   ├── audio/
│   │   ├── audio-protocol-handler.ts     # NEW: vault-audio protocol registration & handler
│   │   ├── audio-storage-service.ts      # (existing, resolves absolute paths)
│   │   └── index.ts                      # EXPORT protocol handler
│   └── index.ts                          # MODIFY: Register scheme before ready, install handler on ready
├── renderer/
│   ├── context/
│   │   ├── AudioPlayerContext.tsx        # NEW: Playback state, HTMLAudioElement, spacebar listener
│   │   └── __tests__/
│   │       └── AudioPlayerContext.test.tsx # NEW: Unit tests for player provider
│   ├── hooks/
│   │   └── useAudioPlayer.ts             # NEW: Convenience hook for AudioPlayerContext
│   ├── components/
│   │   ├── AudioTimeBar.tsx              # NEW: Top-center scrubber slider and duration display
│   │   ├── Header.tsx                    # MODIFY: Render AudioTimeBar in top-center layout
│   │   ├── TableRow.tsx                  # MODIFY: Add play/pause toggle button in column 0
│   │   ├── IdeasTable.tsx                # MODIFY: Add column 0 header for play button
│   │   └── __tests__/
│   │       ├── AudioTimeBar.test.tsx     # NEW: Tests for scrubber and duration display
│   │       └── TableRow.test.tsx         # MODIFY: Test play/pause button interactions
│   └── App.tsx                           # MODIFY: Wrap AppLayout with AudioPlayerProvider
└── shared/
    └── types/
        └── (existing types sufficient; AudioNote & NoteWithInstruments reused)
```

**Structure Decision**:
- Adds 1 file in `src/main/audio/` (`audio-protocol-handler.ts`) and registers it in `src/main/index.ts`.
- Adds 3 files in `src/renderer/` (`AudioPlayerContext.tsx`, `useAudioPlayer.ts`, `AudioTimeBar.tsx`).
- Modifies 4 existing renderer files (`Header.tsx`, `TableRow.tsx`, `IdeasTable.tsx`, `App.tsx`) to integrate player state and controls.
- Adds comprehensive unit and component tests in `__tests__/`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| None | N/A | All designs strictly follow Constitution and existing architecture. |
