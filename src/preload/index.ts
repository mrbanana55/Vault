import { contextBridge, ipcRenderer, webUtils } from "electron";
import {
  type CreateAudioNoteInput,
  type UpdateAudioNoteInput,
  type NoteFilters,
  type AudioNote,
  type Instrument,
  type IPCResult,
  type VaultAPI,
  type AudioFormat,
  type AudioIngestionResult,
  type ImportAudioFileInput,
} from "../shared/types";

const IPC_CHANNELS = {
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
    IMPORT_FILE: 'audio:import-file',
    OPEN_FILE_DIALOG: 'audio:open-file-dialog',
  },
} as const;

export const vaultAPI: VaultAPI = {
  notes: {
    create: (input: CreateAudioNoteInput): Promise<IPCResult<AudioNote>> =>
      ipcRenderer.invoke(IPC_CHANNELS.NOTES.CREATE, input),
    getAll: (filters?: NoteFilters): Promise<IPCResult<AudioNote[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.NOTES.GET_ALL, filters),
    getById: (
      id: number,
    ): Promise<IPCResult<AudioNote & { instruments: Instrument[] }>> =>
      ipcRenderer.invoke(IPC_CHANNELS.NOTES.GET_BY_ID, id),
    update: (input: UpdateAudioNoteInput): Promise<IPCResult<AudioNote>> =>
      ipcRenderer.invoke(IPC_CHANNELS.NOTES.UPDATE, input),
    delete: (id: number): Promise<IPCResult<{ file_missing: boolean }>> =>
      ipcRenderer.invoke(IPC_CHANNELS.NOTES.DELETE, id),
  },
  instruments: {
    getAll: (): Promise<IPCResult<Instrument[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.INSTRUMENTS.GET_ALL),
  },
  saveAudioFile: (
    buffer: ArrayBuffer,
    format: AudioFormat = 'wav'
  ): Promise<IPCResult<AudioIngestionResult>> =>
    ipcRenderer.invoke(IPC_CHANNELS.AUDIO.SAVE_FILE, { buffer, format }),
  getPathForFile: (file: File): string => {
    try {
      if (webUtils && typeof webUtils.getPathForFile === 'function') {
        const resolved = webUtils.getPathForFile(file);
        if (resolved) return resolved;
      }
    } catch {
      // Fallback
    }
    return (file as unknown as { path?: string })?.path || '';
  },
  importAudioFile: (input: ImportAudioFileInput): Promise<IPCResult<AudioNote>> =>
    ipcRenderer.invoke(IPC_CHANNELS.AUDIO.IMPORT_FILE, input),
  openFileDialog: (): Promise<IPCResult<string[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.AUDIO.OPEN_FILE_DIALOG),
};

contextBridge.exposeInMainWorld("vaultAPI", vaultAPI);
