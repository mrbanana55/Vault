# IPC Contract: Audio Capture & File Persistence Bridge

**Feature**: 004-audio-capture  
**Date**: 2026-09-03  
**Protocol**: Electron IPC (`ipcRenderer.invoke` / `ipcMain.handle`)  

---

## 1. Channel Registry Extension

We expand `IPC_CHANNELS` in `src/shared/ipc-channels.ts` to include the `AUDIO` domain:

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
  },
} as const;
```

### Channel Specification

| Channel Constant | Literal Value | Direction | Payload | Return Type |
|---|---|---|---|---|
| `IPC_CHANNELS.AUDIO.SAVE_FILE` | `'audio:save-file'` | Renderer → Main | `SaveAudioFileInput` | `Promise<IPCResult<AudioIngestionResult>>` |

---

## 2. Payload Types

Defined in `src/shared/types/audio-capture.ts` (and exported through `@shared/types`):

```typescript
import type { AudioFormat, AudioIngestionResult } from './audio';
import type { IPCResult } from './ipc';

export interface SaveAudioFileInput {
  /** Serialized raw audio binary data */
  buffer: ArrayBuffer;
  /** Audio container format (defaults to 'wav') */
  format?: AudioFormat;
}
```

---

## 3. VaultAPI Bridge Interface Extension

Defined in `src/shared/types/vault-api.ts`:

```typescript
export interface VaultAPI {
  notes: {
    create: (input: CreateAudioNoteInput) => Promise<IPCResult<AudioNote>>;
    getAll: (filters?: NoteFilters) => Promise<IPCResult<AudioNote[]>>;
    getById: (id: number) => Promise<IPCResult<AudioNote & { instruments: Instrument[] }>>;
    update: (input: UpdateAudioNoteInput) => Promise<IPCResult<AudioNote>>;
    delete: (id: number) => Promise<IPCResult<{ file_missing: boolean }>>;
  };
  instruments: {
    getAll: () => Promise<IPCResult<Instrument[]>>;
  };
  /**
   * Directly saves an in-memory audio ArrayBuffer to the audio vault on disk.
   * Returns relative path and metadata for subsequent note creation.
   */
  saveAudioFile: (
    buffer: ArrayBuffer,
    format?: AudioFormat
  ) => Promise<IPCResult<AudioIngestionResult>>;
}
```

---

## 4. Handler Contract (`audio:save-file`)

### Registration (`src/main/ipc/audio-handlers.ts` or `src/main/ipc/note-handlers.ts`)

```typescript
ipc.handle(
  IPC_CHANNELS.AUDIO.SAVE_FILE,
  async (_event, input: SaveAudioFileInput): Promise<IPCResult<AudioIngestionResult>> => {
    try {
      if (!input || !input.buffer) {
        throw new Error('Missing audio buffer in saveAudioFile payload');
      }
      const format = input.format || 'wav';
      const nodeBuffer = Buffer.from(input.buffer);
      const result = audioService.writeRecording(nodeBuffer, format);
      return { success: true, data: result };
    } catch (err: unknown) {
      return { success: false, error: toErrorMessage(err) };
    }
  }
);
```

### Preload Implementation (`src/preload/index.ts`)

```typescript
export const vaultAPI: VaultAPI = {
  // ... existing notes & instruments namespaces
  saveAudioFile: (
    buffer: ArrayBuffer,
    format: AudioFormat = 'wav'
  ): Promise<IPCResult<AudioIngestionResult>> =>
    ipcRenderer.invoke(IPC_CHANNELS.AUDIO.SAVE_FILE, { buffer, format }),
};
```

---

## 5. Security & Boundary Guarantees

1. **Zero Node.js APIs in Renderer**: The Renderer never imports `fs`, `path`, or `child_process`.
2. **Buffer Sanitization**: The IPC bridge receives an isolated `ArrayBuffer` copy structured by Chromium's structured clone algorithm.
3. **Magic Byte Validation**: Main's `AudioStorageService` validates RIFF/WAVE headers before writing to disk.
4. **Path Traversal Defense**: Audio files are strictly isolated to `userData/audio_vault/recordings/{uuid}.{format}`.
