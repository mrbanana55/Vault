import type { IpcMain } from 'electron';
import type Database from 'better-sqlite3';
import { registerNoteHandlers } from './note-handlers';
import { registerInstrumentHandlers } from './instrument-handlers';

export function registerAllHandlers(ipc: IpcMain, db: Database.Database): void {
  registerNoteHandlers(ipc, db);
  registerInstrumentHandlers(ipc, db);
}

export * from './note-handlers';
export * from './instrument-handlers';
