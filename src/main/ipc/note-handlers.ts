import type { IpcMain } from 'electron';
import type Database from 'better-sqlite3';
import {
  IPC_CHANNELS,
  toErrorMessage,
  type AudioNote,
  type CreateAudioNoteInput,
  type UpdateAudioNoteInput,
  type NoteFilters,
  type Instrument,
  type IPCResult,
} from '@shared/types';
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
} from '../db/note-repository';
import type { AudioStorageService } from '../audio';

export function registerNoteHandlers(
  ipc: IpcMain,
  db: Database.Database,
  audioService: AudioStorageService
): void {
  ipc.handle(
    IPC_CHANNELS.NOTES.CREATE,
    async (_event, input: CreateAudioNoteInput): Promise<IPCResult<AudioNote>> => {
      try {
        let filePath = input.file_path;

        if (input.audio_buffer) {
          const buffer = Buffer.from(input.audio_buffer);
          const format = input.format || 'wav';
          const ingestion = audioService.writeRecording(buffer, format);
          filePath = ingestion.relativePath;
        }

        if (!filePath) {
          throw new Error('Either file_path or audio_buffer must be provided');
        }

        const note = createNote(db, {
          ...input,
          file_path: filePath,
        });
        return { success: true, data: note };
      } catch (err: unknown) {
        return { success: false, error: toErrorMessage(err) };
      }
    }
  );

  ipc.handle(
    IPC_CHANNELS.NOTES.GET_ALL,
    async (_event, filters?: NoteFilters): Promise<IPCResult<AudioNote[]>> => {
      try {
        const notes = getNotes(db, filters);
        return { success: true, data: notes };
      } catch (err: unknown) {
        return { success: false, error: toErrorMessage(err) };
      }
    }
  );

  ipc.handle(
    IPC_CHANNELS.NOTES.GET_BY_ID,
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
        return { success: false, error: toErrorMessage(err) };
      }
    }
  );

  ipc.handle(
    IPC_CHANNELS.NOTES.UPDATE,
    async (_event, input: UpdateAudioNoteInput): Promise<IPCResult<AudioNote>> => {
      try {
        const note = updateNote(db, input);
        return { success: true, data: note };
      } catch (err: unknown) {
        return { success: false, error: toErrorMessage(err) };
      }
    }
  );

  ipc.handle(
    IPC_CHANNELS.NOTES.DELETE,
    async (_event, id: number): Promise<IPCResult<{ file_missing: boolean }>> => {
      try {
        const result = deleteNote(db, id);
        if (!result) {
          return { success: false, error: `Note with id ${id} not found` };
        }
        const deleteResult = audioService.deleteFile(result.file_path);
        return { success: true, data: { file_missing: deleteResult.missing } };
      } catch (err: unknown) {
        return { success: false, error: toErrorMessage(err) };
      }
    }
  );
}
