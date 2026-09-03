# Implementation Plan: IPC Bridge & Contracts

**Branch**: `003-ipc-bridge-contracts` | **Date**: 2026-09-03 | **Spec**: [spec.md](file:///Users/andresdelgado/Documents/Coding/Vault/specs/003-ipc-bridge-contracts/spec.md)

**Input**: Feature specification from `specs/003-ipc-bridge-contracts/spec.md`

## Summary

Formalize the existing ad-hoc IPC layer into a contract-driven architecture. The current codebase uses hardcoded string literals for channel names scattered across `src/main/ipc/*.ts` and `src/preload/index.ts`. This plan introduces a shared IPC channel registry (`src/shared/ipc-channels.ts`), refactors both sides to reference those constants, consolidates the `VaultAPI` type declaration into the shared layer, and updates tests to validate the contract guarantees specified in FR-001 through FR-015.

## Technical Context

**Language/Version**: TypeScript 5.5+ (strict mode) targeting ES2022

**Primary Dependencies**: Electron 35 (`contextBridge`, `ipcRenderer.invoke`, `ipcMain.handle`), better-sqlite3

**Storage**: SQLite via `better-sqlite3` (Main process only)

**Testing**: Vitest 3.2+ with `@shared` path alias configured via `vitest.config.ts`

**Target Platform**: Cross-platform desktop (macOS, Windows, Linux) via Electron

**Project Type**: Desktop application (Electron)

**Performance Goals**: Sub-millisecond IPC round-trip for metadata operations; audio payloads up to 50 MB without data loss

**Constraints**: No third-party dependencies without architectural approval. `contextIsolation: true` and `nodeIntegration: false` are non-negotiable. All IPC uses `invoke`/`handle` pattern exclusively.

**Scale/Scope**: Single-user local app; 6 IPC channels across 2 domains (notes: 5, instruments: 1)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Requirement | Status |
|------|-------------|--------|
| STACK SIMPLICITY | Only Electron, TypeScript, Node.js — no new dependencies | ✅ Pass |
| PROCESS SEPARATION | Shared types in `@shared/`; handlers in `src/main/ipc/`; bridge in `src/preload/` | ✅ Pass |
| VERIFIABLE TESTS | Tests for every IPC channel and preload bridge method | ✅ Pass (existing + planned updates) |
| DATA INTEGRITY | No changes to storage layer; relative paths preserved | ✅ Pass (not affected) |
| UNIFIED LANGUAGE | All new code, types, and docs in English | ✅ Pass |
| contextIsolation | Must be `true`; nodeIntegration must be `false` | ✅ Pass (FR-011) |
| IPCResult\<T\> envelope | All handlers must return `IPCResult<T>` via try/catch | ✅ Pass (already implemented, formalized in FR-007) |
| No `any` | All types must be explicit; no `any` usage | ✅ Pass |
| ArrayBuffer for audio | Audio payloads serialized as ArrayBuffer over IPC | ✅ Pass (FR-013, FR-014) |

All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/003-ipc-bridge-contracts/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── ipc-contract.md  # Channel → payload type map
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
src/
├── main/
│   ├── db/                        # Existing — unchanged
│   ├── audio/                     # Existing — unchanged
│   ├── ipc/
│   │   ├── index.ts               # Refactor: import IPC_CHANNELS from @shared
│   │   ├── note-handlers.ts       # Refactor: replace string literals with IPC_CHANNELS
│   │   ├── instrument-handlers.ts # Refactor: replace string literals with IPC_CHANNELS
│   │   └── __tests__/
│   │       └── ipc-handlers.test.ts  # Update: use IPC_CHANNELS constants
│   └── index.ts                   # Existing — unchanged
├── preload/
│   ├── index.ts                   # Refactor: import IPC_CHANNELS, replace string literals
│   ├── vaultAPI.d.ts              # Remove (moved to shared)
│   └── __tests__/
│       └── preload.test.ts        # Update: use IPC_CHANNELS constants
├── renderer/                      # Not yet created — types available via Window augmentation
└── shared/
    ├── ipc-channels.ts            # NEW: channel registry constant
    └── types/
        ├── index.ts               # Update: re-export ipc-channels + vault-api
        ├── vault-api.ts           # NEW: VaultAPI interface + Window augmentation (from preload/vaultAPI.d.ts)
        ├── audio-note.ts          # Existing — unchanged
        ├── instrument.ts          # Existing — unchanged
        ├── ipc.ts                 # Existing — unchanged
        ├── filters.ts             # Existing — unchanged
        └── audio.ts               # Existing — unchanged
```

**Structure Decision**: The existing Electron 3-process layout (`main/`, `preload/`, `renderer/`, `shared/`) is preserved. Two new files are added to `src/shared/` and one type declaration is relocated from `src/preload/` to `src/shared/types/`. No new directories are created.

## Complexity Tracking

No constitution violations. Table not applicable.
