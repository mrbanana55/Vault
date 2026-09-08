# Implementation Plan: Audio Ideas Import

**Branch**: `006-import-audio-ideas` | **Date**: 2026-09-08 | **Spec**: [specs/006-import-audio-ideas/spec.md](./spec.md)

**Input**: Feature specification from `specs/006-import-audio-ideas/spec.md`

## Summary

Implement audio idea ingestion via both native drag-and-drop and a dedicated option bar (header) action. The feature enables musicians to import single or batch audio files (`.wav`, `.mp3`, `.m4a`, `.ogg`, `.flac`), visualizes real-time progress using an Apple-style circular progress indicator with numeric percentages (0% to 100%), makes an internal copy of the audio file in the vault storage while preserving original files completely untouched, and automatically registers the new ideas in the database with the filename as default title and instant table refresh.

## Technical Context

**Language/Version**: TypeScript 5.8 / Node.js 22 (Electron 35)  
**Primary Dependencies**: Electron, React 19, Tailwind CSS v3, Vite 6  
**Storage**: SQLite (`better-sqlite3`) for metadata, local disk (`app.getPath('userData')/audio_vault/recordings/`) for copied audio files  
**Testing**: Vitest 3.2 with jsdom environment (`npm test`)  
**Target Platform**: macOS, Windows, Linux (Cross-platform desktop via Electron)  
**Project Type**: Desktop Application (Electron Main + Preload + React Renderer)  
**Performance Goals**: Sub-3s import per file (under 50MB); smooth 60fps circular SVG progress animation; zero UI thread freezing during file copy operations  
**Constraints**: 
- Zero third-party dependencies (**STACK SIMPLICITY**)
- Zero `fs` or Node.js imports in Renderer (**PROCESS SEPARATION**)
- Original source audio files must remain 100% untouched (**DATA INTEGRITY**)
- Relative paths stored in SQLite (**DATA INTEGRITY**)  
**Scale/Scope**: Handles single file drops to multi-file batches (e.g. 50+ audio files) with cumulative progress tracking

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Verification Detail |
|---|---|---|---|
| **STACK SIMPLICITY** | Stick to Electron, React, TypeScript, Tailwind CSS, Node.js, SQLite. Zero new dependencies. | ✅ PASS | Implemented using native HTML5 drag-and-drop, SVG circular progress, HTML5 `Audio` metadata duration decoding, and built-in Electron `webUtils` and `dialog` APIs. |
| **PROCESS SEPARATION** | UI logic in Renderer; `fs` and SQLite strictly isolated in Main via IPC and Preload. | ✅ PASS | Drag handling and progress UI reside in Renderer; file copying, header validation, and database records managed in Main via `IPC_CHANNELS.AUDIO.IMPORT_FILE`. Zero `fs` in Renderer. |
| **VERIFIABLE TESTS** | Automated tests passing before merge. | ✅ PASS | Unit tests planned for `CircularProgressModal.test.tsx`, `DragDropOverlay.test.tsx`, and `import-handlers.test.ts`. |
| **DATA INTEGRITY** | Physical files in `userData/audio_vault/`; relative paths in SQLite; originals preserved. | ✅ PASS | Copies files to `recordings/{uuid}.{ext}`; stores relative paths; opens originals in read-only mode, guaranteeing source preservation. |
| **UNIFIED LANGUAGE** | All code, types, schemas, and docs in English. | ✅ PASS | 100% English naming and documentation throughout. |

## Project Structure

### Documentation (this feature)

```text
specs/006-import-audio-ideas/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── import-audio-contract.md
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository layout)

```text
src/
├── main/
│   ├── audio/
│   │   ├── audio-storage-service.ts    # Existing importFile(sourcePath) reused
│   │   └── validate-audio-header.ts    # Magic-byte validation
│   ├── ipc/
│   │   ├── audio-handlers.ts           # Register audio:import-file and audio:open-file-dialog
│   │   └── __tests__/
│   │       └── import-handlers.test.ts # IPC handler integration tests
│   └── index.ts
├── preload/
│   ├── index.ts                        # Expose getPathForFile, importAudioFile, openFileDialog
│   └── __tests__/preload.test.ts
├── renderer/
│   ├── components/
│   │   ├── CircularProgressModal.tsx   # Circular loading indicator with percentage
│   │   ├── DragDropOverlay.tsx         # Drag-and-drop visual target overlay
│   │   ├── Header.tsx                  # Adds "Import" button to option bar
│   │   └── __tests__/
│   │       ├── CircularProgressModal.test.tsx
│   │       └── DragDropOverlay.test.tsx
│   ├── hooks/
│   │   ├── useAudioImport.ts           # Hook managing drop events, duration extraction, batch progress
│   │   └── __tests__/useAudioImport.test.ts
│   └── lib/
│       └── audio-metadata.ts           # Duration extraction via HTML5 Audio
└── shared/
    ├── ipc-channels.ts                 # AUDIO.IMPORT_FILE, AUDIO.OPEN_FILE_DIALOG
    └── types/
        ├── audio.ts                    # ImportAudioFileInput interface
        └── vault-api.ts                # VaultAPI bridge augmentation
```

**Structure Decision**: Adheres strictly to the established three-tier architecture (Main, Preload, Renderer) and shared type contracts.

## Complexity Tracking

> *No constitutional violations detected. Table left intentionally empty.*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| *None* | *N/A* | *N/A* |
