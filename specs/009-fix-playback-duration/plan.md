# Implementation Plan: Fix Audio Playback CSP and Real Duration Display

**Branch**: `009-fix-playback-duration` | **Date**: 2026-09-08 | **Spec**: [spec.md](file:///Users/andresdelgado/Documents/Coding/Vault/specs/009-fix-playback-duration/spec.md)

**Input**: Feature specification from `specs/009-fix-playback-duration/spec.md`

## Summary

Resolve audio playback failures and duration display bugs:
1. **CSP & Media Unblocking**: Update the Content Security Policy meta tag in `src/renderer/index.html` to include `media-src 'self' vault-audio: blob:;`. Add `bypassCSP: true` to the `vault-audio` privileged scheme registration in `src/main/audio/audio-protocol-handler.ts`.
2. **Explicit MIME Types**: Map file extensions (`.m4a`, `.mp3`, `.wav`, etc.) to explicit audio MIME types (`audio/mp4`, `audio/mpeg`, `audio/wav`, etc.) in `handleVaultAudioProtocol` to resolve `NotSupportedError`.
3. **Database Schema Support for Duration Updates**: Add `duration_seconds?: number` to `UpdateAudioNoteInput` and handle it in `src/main/db/note-repository.ts`'s `updateNote` transaction.
4. **Real Duration Backfill & Resolution**: Implement automatic duration resolution in the Renderer for any notes loaded with `duration_seconds <= 0`, dynamically inspecting container metadata via `vault-audio://stream/...` and updating the database row.
5. **Robust Import Metadata Extraction**: Add safety timeout and fallback in `src/renderer/lib/audio-metadata.ts` so future imports reliably record non-zero durations.

## Technical Context

**Language/Version**: TypeScript 5.5+ (strict mode, no `any`)

**Primary Dependencies**: React 19, Tailwind CSS 3.4, Electron 35 (Node.js 22 built-in)

**Storage**: SQLite (`better-sqlite3`) for metadata persistence; filesystem (`userData/audio_vault/`) for audio files.

**Testing**: Vitest 3.2 + `@testing-library/react` 16

**Target Platform**: Cross-platform desktop (macOS, Windows, Linux) via Electron

**Project Type**: Desktop application (Electron + React)

**Performance Goals**: Audio playback starts within 200ms; missing durations resolve within 1 second of row display.

**Constraints**: Respect Vault Constitution (zero new third-party dependencies, strict process separation, no `any` types).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked post-design.*

| Gate | Status | Notes |
|---|---|---|
| **STACK SIMPLICITY** | ✅ PASS | Zero new dependencies added. Utilizes standard Chromium CSP directives and existing Web/Node APIs. |
| **PROCESS SEPARATION** | ✅ PASS | Protocol and database updates occur strictly in Main via IPC; duration detection and playback UI operate in Renderer. |
| **AUDIO PROTOCOL SPEC** | ✅ PASS | Preserves `vault-audio` scheme privileges while adding `bypassCSP: true` and explicit audio MIME headers. |
| **DATA INTEGRITY** | ✅ PASS | Updates SQLite `duration_seconds` using parameterized queries via `updateNote`. Relative path model untouched. |
| **VERIFIABLE TESTS** | ✅ PASS | Test suites covering CSP configuration, MIME mapping, duration update repository operations, and metadata resolution. |
| **UNIFIED LANGUAGE** | ✅ PASS | All code, types, and documentation authored in English. |

All gates pass cleanly.

## Project Structure

### Documentation (this feature)

```text
specs/009-fix-playback-duration/
├── spec.md                     # Feature specification
├── plan.md                     # This implementation plan
├── research.md                 # Technical decisions & root causes
├── data-model.md               # Data model & state transitions
├── quickstart.md               # End-to-end verification guide
├── contracts/
│   ├── csp-policy.md           # Content Security Policy specification
│   └── audio-note-update.md    # Updated UpdateAudioNoteInput contract
└── checklists/
    └── requirements.md         # Specification quality checklist
```

### Source Code (repository root)

```text
src/
├── main/
│   ├── audio/
│   │   ├── audio-protocol-handler.ts     # MODIFY: Add bypassCSP: true & explicit audio MIME headers
│   │   └── __tests__/
│   │       └── audio-protocol-handler.test.ts # MODIFY: Add test for MIME type headers and bypassCSP
│   └── db/
│       ├── note-repository.ts            # MODIFY: Support duration_seconds in updateNote
│       └── __tests__/
│           └── note-repository.test.ts   # MODIFY: Test updating duration_seconds
├── renderer/
│   ├── index.html                        # MODIFY: Add media-src 'self' vault-audio: blob:; to CSP
│   ├── lib/
│   │   ├── audio-metadata.ts             # MODIFY: Add timeout and fallback to extractAudioDuration
│   │   └── __tests__/
│   │       └── audio-metadata.test.ts    # MODIFY: Add test for timeout and duration extraction
│   ├── context/
│   │   ├── AudioPlayerContext.tsx        # MODIFY: Auto-resolve duration on loadedmetadata if note duration <= 0
│   │   └── __tests__/
│   │       └── AudioPlayerContext.test.tsx # MODIFY: Verify dynamic duration persistence
│   ├── hooks/
│   │   └── useNotes.ts                   # MODIFY: Backfill durations for loaded notes with duration_seconds <= 0
│   └── components/
│       └── TableRow.tsx                  # (receives updated duration seamlessly from note)
└── shared/
    └── types/
        └── audio-note.ts                 # MODIFY: Add duration_seconds?: number to UpdateAudioNoteInput
```

**Structure Decision**:
- Modifies configuration in `index.html` (CSP).
- Modifies protocol handler in `src/main/audio/audio-protocol-handler.ts` (MIME types & bypassCSP).
- Extends `UpdateAudioNoteInput` in `src/shared/types/audio-note.ts` and `src/main/db/note-repository.ts`.
- Enhances duration extraction and backfilling in `src/renderer/lib/audio-metadata.ts`, `AudioPlayerContext.tsx`, and `useNotes.ts`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| None | N/A | Fully complies with project architecture and constitution. |
