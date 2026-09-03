import { contextBridge, ipcRenderer } from "electron";
import {
  IPC_CHANNELS,
  type CreateAudioNoteInput,
  type UpdateAudioNoteInput,
  type NoteFilters,
  type AudioNote,
  type Instrument,
  type IPCResult,
  type VaultAPI,
  type AudioFormat,
  type AudioIngestionResult,
} from "@shared/types";

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
};

contextBridge.exposeInMainWorld("vaultAPI", vaultAPI);
