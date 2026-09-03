import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';
import { runMigrations } from '../../db/migrations';
import { registerNoteHandlers } from '../note-handlers';
import { registerInstrumentHandlers } from '../instrument-handlers';
import { registerAudioHandlers } from '../audio-handlers';
import { AudioStorageService } from '../../audio';
import { IPC_CHANNELS } from '@shared/ipc-channels';
import { toErrorMessage } from '@shared/types';
import type { IpcMain } from 'electron';

describe('IPC Handlers', () => {
  let dbPath: string;
  let db: Database.Database;
  let handlers: Map<string, (_event: unknown, ...args: unknown[]) => Promise<unknown>>;
  let mockIpc: IpcMain;
  let tempDir: string;
  let audioService: AudioStorageService;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-test-ipc-'));
    dbPath = path.join(tempDir, 'test.db');
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    runMigrations(db);

    handlers = new Map();
    mockIpc = {
      handle: vi.fn((channel: string, listener: (_event: unknown, ...args: unknown[]) => Promise<unknown>) => {
        handlers.set(channel, listener);
      }),
    } as unknown as IpcMain;

    audioService = new AudioStorageService(tempDir);
    registerNoteHandlers(mockIpc, db, audioService);
    registerInstrumentHandlers(mockIpc, db);
    registerAudioHandlers(mockIpc, audioService);
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('registers all expected IPC channels using IPC_CHANNELS constants', () => {
    expect(handlers.has(IPC_CHANNELS.NOTES.CREATE)).toBe(true);
    expect(handlers.has(IPC_CHANNELS.NOTES.GET_ALL)).toBe(true);
    expect(handlers.has(IPC_CHANNELS.NOTES.GET_BY_ID)).toBe(true);
    expect(handlers.has(IPC_CHANNELS.NOTES.UPDATE)).toBe(true);
    expect(handlers.has(IPC_CHANNELS.NOTES.DELETE)).toBe(true);
    expect(handlers.has(IPC_CHANNELS.INSTRUMENTS.GET_ALL)).toBe(true);
    expect(handlers.has(IPC_CHANNELS.AUDIO.SAVE_FILE)).toBe(true);
  });

  it('handles notes:create returning success envelope', async () => {
    const createHandler = handlers.get(IPC_CHANNELS.NOTES.CREATE)!;
    const res = (await createHandler({}, {
      title: 'IPC Test Note',
      file_path: '/audio/test.wav',
      duration_seconds: 15.5,
      instrument_names: ['Piano'],
    })) as { success: boolean; data?: { id: number; title: string } };

    expect(res.success).toBe(true);
    expect(res.data?.title).toBe('IPC Test Note');
  });

  it('handles notes:delete when audio file exists on disk', async () => {
    const audioFilePath = path.join(tempDir, 'audio.wav');
    fs.writeFileSync(audioFilePath, 'dummy audio data');

    const createHandler = handlers.get(IPC_CHANNELS.NOTES.CREATE)!;
    const createRes = (await createHandler({}, {
      file_path: audioFilePath,
      duration_seconds: 10,
    })) as { success: boolean; data: { id: number } };

    const deleteHandler = handlers.get(IPC_CHANNELS.NOTES.DELETE)!;
    const deleteRes = (await deleteHandler({}, createRes.data.id)) as {
      success: boolean;
      data?: { file_missing: boolean };
    };

    expect(deleteRes.success).toBe(true);
    expect(deleteRes.data?.file_missing).toBe(false);
    expect(fs.existsSync(audioFilePath)).toBe(false);
  });

  it('handles notes:delete gracefully when audio file is already missing on disk (ENOENT)', async () => {
    const nonExistentPath = path.join(tempDir, 'already-gone.wav');

    const createHandler = handlers.get(IPC_CHANNELS.NOTES.CREATE)!;
    const createRes = (await createHandler({}, {
      file_path: nonExistentPath,
      duration_seconds: 10,
    })) as { success: boolean; data: { id: number } };

    const deleteHandler = handlers.get(IPC_CHANNELS.NOTES.DELETE)!;
    const deleteRes = (await deleteHandler({}, createRes.data.id)) as {
      success: boolean;
      data?: { file_missing: boolean };
    };

    expect(deleteRes.success).toBe(true);
    expect(deleteRes.data?.file_missing).toBe(true);
  });

  it('handles instruments:get-all returning all instruments in success envelope', async () => {
    const createHandler = handlers.get(IPC_CHANNELS.NOTES.CREATE)!;
    await createHandler({}, {
      file_path: '/path/1.wav',
      duration_seconds: 10,
      instrument_names: ['Flute', 'Violin'],
    });

    const instHandler = handlers.get(IPC_CHANNELS.INSTRUMENTS.GET_ALL)!;
    const res = (await instHandler({})) as {
      success: boolean;
      data?: { name: string }[];
    };

    expect(res.success).toBe(true);
    expect(res.data?.map((i) => i.name)).toEqual(['Flute', 'Violin']);
  });

  describe('Error Envelopes & Coercion (US3)', () => {
    it('returns structured failure envelope when note not found on notes:get-by-id', async () => {
      const getByIdHandler = handlers.get(IPC_CHANNELS.NOTES.GET_BY_ID)!;
      const res = (await getByIdHandler({}, 9999)) as { success: boolean; error: string };

      expect(res.success).toBe(false);
      expect(res.error).toBe('Note with id 9999 not found');
    });

    it('returns structured failure envelope when note not found on notes:delete', async () => {
      const deleteHandler = handlers.get(IPC_CHANNELS.NOTES.DELETE)!;
      const res = (await deleteHandler({}, 9999)) as { success: boolean; error: string };

      expect(res.success).toBe(false);
      expect(res.error).toBe('Note with id 9999 not found');
    });

    it('returns structured failure envelope when database throws an exception', async () => {
      // Closing the database will trigger an error on query
      db.close();

      const getAllHandler = handlers.get(IPC_CHANNELS.NOTES.GET_ALL)!;
      const res = (await getAllHandler({}, {})) as { success: boolean; error: string };

      expect(res.success).toBe(false);
      expect(typeof res.error).toBe('string');
      expect(res.error.length).toBeGreaterThan(0);
    });

    it('returns structured failure envelope on instruments:get-all when db closed', async () => {
      db.close();

      const instHandler = handlers.get(IPC_CHANNELS.INSTRUMENTS.GET_ALL)!;
      const res = (await instHandler({})) as { success: boolean; error: string };

      expect(res.success).toBe(false);
      expect(typeof res.error).toBe('string');
    });

    it('safely coerces Error objects, strings, and non-Error values via toErrorMessage', () => {
      expect(toErrorMessage(new Error('native error'))).toBe('native error');
      expect(toErrorMessage('string error')).toBe('string error');
      expect(toErrorMessage(404)).toBe('404');
      expect(toErrorMessage({ custom: 'object' })).toBe('[object Object]');
      expect(toErrorMessage(null)).toBe('null');
      expect(toErrorMessage(undefined)).toBe('undefined');
    });
  });

  describe('Audio Payload Handling (US5)', () => {
    function createFakeWavArrayBuffer(): ArrayBuffer {
      const buf = Buffer.alloc(44);
      buf.write('RIFF', 0);
      buf.writeUInt32LE(36, 4);
      buf.write('WAVE', 8);
      buf.write('fmt ', 12);
      buf.writeUInt32LE(16, 16);
      buf.writeUInt16LE(1, 20); // PCM
      buf.writeUInt16LE(1, 22); // Mono
      buf.writeUInt32LE(44100, 24);
      buf.writeUInt32LE(88200, 28);
      buf.writeUInt16LE(2, 32);
      buf.writeUInt16LE(16, 34);
      buf.write('data', 36);
      buf.writeUInt32LE(0, 40);
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    }

    it('receives ArrayBuffer audio payload, converts to Buffer, and writes to disk with relative path', async () => {
      const wavArrayBuffer = createFakeWavArrayBuffer();
      const createHandler = handlers.get(IPC_CHANNELS.NOTES.CREATE)!;

      const res = (await createHandler({}, {
        title: 'Recorded Idea',
        audio_buffer: wavArrayBuffer,
        format: 'wav',
        duration_seconds: 5.2,
      })) as { success: boolean; data: { id: number; file_path: string; duration_seconds: number } };

      expect(res.success).toBe(true);
      expect(res.data.file_path).toMatch(/^recordings\/[a-f0-9-]+\.wav$/);

      // Verify the physical file exists in the audio storage vault
      const fullPath = audioService.resolveAbsolutePath(res.data.file_path);
      expect(fs.existsSync(fullPath)).toBe(true);

      const writtenBytes = fs.readFileSync(fullPath);
      expect(writtenBytes.length).toBe(wavArrayBuffer.byteLength);
    });

    it('returns structured failure envelope when audio_buffer fails header validation', async () => {
      const invalidBuffer = new ArrayBuffer(20);
      const createHandler = handlers.get(IPC_CHANNELS.NOTES.CREATE)!;

      const res = (await createHandler({}, {
        title: 'Corrupted Recording',
        audio_buffer: invalidBuffer,
        format: 'wav',
        duration_seconds: 1.0,
      })) as { success: boolean; error: string };

      expect(res.success).toBe(false);
      expect(res.error).toContain('header validation failed');
    });

    it('returns structured failure envelope when neither file_path nor audio_buffer is provided', async () => {
      const createHandler = handlers.get(IPC_CHANNELS.NOTES.CREATE)!;

      const res = (await createHandler({}, {
        title: 'Missing File',
        duration_seconds: 1.0,
      })) as { success: boolean; error: string };

      expect(res.success).toBe(false);
      expect(res.error).toBe('Either file_path or audio_buffer must be provided');
    });

    it('handles audio:save-file saving WAV payload to disk and returning AudioIngestionResult', async () => {
      const wavArrayBuffer = createFakeWavArrayBuffer();
      const saveHandler = handlers.get(IPC_CHANNELS.AUDIO.SAVE_FILE)!;

      const res = (await saveHandler({}, {
        buffer: wavArrayBuffer,
        format: 'wav',
      })) as { success: boolean; data: { relativePath: string; absolutePath: string; format: string; sizeBytes: number } };

      expect(res.success).toBe(true);
      expect(res.data.relativePath).toMatch(/^recordings\/[a-f0-9-]+\.wav$/);
      expect(res.data.format).toBe('wav');
      expect(res.data.sizeBytes).toBe(wavArrayBuffer.byteLength);
      expect(fs.existsSync(res.data.absolutePath)).toBe(true);
    });

    it('handles audio:save-file returning error envelope when audio buffer is missing or invalid', async () => {
      const saveHandler = handlers.get(IPC_CHANNELS.AUDIO.SAVE_FILE)!;

      const resMissing = (await saveHandler({}, {} as unknown)) as { success: boolean; error: string };
      expect(resMissing.success).toBe(false);
      expect(resMissing.error).toBe('Missing audio buffer in saveAudioFile payload');

      const resInvalid = (await saveHandler({}, { buffer: new ArrayBuffer(10), format: 'wav' })) as { success: boolean; error: string };
      expect(resInvalid.success).toBe(false);
      expect(resInvalid.error).toContain('header validation failed');
    });
  });
});
