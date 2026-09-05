import type { IpcMain } from 'electron';
import type Database from 'better-sqlite3';
import {
  IPC_CHANNELS,
  toErrorMessage,
  type Instrument,
  type IPCResult,
} from '../../shared/types';
import { getAllInstruments } from '../db/instrument-repository';

export function registerInstrumentHandlers(ipc: IpcMain, db: Database.Database): void {
  ipc.handle(
    IPC_CHANNELS.INSTRUMENTS.GET_ALL,
    async (): Promise<IPCResult<Instrument[]>> => {
      try {
        const instruments = getAllInstruments(db);
        return { success: true, data: instruments };
      } catch (err: unknown) {
        return { success: false, error: toErrorMessage(err) };
      }
    }
  );
}
