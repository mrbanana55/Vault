# AGENTS.md — Guidelines & Architecture Spec for Vault

This document defines the development standards, architecture, and workflows that any AI Agent or developer must strictly follow when contributing to **Vault**.

---

## 1. Project Profile and Role

**Vault** is a cross-platform desktop application (macOS, Windows, Linux) for organizing and cataloging musical ideas through metadata and states.

### Main Technology Stack

- **Core / Desktop:** Electron + Node.js
- **Frontend:** React (TypeScript) + Tailwind CSS
- **Local Persistence:** SQLite (via `better-sqlite3`)
- **Audio Engine:** Web Audio API (Renderer) + Node File System / Streams (Main)

---

## 2. Electron and IPC Architecture (Strict Rules)

To maintain security and performance, a strict process separation model is applied:

1. **Main Process (`/src/main`)**:
   - Responsible for managing the main window (`BrowserWindow`), app lifecycle, disk I/O operations (`fs`), and direct **SQLite** database queries.
   - **MUST NEVER** import UI libraries or manipulate DOM elements.
2. **Preload Script (`/src/preload`)**:
   - Exposes a secure API to the Renderer process exclusively using `contextBridge.exposeInMainWorld()`.
   - **MUST NEVER** enable `nodeIntegration: true` or disable `contextIsolation`.
3. **Renderer Process (`/src/renderer`)**:
   - Developed entirely in **React + Tailwind CSS**.
   - Consumes the system API only through the global `window.vaultAPI` object.
   - Handles audio capture (`navigator.mediaDevices.getUserMedia`) and smooth playback in the UI.

---

## 3. Expected Directory Structure

```
vault/
├── src/
│   ├── main/
│   │   ├── db/              # Migrations and SQLite client
│   │   ├── ipc/             # IPC handlers (ipcMain.handle)
│   │   ├── audio/           # Physical file management on disk
│   │   └── index.ts         # Electron entry point
│   ├── preload/
│   │   └── index.ts         # Bridge and TypeScript interface (vaultAPI)
│   ├── renderer/
│   │   ├── components/      # React UI components
│   │   ├── hooks/           # Custom hooks (e.g. useAudioRecorder)
│   │   ├── context/         # Global state (notes, filters, active tab)
│   │   ├── types/           # Frontend interfaces
│   │   └── App.tsx
│   └── shared/              # Shared types (AudioNote, NoteFilters)
├── AGENTS.md
└── package.json
```

---

## 4. Code Standards and TypeScript

- **Strict TypeScript:** Using `any` is prohibited. Define interfaces in `@shared/types` for all entities (`AudioNote`, `Metadata`, `FilterOptions`).
- **React Components:** Function-based, typed with `React.FC` or explicit returns. Modular, clean, and prioritizing visual accessibility.
- **Error Handling:** All IPC handlers must wrap database or file system calls in `try/catch` blocks and return an object with standard structure:

```tsx
type IPCResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

---

## 5. Business Rules to Respect in Implementations

1. **Audio File Management:**
   - Recorded or imported audio files must be physically saved in the app's data directory (`app.getPath('userData')/audio_vault/`).
   - The database only stores the **relative or absolute file path** (`file_path`), never the Blob or Buffer directly.
2. **Sorting and Tabs:**
   - The default query must apply `ORDER BY created_at DESC`.
   - Tab views are filtered strictly by the `is_used` column (`0` for Available, `1` for Used).
3. **Combined Filters:**
   - The SQLite search module must build dynamic queries using bound parameters (`bind params`) to prevent SQL injection.

## 6. AI Agent Validation Checklist

Before proposing or committing code, the agent must verify:

- [ ] Does the code respect the separation between Main, Preload, and Renderer?
- [ ] Were types added or updated in TypeScript without using `any`?
- [ ] Is database or FileSystem access performed through `ipcRenderer.invoke` / `ipcMain.handle`?
- [ ] Are component and interface names consistently maintained in English?

---
