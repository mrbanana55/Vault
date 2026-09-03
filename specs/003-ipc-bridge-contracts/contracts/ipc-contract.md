# IPC Contract: Vault Bridge API

**Feature**: 003-ipc-bridge-contracts
**Date**: 2026-09-03
**Protocol**: Electron IPC (`ipcRenderer.invoke` / `ipcMain.handle`)

## Channel Registry

All channels follow the `{domain}:{action}` naming convention. The registry is defined as a single `as const` object in `src/shared/ipc-channels.ts`.

### Notes Domain

| Channel Constant | String Value | Direction | Input Type | Output Type |
|------------------|-------------|-----------|------------|-------------|
| `IPC_CHANNELS.NOTES.CREATE` | `notes:create` | Renderer → Main | `CreateAudioNoteInput` | `IPCResult<AudioNote>` |
| `IPC_CHANNELS.NOTES.GET_ALL` | `notes:get-all` | Renderer → Main | `NoteFilters?` (optional) | `IPCResult<AudioNote[]>` |
| `IPC_CHANNELS.NOTES.GET_BY_ID` | `notes:get-by-id` | Renderer → Main | `number` (id) | `IPCResult<AudioNote & { instruments: Instrument[] }>` |
| `IPC_CHANNELS.NOTES.UPDATE` | `notes:update` | Renderer → Main | `UpdateAudioNoteInput` | `IPCResult<AudioNote>` |
| `IPC_CHANNELS.NOTES.DELETE` | `notes:delete` | Renderer → Main | `number` (id) | `IPCResult<{ file_missing: boolean }>` |

### Instruments Domain

| Channel Constant | String Value | Direction | Input Type | Output Type |
|------------------|-------------|-----------|------------|-------------|
| `IPC_CHANNELS.INSTRUMENTS.GET_ALL` | `instruments:get-all` | Renderer → Main | _(none)_ | `IPCResult<Instrument[]>` |

## Response Envelope

Every channel returns an `IPCResult<T>` discriminated union:

```typescript
// Success case
{ success: true, data: T }

// Error case
{ success: false, error: string }
```

### Error Handling Contract

| Condition | Handler Behavior | Error String |
|-----------|-----------------|-------------|
| Entity not found | Return failure envelope | `"Note with id {id} not found"` |
| Database error | Catch, return failure | Exception message (no stack trace) |
| Validation failure | Catch, return failure | Descriptive validation error |
| Non-Error throw | Coerce via `toErrorMessage()` | `String(thrown_value)` |

**Guarantee**: No handler will ever throw an exception to the Renderer. All errors are caught and wrapped in the `IPCResult` failure variant.

## Exposed Bridge Surface

The Renderer accesses IPC exclusively through `window.vaultAPI`, exposed via `contextBridge.exposeInMainWorld("vaultAPI", ...)`.

```typescript
interface VaultAPI {
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
}
```

### Window Augmentation

```typescript
declare global {
  interface Window {
    vaultAPI: VaultAPI;
  }
}
```

## Security Boundaries

| Property | Value | Enforcement |
|----------|-------|-------------|
| `contextIsolation` | `true` | `BrowserWindow.webPreferences` |
| `nodeIntegration` | `false` | `BrowserWindow.webPreferences` |
| Exposed globals | `vaultAPI` only | `contextBridge.exposeInMainWorld` |
| `ipcRenderer` access | Blocked from Renderer | Not exposed via contextBridge |
| `require` / `process` | Blocked from Renderer | contextIsolation + no nodeIntegration |

## Payload Type References

All payload types are defined in `src/shared/types/` and re-exported through the barrel `src/shared/types/index.ts`:

| Type | Source File | Used By Channels |
|------|------------|-----------------|
| `AudioNote` | `audio-note.ts` | All `notes:*` channels |
| `CreateAudioNoteInput` | `audio-note.ts` | `notes:create` |
| `UpdateAudioNoteInput` | `audio-note.ts` | `notes:update` |
| `NoteFilters` | `filters.ts` | `notes:get-all` |
| `Instrument` | `instrument.ts` | `notes:get-by-id`, `instruments:get-all` |
| `IPCResult<T>` | `ipc.ts` | All channels |

## Extensibility

To add a new IPC channel:

1. Add the channel constant to `IPC_CHANNELS` in `src/shared/ipc-channels.ts` under the appropriate domain (or create a new domain namespace)
2. Define or reuse input/output types in `src/shared/types/`
3. Register the handler in the corresponding `src/main/ipc/*-handlers.ts` file using `ipc.handle(IPC_CHANNELS.DOMAIN.ACTION, ...)`
4. Add the bridge method in `src/preload/index.ts` using `ipcRenderer.invoke(IPC_CHANNELS.DOMAIN.ACTION, ...)`
5. Update the `VaultAPI` interface in `src/shared/types/vault-api.ts`
6. Add tests for both the handler and bridge method
