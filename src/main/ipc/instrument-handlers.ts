import type { IpcMain } from 'electron';
import type Database from 'better-sqlite3';
import type { Instrument, IPCResult } from '@shared/types';
import { getAllInstruments } from '../db/instrument-repository';

export function registerInstrumentHandlers(ipc: IpcMain, db: Database.Database): void {
  ipc.handle(
    'instruments:get-all',
    async (): Promise<IPCResult<Instrument[]>> => {
      try {
        const instruments = getAllInstruments(db);
        return { success: true, data: instruments };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    }
  );
}
