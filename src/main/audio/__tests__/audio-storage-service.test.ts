import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { AudioStorageService } from '../audio-storage-service';
import { AudioValidationError, type AudioFormat } from '@shared/types';

function createValidWavBuffer(extraBytes = 50): Buffer {
  const header = Buffer.from([
    0x52, 0x49, 0x46, 0x46, // 'RIFF'
    0x24, 0x00, 0x00, 0x00,
    0x57, 0x41, 0x56, 0x45, // 'WAVE'
  ]);
  const payload = Buffer.alloc(extraBytes, 0xaa);
  return Buffer.concat([header, payload]);
}

function createValidMp3Buffer(extraBytes = 50): Buffer {
  const header = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]); // 'ID3'
  const payload = Buffer.alloc(extraBytes, 0xbb);
  return Buffer.concat([header, payload]);
}

describe('AudioStorageService', () => {
  let tempDir: string;
  let vaultBase: string;
  let service: AudioStorageService;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-audio-test-'));
    vaultBase = path.join(tempDir, 'audio_vault');
    service = new AudioStorageService(vaultBase);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // T035
  it('constructor creates recordings/ subdirectory inside the provided base path', () => {
    expect(fs.existsSync(vaultBase)).toBe(true);
    const recordingsDir = path.join(vaultBase, 'recordings');
    expect(fs.existsSync(recordingsDir)).toBe(true);
  });

  // T036
  it('ensureVaultDirectory() recreates the directory if it was deleted after construction', () => {
    fs.rmSync(vaultBase, { recursive: true, force: true });
    expect(fs.existsSync(vaultBase)).toBe(false);

    service.ensureVaultDirectory();
    expect(fs.existsSync(vaultBase)).toBe(true);
    expect(fs.existsSync(path.join(vaultBase, 'recordings'))).toBe(true);
  });

  // T037
  it('ensureVaultDirectory() is idempotent — calling it repeatedly causes no error', () => {
    expect(() => {
      service.ensureVaultDirectory();
      service.ensureVaultDirectory();
      service.ensureVaultDirectory();
    }).not.toThrow();
  });

  // T038, T039, T040
  it('writeRecording() creates file on disk with matching content and returns correct result', () => {
    const buffer = createValidWavBuffer(120);
    const result = service.writeRecording(buffer, 'wav');

    expect(result.format).toBe('wav');
    expect(result.sizeBytes).toBe(buffer.length);
    expect(result.relativePath).toMatch(/^recordings\/[0-9a-f-]{36}\.wav$/);
    expect(fs.existsSync(result.absolutePath)).toBe(true);

    const writtenBytes = fs.readFileSync(result.absolutePath);
    expect(writtenBytes.equals(buffer)).toBe(true);
  });

  // T041
  it('writeRecording() throws AudioValidationError with UNSUPPORTED_EXTENSION for unsupported format', () => {
    const buffer = createValidWavBuffer();
    expect(() => {
      service.writeRecording(buffer, 'aac' as unknown as AudioFormat);
    }).toThrowError(AudioValidationError);

    try {
      service.writeRecording(buffer, 'wma' as unknown as AudioFormat);
    } catch (err) {
      expect(err).toBeInstanceOf(AudioValidationError);
      expect((err as AudioValidationError).code).toBe('UNSUPPORTED_EXTENSION');
    }
  });

  // T042
  it('writeRecording() throws AudioValidationError with HEADER_MISMATCH when headers do not match claimed format', () => {
    const invalidBuffer = Buffer.from('This is not a WAV file at all');
    try {
      service.writeRecording(invalidBuffer, 'wav');
      expect.unreachable('Should have thrown AudioValidationError');
    } catch (err) {
      expect(err).toBeInstanceOf(AudioValidationError);
      expect((err as AudioValidationError).code).toBe('HEADER_MISMATCH');
    }
  });

  // T043, T044
  it('importFile() copies source file into recordings/ with UUID filename and original remains untouched', () => {
    const sourceFilePath = path.join(tempDir, 'original_demo.mp3');
    const mp3Buffer = createValidMp3Buffer(200);
    fs.writeFileSync(sourceFilePath, mp3Buffer);

    const result = service.importFile(sourceFilePath);

    // Source remains untouched
    expect(fs.existsSync(sourceFilePath)).toBe(true);
    expect(fs.readFileSync(sourceFilePath).equals(mp3Buffer)).toBe(true);

    // Destination copied inside vault
    expect(result.format).toBe('mp3');
    expect(result.sizeBytes).toBe(mp3Buffer.length);
    expect(result.relativePath).toMatch(/^recordings\/[0-9a-f-]{36}\.mp3$/);
    expect(fs.existsSync(result.absolutePath)).toBe(true);

    const vaultBytes = fs.readFileSync(result.absolutePath);
    expect(vaultBytes.equals(mp3Buffer)).toBe(true);
  });

  // T045
  it('importFile() throws AudioValidationError with UNSUPPORTED_EXTENSION for unsupported extension', () => {
    const sourceFilePath = path.join(tempDir, 'voice_memo.aac');
    fs.writeFileSync(sourceFilePath, 'some audio data');

    try {
      service.importFile(sourceFilePath);
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AudioValidationError);
      expect((err as AudioValidationError).code).toBe('UNSUPPORTED_EXTENSION');
    }
  });

  // T046
  it('importFile() throws AudioValidationError with HEADER_MISMATCH for .wav file with fake headers', () => {
    const fakeWavPath = path.join(tempDir, 'fake.wav');
    fs.writeFileSync(fakeWavPath, Buffer.from('NOT A RIFF HEADER AT ALL'));

    try {
      service.importFile(fakeWavPath);
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AudioValidationError);
      expect((err as AudioValidationError).code).toBe('HEADER_MISMATCH');
    }
  });

  it('importFile() throws AudioValidationError with FILE_UNREADABLE when file does not exist', () => {
    const nonExistent = path.join(tempDir, 'non-existent.mp3');
    try {
      service.importFile(nonExistent);
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AudioValidationError);
      expect((err as AudioValidationError).code).toBe('FILE_UNREADABLE');
    }
  });

  // T047
  it('deleteFile() removes existing file and returns { deleted: true, missing: false }', () => {
    const buffer = createValidWavBuffer();
    const result = service.writeRecording(buffer, 'wav');
    expect(fs.existsSync(result.absolutePath)).toBe(true);

    const deleteRes = service.deleteFile(result.relativePath);
    expect(deleteRes).toEqual({ deleted: true, missing: false });
    expect(fs.existsSync(result.absolutePath)).toBe(false);
  });

  // T048
  it('deleteFile() returns { deleted: false, missing: true } without throwing when file is missing', () => {
    const nonExistentRelative = 'recordings/00000000-0000-0000-0000-000000000000.wav';
    const deleteRes = service.deleteFile(nonExistentRelative);
    expect(deleteRes).toEqual({ deleted: false, missing: true });
  });

  // T049
  it('resolveAbsolutePath() throws an error for path traversal attempts', () => {
    expect(() => {
      service.resolveAbsolutePath('../../etc/passwd');
    }).toThrowError(/Path traversal detected/);

    expect(() => {
      service.resolveAbsolutePath('../other-vault/secret.wav');
    }).toThrowError(/Path traversal detected/);

    expect(() => {
      service.deleteFile('../../../important-system-file');
    }).toThrowError(/Path traversal detected/);
  });

  // T050
  it('resolveAbsolutePath() succeeds for valid relative paths within vault', () => {
    const validRelative = 'recordings/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d.wav';
    const resolved = service.resolveAbsolutePath(validRelative);
    expect(resolved).toBe(path.join(vaultBase, validRelative));
  });

  it('supports all 5 valid formats (wav, mp3, m4a, ogg, flac) via writeRecording', () => {
    const wavBuffer = createValidWavBuffer();
    const mp3Buffer = createValidMp3Buffer();
    const m4aBuffer = Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x4d, 0x34, 0x41, 0x20]);
    const oggBuffer = Buffer.from([0x4f, 0x67, 0x67, 0x53, 0x00, 0x02, 0x00, 0x00]);
    const flacBuffer = Buffer.from([0x66, 0x4c, 0x61, 0x43, 0x00, 0x00, 0x00, 0x22]);

    expect(service.writeRecording(wavBuffer, 'wav').format).toBe('wav');
    expect(service.writeRecording(mp3Buffer, 'mp3').format).toBe('mp3');
    expect(service.writeRecording(m4aBuffer, 'm4a').format).toBe('m4a');
    expect(service.writeRecording(oggBuffer, 'ogg').format).toBe('ogg');
    expect(service.writeRecording(flacBuffer, 'flac').format).toBe('flac');
  });
});
