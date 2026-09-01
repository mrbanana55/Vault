import type {
  CreateAudioNoteInput,
  UpdateAudioNoteInput,
  NoteFilters,
  AudioNote,
  Instrument,
  IPCResult,
} from '@shared/types';

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
