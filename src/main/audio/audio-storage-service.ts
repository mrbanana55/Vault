import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  type AudioFormat,
  type AudioIngestionResult,
  AudioValidationError,
  isSupportedAudioFormat,
  SUPPORTED_AUDIO_FORMATS,
} from '../../shared/types';
import { validateAudioHeader } from './validate-audio-header';

export class AudioStorageService {
  readonly audioVaultBase: string;
  readonly recordingsDir: string;

  constructor(audioVaultBase: string) {
    this.audioVaultBase = path.resolve(audioVaultBase);
    this.recordingsDir = path.join(this.audioVaultBase, 'recordings');
    this.ensureVaultDirectory();
  }

  /**
   * Ensures the audio vault base directory and the 'recordings' subdirectory exist.
   * Safe and idempotent to call multiple times.
   */
  ensureVaultDirectory(): void {
    if (!fs.existsSync(this.audioVaultBase)) {
      fs.mkdirSync(this.audioVaultBase, { recursive: true });
    }
    if (!fs.existsSync(this.recordingsDir)) {
      fs.mkdirSync(this.recordingsDir, { recursive: true });
    }
  }

  /**
   * Resolves a relative path to an absolute path within the audio vault.
   * Enforces path containment to prevent directory traversal vulnerabilities.
   *
   * @param relativePath Path relative to audioVaultBase (e.g. 'recordings/{uuid}.wav')
   * @throws Error if the resolved path escapes the vault boundary.
   */
  resolveAbsolutePath(relativePath: string): string {
    const resolved = path.resolve(this.audioVaultBase, relativePath);
    const prefix = this.audioVaultBase.endsWith(path.sep)
      ? this.audioVaultBase
      : this.audioVaultBase + path.sep;

    if (!resolved.startsWith(prefix) && resolved !== this.audioVaultBase) {
      throw new Error(`Path traversal detected: "${relativePath}" escapes vault base`);
    }

    return resolved;
  }

  /**
   * Writes raw audio buffer from the Renderer directly to a unique file in the vault.
   *
   * @param buffer Raw audio binary data.
   * @param format Claimed audio format.
   * @returns AudioIngestionResult containing relative path for database storage.
   */
  writeRecording(buffer: Buffer, format: AudioFormat): AudioIngestionResult {
    if (!isSupportedAudioFormat(format)) {
      throw new AudioValidationError(
        `Unsupported audio format: "${format}". Supported formats are: ${SUPPORTED_AUDIO_FORMATS.join(', ')}`,
        'UNSUPPORTED_EXTENSION'
      );
    }

    if (!validateAudioHeader(buffer, format)) {
      throw new AudioValidationError(
        `Audio header validation failed: binary content does not match expected signature for "${format}"`,
        'HEADER_MISMATCH'
      );
    }

    this.ensureVaultDirectory();

    const uuid = crypto.randomUUID();
    const relativePath = `recordings/${uuid}.${format}`;
    const absolutePath = this.resolveAbsolutePath(relativePath);

    fs.writeFileSync(absolutePath, buffer);

    return {
      relativePath,
      absolutePath,
      format,
      sizeBytes: buffer.length,
    };
  }

  /**
   * Copies an external audio file into the vault after validating extension and header.
   * Preserves the original file untouched.
   *
   * @param sourcePath Absolute path to external file on disk.
   * @returns AudioIngestionResult containing relative path for database storage.
   */
  importFile(sourcePath: string): AudioIngestionResult {
    const rawExt = path.extname(sourcePath).replace(/^\./, '').toLowerCase();

    if (!isSupportedAudioFormat(rawExt)) {
      throw new AudioValidationError(
        `Unsupported audio extension: "${rawExt}". Supported extensions are: ${SUPPORTED_AUDIO_FORMATS.join(', ')}`,
        'UNSUPPORTED_EXTENSION'
      );
    }

    let fd: number | null = null;
    const header = Buffer.alloc(12);
    let bytesRead = 0;
    try {
      fd = fs.openSync(sourcePath, 'r');
      bytesRead = fs.readSync(fd, header, 0, 12, 0);
    } catch (err: unknown) {
      throw new AudioValidationError(
        `Cannot read audio file at "${sourcePath}": ${(err as Error).message}`,
        'FILE_UNREADABLE'
      );
    } finally {
      if (fd !== null) {
        try {
          fs.closeSync(fd);
        } catch {
          // ignore close error
        }
      }
    }

    const headerSlice = header.subarray(0, bytesRead);
    if (!validateAudioHeader(headerSlice, rawExt)) {
      throw new AudioValidationError(
        `Audio header validation failed: binary content of "${sourcePath}" does not match signature for "${rawExt}"`,
        'HEADER_MISMATCH'
      );
    }

    this.ensureVaultDirectory();

    const uuid = crypto.randomUUID();
    const relativePath = `recordings/${uuid}.${rawExt}`;
    const absolutePath = this.resolveAbsolutePath(relativePath);

    fs.copyFileSync(sourcePath, absolutePath);
    const sizeBytes = fs.statSync(absolutePath).size;

    return {
      relativePath,
      absolutePath,
      format: rawExt,
      sizeBytes,
    };
  }

  /**
   * Deletes a physical audio file from the vault.
   *
   * @param relativePath Relative path stored in database.
   * @returns Object indicating whether file was deleted or was already missing.
   * @throws Error if path escapes vault or if unlinking fails for reasons other than ENOENT.
   */
  deleteFile(relativePath: string): { deleted: boolean; missing: boolean } {
    const absolutePath = this.resolveAbsolutePath(relativePath);

    try {
      fs.unlinkSync(absolutePath);
      return { deleted: true, missing: false };
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return { deleted: false, missing: true };
      }
      throw err;
    }
  }
}
