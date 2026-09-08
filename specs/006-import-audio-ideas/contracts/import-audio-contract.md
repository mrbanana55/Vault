# Interface & IPC Contracts: Audio Ideas Import

**Feature**: `006-import-audio-ideas`  
**Date**: 2026-09-08  
**Status**: Completed  

---

## 1. IPC Channel Registry Extensions

In `src/shared/ipc-channels.ts`:

```typescript
export const IPC_CHANNELS = {
  NOTES: {
    CREATE: 'notes:create',
    GET_ALL: 'notes:get-all',
    GET_BY_ID: 'notes:get-by-id',
    UPDATE: 'notes:update',
    DELETE: 'notes:delete',
  },
  INSTRUMENTS: {
    GET_ALL: 'instruments:get-all',
  },
  AUDIO: {
    SAVE_FILE: 'audio:save-file',
    IMPORT_FILE: 'audio:import-file',           // NEW
    OPEN_FILE_DIALOG: 'audio:open-file-dialog', // NEW
  },
} as const;
```

---

## 2. Shared Types

In `src/shared/types/audio.ts` (or `src/shared/types/index.ts`):

```typescript
/** Input payload for importing a file via physical disk copy */
export interface ImportAudioFileInput {
  source_path: string;
  title?: string;
  duration_seconds: number;
  bpm?: number | null;
  musical_key?: string | null;
  authors?: string | null;
  song_section?: string | null;
  notes?: string | null;
  instrument_names?: string[];
}
```

---

## 3. Preload Bridge (`VaultAPI`) Contract

In `src/shared/types/vault-api.ts`:

```typescript
export interface VaultAPI {
  notes: {
    create(input: CreateAudioNoteInput): Promise<IPCResult<AudioNote>>;
    getAll(filters?: NoteFilters): Promise<IPCResult<AudioNote[]>>;
    getById(id: number): Promise<IPCResult<AudioNote & { instruments: Instrument[] }>>;
    update(input: UpdateAudioNoteInput): Promise<IPCResult<AudioNote>>;
    delete(id: number): Promise<IPCResult<{ file_missing: boolean }>>;
  };
  instruments: {
    getAll(): Promise<IPCResult<Instrument[]>>;
  };
  saveAudioFile(buffer: ArrayBuffer, format?: AudioFormat): Promise<IPCResult<AudioIngestionResult>>;
  
  // NEW: Helper to get physical filesystem path from a dropped File
  getPathForFile(file: File): string;

  // NEW: Audio import operations
  importAudioFile(input: ImportAudioFileInput): Promise<IPCResult<AudioNote>>;
  openFileDialog(): Promise<IPCResult<string[]>>;
}
```

---

## 4. Main Process IPC Handler Specifications

### 4.1 `IPC_CHANNELS.AUDIO.IMPORT_FILE`
- **Channel**: `'audio:import-file'`
- **Handler**: `ipcMain.handle(IPC_CHANNELS.AUDIO.IMPORT_FILE, async (_event, input: ImportAudioFileInput))`
- **Behavior**:
  1. Validates `input.source_path` exists on disk.
  2. Calls `audioService.importFile(input.source_path)`:
     - Validates extension against supported whitelist (`wav`, `mp3`, `m4a`, `ogg`, `flac`).
     - Validates magic-byte audio header.
     - Copies file to `app.getPath('userData')/audio_vault/recordings/{uuid}.{format}` via `fs.copyFileSync`.
     - Leaves original file completely untouched.
  3. Inserts row into SQLite `audio_notes` using `createNote(db, { ...input, file_path: ingestion.relativePath })`.
  4. Returns `{ success: true, data: audioNote }`.
  5. Catches errors, converts to string with `toErrorMessage(err)`, and returns `{ success: false, error }`.

### 4.2 `IPC_CHANNELS.AUDIO.OPEN_FILE_DIALOG`
- **Channel**: `'audio:open-file-dialog'`
- **Handler**: `ipcMain.handle(IPC_CHANNELS.AUDIO.OPEN_FILE_DIALOG, async () => ...)`
- **Behavior**:
  1. Invokes Electron's `dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'], filters: [{ name: 'Audio Files', extensions: ['wav', 'mp3', 'm4a', 'ogg', 'flac'] }] })`.
  2. If canceled, returns `{ success: true, data: [] }`.
  3. Otherwise, returns `{ success: true, data: result.filePaths }`.

---

## 5. UI Component Contracts (Renderer)

### 5.1 `<CircularProgressModal />`
- **Location**: `src/renderer/components/CircularProgressModal.tsx`
- **Props**:
  ```typescript
  export interface CircularProgressModalProps {
    isOpen: boolean;
    progressPercentage: number; // 0 to 100
    currentFileName?: string;
    totalFiles: number;
    currentIndex: number;
    isComplete: boolean;
    errors?: Array<{ filename: string; error: string }>;
    onDismiss: () => void;
  }
  ```
- **Visuals**:
  - Circular SVG progress ring with smooth transition (`stroke-dashoffset`).
  - Large centered percentage text (`XX%`).
  - Current filename and progress subtitle (`Importing 2 of 5 files...`).
  - Done state with green checkmark and auto-dismiss after completion.

### 5.2 `<DragDropOverlay />`
- **Location**: `src/renderer/components/DragDropOverlay.tsx`
- **Props**:
  ```typescript
  export interface DragDropOverlayProps {
    isDragging: boolean;
  }
  ```
- **Visuals**:
  - Translucent Apple-style blur overlay (`backdrop-blur-sm bg-surface-primary/80`).
  - Dashed rounded container with music audio icon and `"Drop audio files to import into Vault"`.
