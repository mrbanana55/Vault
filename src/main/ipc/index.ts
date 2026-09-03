import type { IpcMain } from 'electron';
import type Database from 'better-sqlite3';
import { registerNoteHandlers } from './note-handlers';
import { registerInstrumentHandlers } from './instrument-handlers';
import { registerAudioHandlers } from './audio-handlers';
import type { AudioStorageService } from '../audio';

export function registerAllHandlers(
  ipc: IpcMain,
  db: Database.Database,
  audioService: AudioStorageService
): void {
  registerNoteHandlers(ipc, db, audioService);
  registerInstrumentHandlers(ipc, db);
  registerAudioHandlers(ipc, audioService);
}

export * from './note-handlers';
export * from './instrument-handlers';
export * from './audio-handlers';
