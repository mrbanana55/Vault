import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';
import { runMigrations } from '../../db/migrations';
import { registerNoteHandlers } from '../note-handlers';
import { registerInstrumentHandlers } from '../instrument-handlers';
import { AudioStorageService } from '../../audio';
import type { IpcMain } from 'electron';

describe('IPC Handlers', () => {
  let dbPath: string;
  let db: Database.Database;
  let handlers: Map<string, (_event: unknown, ...args: unknown[]) => Promise<unknown>>;
  let mockIpc: IpcMain;
  let tempDir: string;

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

    const audioService = new AudioStorageService(tempDir);
    registerNoteHandlers(mockIpc, db, audioService);
    registerInstrumentHandlers(mockIpc, db);
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('registers all expected IPC channels', () => {
    expect(handlers.has('notes:create')).toBe(true);
    expect(handlers.has('notes:get-all')).toBe(true);
    expect(handlers.has('notes:get-by-id')).toBe(true);
    expect(handlers.has('notes:update')).toBe(true);
    expect(handlers.has('notes:delete')).toBe(true);
    expect(handlers.has('instruments:get-all')).toBe(true);
  });

  it('handles notes:create returning success envelope', async () => {
    const createHandler = handlers.get('notes:create')!;
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

    const createHandler = handlers.get('notes:create')!;
    const createRes = (await createHandler({}, {
      file_path: audioFilePath,
      duration_seconds: 10,
    })) as { success: boolean; data: { id: number } };

    const deleteHandler = handlers.get('notes:delete')!;
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

    const createHandler = handlers.get('notes:create')!;
    const createRes = (await createHandler({}, {
      file_path: nonExistentPath,
      duration_seconds: 10,
    })) as { success: boolean; data: { id: number } };

    const deleteHandler = handlers.get('notes:delete')!;
    const deleteRes = (await deleteHandler({}, createRes.data.id)) as {
      success: boolean;
      data?: { file_missing: boolean };
    };

    expect(deleteRes.success).toBe(true);
    expect(deleteRes.data?.file_missing).toBe(true);
  });

  it('handles instruments:get-all returning all instruments in success envelope', async () => {
    const createHandler = handlers.get('notes:create')!;
    await createHandler({}, {
      file_path: '/path/1.wav',
      duration_seconds: 10,
      instrument_names: ['Flute', 'Violin'],
    });

    const instHandler = handlers.get('instruments:get-all')!;
    const res = (await instHandler({})) as {
      success: boolean;
      data?: { name: string }[];
    };

    expect(res.success).toBe(true);
    expect(res.data?.map((i) => i.name)).toEqual(['Flute', 'Violin']);
  });
});
