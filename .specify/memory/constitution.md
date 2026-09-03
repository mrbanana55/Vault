# Vault Constitution

## Core Principles

### STACK SIMPLICITY

- Stick strictly to Electron, React, TypeScript, Tailwind CSS, Node.js, and SQLite.
- No third-party dependencies may be added without prior architectural approval.

### PROCESS SEPARATION

- UI logic resides exclusively in the Renderer process.
- File system access (`fs`), audio streaming protocols, and SQLite queries remain strictly isolated in the Main process via IPC and the Preload bridge.

### VERIFIABLE TESTS

- Every core IPC channel, audio utility, and SQLite query module must have automated unit or integration tests passing cleanly before merge.

### DATA INTEGRITY

- Audio files are stored strictly on the local file system.
- SQLite stores metadata and relative file paths only. Never store BLOBs or absolute paths.

### UNIFIED LANGUAGE

- All source code, types, DB schemas, IPC interfaces, comments, documentation, and commit messages must be strictly in English.

---

## Project Profile and Role

### Description

**Vault** is a cross-platform desktop application (macOS, Windows, Linux) designed for organizing and cataloging musical voice memos and musical ideas through rich metadata, tagging, and workflow states.

### Main Technology Stack

- **Core / Desktop:** Electron + Node.js
- **Frontend:** React (TypeScript) + Tailwind CSS
- **Local Persistence:** SQLite via `better-sqlite3`
- **Audio Engine:** Web Audio API (Renderer) + Node.js File System Streams (Main)
- **Native ABI Targets:** Native modules (`better-sqlite3`) must target Electron ABI versions using `electron-rebuild` or a configured `rebuild` npm script.
- **Audio Processing Delegation:** Audio duration and peak calculation for visual waveforms must be extracted at capture time within the Renderer via the Web Audio API prior to dispatching creation payloads to Main.

---

## Electron and IPC Architecture (Strict Rules)

To maintain application security, responsiveness, and clean abstraction boundaries, a strict process separation model is enforced:

1. **Main Process (`/src/main`)**:
   - Manages window lifecycles (`BrowserWindow`), app state, disk I/O operations, custom protocols, and direct SQLite interactions.
   - **MUST NEVER** import frontend/UI modules, reference React, or manipulate DOM nodes.
2. **Preload Script (`/src/preload`)**:
   - Exposes a typed, read-only bridge to the Renderer process exclusively via `contextBridge.exposeInMainWorld()`.
   - **MUST NEVER** enable `nodeIntegration: true` or set `contextIsolation: false`.
3. **Renderer Process (`/src/renderer`)**:
   - Developed purely in React and styled with Tailwind CSS.
   - Consumes operating system and database capabilities solely through the global `window.vaultAPI` interface.
   - Handles microphone capture (`navigator.mediaDevices.getUserMedia`) and playback through custom protocol URIs.

### Audio Protocol Specification

- **Privilege Registration:** The `vault-audio` scheme must be registered via `protocol.registerSchemesAsPrivileged` with `{ standard: true, secure: true, supportFetchAPI: true, stream: true }` before the `app.ready` event fires.
- **Streaming & Scrubbing:** Handlers for `vault-audio://` must serve audio chunks from `userData` supporting HTTP Range requests (`bytes=...`) to allow scrubbing and low-latency playback in HTML5 `<audio>` elements without disabling Chromium web security.

---

## Expected Directory Structure

```
vault/
├── src/
│   ├── main/
│   │   ├── db/              # Migrations, schema, and SQLite client
│   │   ├── ipc/             # IPC handlers (ipcMain.handle)
│   │   ├── audio/           # Physical file management and protocol handlers
│   │   └── index.ts         # Electron main entry point
│   ├── preload/
│   │   └── index.ts         # contextBridge setup and vaultAPI interface
│   ├── renderer/
│   │   ├── components/      # React components (modals, list, audio player)
│   │   ├── hooks/           # Custom React hooks (e.g. useAudioRecorder)
│   │   ├── context/         # Application state (active note, filters, view)
│   │   ├── types/           # UI-specific types
│   │   └── App.tsx          # Root React component
│   └── shared/              # Shared data contracts (AudioNote, IPCResult, filters)
├── .gitignore
└── package.json
```

---

## Code Standards and TypeScript

- **Strict Typing:** Setting `any` is strictly prohibited. Define shared interfaces in `@shared/types` for all core entities (`AudioNote`, `Metadata`, `FilterOptions`, `SortOptions`).
- **React Components:** Functional components only, typed using `React.FC` or explicit parameter/return types. Keep components modular, accessible, and decoupled from IPC mechanics.
- **Unified IPC Contract:** All IPC handlers must trap runtime exceptions inside `try/catch` blocks and return a typed `IPCResult<T>` payload:

```typescript
export type IPCResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

---

## Business Rules to Respect in Implementations

1. **Audio File Management:**
   - Physical audio files must be stored within the application directory at `app.getPath('userData')/audio_vault/`.
   - The database must store only **relative file paths** (e.g., `recordings/{uuid}.wav`). The Main process is solely responsible for resolving relative paths against `userData`.
   - Recorded audio captured as `Blob` in the Renderer must be serialized into an `ArrayBuffer` before transmission over IPC. The Main process converts it to a `Buffer` to stream to disk.
   - When an `AudioNote` is deleted, the Main process must remove the SQLite row within an active transaction and asynchronously unlink the file on disk. Unlink errors must be logged without rolling back a successful database deletion.

2. **Sorting and Filtering:**
   - Default query ordering must be `ORDER BY created_at DESC`.
   - Tab views are partitioned by the `is_used` status flag (`0` for Available ideas, `1` for Used/Archived ideas).
   - Dynamic search queries must use parameterized bindings (`?` or named parameters) to prevent SQL injection vulnerabilities.

---

## AI Agent Validation Checklist

Before proposing, modifying, or committing code, the agent must verify:

- [ ] Does the code respect process boundaries (no `fs` or DB calls in Renderer; no UI code in Main)?
- [ ] Are all types explicitly defined without `any` in `@shared/types`?
- [ ] Is all IPC communication structured through `ipcRenderer.invoke` / `ipcMain.handle` returning `IPCResult<T>`?
- [ ] Are audio payloads serialized as `ArrayBuffer` when traveling over IPC?
- [ ] Does the database store strictly relative paths?
- [ ] Are all code entities, schemas, and git commits authored in English?

**Version**: 1.1.0 | **Ratified**: 2026-09-02 | **Last Amended**: 2026-09-02
