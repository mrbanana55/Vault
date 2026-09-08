import type {
  CreateAudioNoteInput,
  UpdateAudioNoteInput,
  AudioNote,
} from './audio-note';
import type { Instrument } from './instrument';
import type { NoteFilters } from './filters';
import type { IPCResult } from './ipc';
import type { AudioFormat, AudioIngestionResult, ImportAudioFileInput } from './audio';

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
  saveAudioFile: (
    buffer: ArrayBuffer,
    format?: AudioFormat
  ) => Promise<IPCResult<AudioIngestionResult>>;
  getPathForFile: (file: File) => string;
  importAudioFile: (input: ImportAudioFileInput) => Promise<IPCResult<AudioNote>>;
  openFileDialog: () => Promise<IPCResult<string[]>>;
}

declare global {
  interface Window {
    vaultAPI: VaultAPI;
  }
}
