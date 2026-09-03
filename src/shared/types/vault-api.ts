import type {
  CreateAudioNoteInput,
  UpdateAudioNoteInput,
  AudioNote,
} from './audio-note';
import type { Instrument } from './instrument';
import type { NoteFilters } from './filters';
import type { IPCResult } from './ipc';

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
}

declare global {
  interface Window {
    vaultAPI: VaultAPI;
  }
}
