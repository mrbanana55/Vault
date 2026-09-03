import type { IpcMain } from 'electron';
import {
  IPC_CHANNELS,
  toErrorMessage,
  type AudioIngestionResult,
  type SaveAudioFileInput,
  type IPCResult,
} from '@shared/types';
import type { AudioStorageService } from '../audio';

export function registerAudioHandlers(
  ipc: IpcMain,
  audioService: AudioStorageService
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
}
