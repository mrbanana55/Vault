import { contextBridge, ipcRenderer } from "electron";
import type {
  CreateAudioNoteInput,
  UpdateAudioNoteInput,
  NoteFilters,
  AudioNote,
  Instrument,
  IPCResult,
} from "@shared/types";

export const vaultAPI = {
  notes: {
    create: (input: CreateAudioNoteInput): Promise<IPCResult<AudioNote>> =>
      ipcRenderer.invoke("notes:create", input),
    getAll: (filters?: NoteFilters): Promise<IPCResult<AudioNote[]>> =>
      ipcRenderer.invoke("notes:get-all", filters),
    getById: (
      id: number,
    ): Promise<IPCResult<AudioNote & { instruments: Instrument[] }>> =>
      ipcRenderer.invoke("notes:get-by-id", id),
    update: (input: UpdateAudioNoteInput): Promise<IPCResult<AudioNote>> =>
      ipcRenderer.invoke("notes:update", input),
    delete: (id: number): Promise<IPCResult<{ file_missing: boolean }>> =>
      ipcRenderer.invoke("notes:delete", id),
  },
  instruments: {
    getAll: (): Promise<IPCResult<Instrument[]>> =>
      ipcRenderer.invoke("instruments:get-all"),
  },
};

contextBridge.exposeInMainWorld("vaultAPI", vaultAPI);
