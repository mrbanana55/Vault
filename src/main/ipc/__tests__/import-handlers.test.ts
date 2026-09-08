import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';
import { runMigrations } from '../../db/migrations';
import { registerAudioHandlers } from '../audio-handlers';
import { AudioStorageService } from '../../audio';
import { IPC_CHANNELS } from '@shared/ipc-channels';
import type { IpcMain } from 'electron';
import { dialog } from 'electron';

vi.mock('electron', () => ({
  dialog: {
    showOpenDialog: vi.fn(),
  },
}));

// Valid minimal 44-byte WAV header fixture
function createValidWavBuffer(): Buffer {
  const buf = Buffer.alloc(44);
  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(36, 4);
  buf.write('WAVE', 8, 'ascii');
  buf.write('fmt ', 12, 'ascii');
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(44100, 24);
  buf.writeUInt32LE(88200, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36, 'ascii');
  buf.writeUInt32LE(0, 40);
  return buf;
}

describe('Audio Import IPC Handlers', () => {
  let dbPath: string;
  let db: Database.Database;
  let handlers: Map<string, (_event: unknown, ...args: unknown[]) => Promise<unknown>>;
  let mockIpc: IpcMain;
  let tempDir: string;
  let externalDir: string;
  let audioService: AudioStorageService;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-test-import-vault-'));
    externalDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-test-external-'));
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
    registerAudioHandlers(mockIpc, audioService, db);
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
    fs.rmSync(externalDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('registers audio:import-file and audio:open-file-dialog channels', () => {
    expect(handlers.has(IPC_CHANNELS.AUDIO.IMPORT_FILE)).toBe(true);
    expect(handlers.has(IPC_CHANNELS.AUDIO.OPEN_FILE_DIALOG)).toBe(true);
  });

  it('successfully imports an external audio file, copies it, and creates an active note', async () => {
    const sourceFilePath = path.join(externalDir, 'Midnight Riff.wav');
    const wavContent = createValidWavBuffer();
    fs.writeFileSync(sourceFilePath, wavContent);

    const importHandler = handlers.get(IPC_CHANNELS.AUDIO.IMPORT_FILE)!;
    const res = (await importHandler({}, {
      source_path: sourceFilePath,
      duration_seconds: 4.5,
    })) as { success: boolean; data?: any; error?: string };

    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data.id).toBeDefined();
    expect(res.data.title).toBe('Midnight Riff');
    expect(res.data.duration_seconds).toBe(4.5);
    expect(res.data.is_used).toBe(0);
    expect(res.data.file_path).toMatch(/^recordings\/[0-9a-f-]+\.wav$/);

    // Verify copy exists in vault
    const absoluteVaultPath = path.join(tempDir, res.data.file_path);
    expect(fs.existsSync(absoluteVaultPath)).toBe(true);
    expect(fs.readFileSync(absoluteVaultPath)).toEqual(wavContent);

    // Verify original source file remains untouched
    expect(fs.existsSync(sourceFilePath)).toBe(true);
    expect(fs.readFileSync(sourceFilePath)).toEqual(wavContent);
  });

  it('honors a custom title override if supplied in import input', async () => {
    const sourceFilePath = path.join(externalDir, 'raw_file_001.wav');
    fs.writeFileSync(sourceFilePath, createValidWavBuffer());

    const importHandler = handlers.get(IPC_CHANNELS.AUDIO.IMPORT_FILE)!;
    const res = (await importHandler({}, {
      source_path: sourceFilePath,
      title: 'Polished Idea Title',
      duration_seconds: 12.0,
    })) as { success: boolean; data?: any };

    expect(res.success).toBe(true);
    expect(res.data.title).toBe('Polished Idea Title');
  });

  it('returns failure envelope when source file does not exist', async () => {
    const importHandler = handlers.get(IPC_CHANNELS.AUDIO.IMPORT_FILE)!;
    const res = (await importHandler({}, {
      source_path: path.join(externalDir, 'non_existent.wav'),
      duration_seconds: 5.0,
    })) as { success: boolean; error?: string };

    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('returns failure envelope when file has invalid header', async () => {
    const corruptPath = path.join(externalDir, 'corrupt.wav');
    fs.writeFileSync(corruptPath, Buffer.from('NOT_A_WAV_HEADER_DATA_12345'));

    const importHandler = handlers.get(IPC_CHANNELS.AUDIO.IMPORT_FILE)!;
    const res = (await importHandler({}, {
      source_path: corruptPath,
      duration_seconds: 2.0,
    })) as { success: boolean; error?: string };

    expect(res.success).toBe(false);
    expect(res.error).toContain('header validation failed');
  });

  it('handles audio:open-file-dialog returning selected paths', async () => {
    vi.mocked(dialog.showOpenDialog).mockResolvedValueOnce({
      canceled: false,
      filePaths: ['/Users/music/memo1.wav', '/Users/music/memo2.mp3'],
    });

    const dialogHandler = handlers.get(IPC_CHANNELS.AUDIO.OPEN_FILE_DIALOG)!;
    const res = (await dialogHandler({})) as { success: boolean; data?: string[] };

    expect(res.success).toBe(true);
    expect(res.data).toEqual(['/Users/music/memo1.wav', '/Users/music/memo2.mp3']);
  });

  it('handles audio:open-file-dialog returning empty array when canceled', async () => {
    vi.mocked(dialog.showOpenDialog).mockResolvedValueOnce({
      canceled: true,
      filePaths: [],
    });

    const dialogHandler = handlers.get(IPC_CHANNELS.AUDIO.OPEN_FILE_DIALOG)!;
    const res = (await dialogHandler({})) as { success: boolean; data?: string[] };

    expect(res.success).toBe(true);
    expect(res.data).toEqual([]);
  });
});
