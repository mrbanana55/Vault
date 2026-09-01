import type { IpcMain } from 'electron';
import type Database from 'better-sqlite3';
import fs from 'fs';
import type {
  AudioNote,
  CreateAudioNoteInput,
  UpdateAudioNoteInput,
  NoteFilters,
  Instrument,
  IPCResult,
} from '@shared/types';
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
} from '../db/note-repository';

export function registerNoteHandlers(ipc: IpcMain, db: Database.Database): void {
  ipc.handle(
    'notes:create',
    async (_event, input: CreateAudioNoteInput): Promise<IPCResult<AudioNote>> => {
      try {
        const note = createNote(db, input);
        return { success: true, data: note };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    }
  );

  ipc.handle(
    'notes:get-all',
    async (_event, filters?: NoteFilters): Promise<IPCResult<AudioNote[]>> => {
      try {
        const notes = getNotes(db, filters);
        return { success: true, data: notes };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    }
  );

  ipc.handle(
    'notes:get-by-id',
    async (
      _event,
      id: number
    ): Promise<IPCResult<AudioNote & { instruments: Instrument[] }>> => {
      try {
        const note = getNoteById(db, id);
        if (!note) {
          return { success: false, error: `Note with id ${id} not found` };
        }
        return { success: true, data: note };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    }
  );

  ipc.handle(
    'notes:update',
    async (_event, input: UpdateAudioNoteInput): Promise<IPCResult<AudioNote>> => {
      try {
        const note = updateNote(db, input);
        return { success: true, data: note };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    }
  );

  ipc.handle(
    'notes:delete',
    async (_event, id: number): Promise<IPCResult<{ file_missing: boolean }>> => {
      try {
        const result = deleteNote(db, id);
        if (!result) {
          return { success: false, error: `Note with id ${id} not found` };
        }
        let fileMissing = false;
        try {
          await fs.promises.unlink(result.file_path);
        } catch (err: unknown) {
          if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
            fileMissing = true;
          } else {
            throw err;
          }
        }
        return { success: true, data: { file_missing: fileMissing } };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    }
  );
}
