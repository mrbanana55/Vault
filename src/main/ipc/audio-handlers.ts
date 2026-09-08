import { dialog, type IpcMain } from 'electron';
import path from 'path';
import type Database from 'better-sqlite3';
import {
  IPC_CHANNELS,
  toErrorMessage,
  type AudioIngestionResult,
  type AudioNote,
  type ImportAudioFileInput,
  type SaveAudioFileInput,
  type IPCResult,
} from '../../shared/types';
import type { AudioStorageService } from '../audio';
import { createNote } from '../db/note-repository';

export function registerAudioHandlers(
  ipc: IpcMain,
  audioService: AudioStorageService,
  db?: Database.Database
): void {
  ipc.handle(
    IPC_CHANNELS.AUDIO.SAVE_FILE,
    async (
      _event,
      input: SaveAudioFileInput
    ): Promise<IPCResult<AudioIngestionResult>> => {
      try {
        if (!input || !input.buffer) {
          throw new Error('Missing audio buffer in saveAudioFile payload');
        }
        const format = input.format || 'wav';
        const buffer = Buffer.from(input.buffer);
        const result = audioService.writeRecording(buffer, format);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: toErrorMessage(err) };
      }
    }
  );

  ipc.handle(
    IPC_CHANNELS.AUDIO.IMPORT_FILE,
    async (
      _event,
      input: ImportAudioFileInput
    ): Promise<IPCResult<AudioNote>> => {
      try {
        if (!input || !input.source_path) {
          throw new Error('Missing source_path in importAudioFile payload');
        }
        if (!db) {
          throw new Error('Database connection is not initialized for audio import');
        }

        const ingestion = audioService.importFile(input.source_path);
        const parsedTitle = input.title?.trim() || path.parse(input.source_path).name;

        const note = createNote(db, {
          ...input,
          title: parsedTitle,
          file_path: ingestion.relativePath,
          duration_seconds: input.duration_seconds,
        });

        return { success: true, data: note };
      } catch (err: unknown) {
        return { success: false, error: toErrorMessage(err) };
      }
    }
  );

  ipc.handle(
    IPC_CHANNELS.AUDIO.OPEN_FILE_DIALOG,
    async (): Promise<IPCResult<string[]>> => {
      try {
        const result = await dialog.showOpenDialog({
          properties: ['openFile', 'multiSelections'],
          filters: [
            {
              name: 'Audio Files',
              extensions: ['wav', 'mp3', 'm4a', 'ogg', 'flac'],
            },
          ],
        });

        if (result.canceled) {
          return { success: true, data: [] };
        }

        return { success: true, data: result.filePaths };
      } catch (err: unknown) {
        return { success: false, error: toErrorMessage(err) };
      }
    }
  );
}
