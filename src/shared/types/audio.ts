/** Union of all supported audio file extension formats. */
export type AudioFormat = 'wav' | 'mp3' | 'm4a' | 'ogg' | 'flac';

/** Readonly whitelist array of supported audio formats. */
export const SUPPORTED_AUDIO_FORMATS: readonly AudioFormat[] = [
  'wav',
  'mp3',
  'm4a',
  'ogg',
  'flac',
] as const;

/** Type guard to check if a string matches a supported audio format. */
export function isSupportedAudioFormat(ext: string): ext is AudioFormat {
  return (SUPPORTED_AUDIO_FORMATS as readonly string[]).includes(ext.toLowerCase());
}

/** Result returned after successfully ingesting an audio file (via recording or import). */
export interface AudioIngestionResult {
  /** Relative path stored in database (e.g. 'recordings/{uuid}.wav'). */
  relativePath: string;
  /** Full resolved path on disk. */
  absolutePath: string;
  /** Validated format of the ingested audio. */
  format: AudioFormat;
  /** File size in bytes. */
  sizeBytes: number;
}

/** Error codes for audio validation failures. */
export type AudioValidationErrorCode =
  | 'UNSUPPORTED_EXTENSION'
  | 'HEADER_MISMATCH'
  | 'FILE_UNREADABLE';

/** Custom error class representing audio validation failures. */
export class AudioValidationError extends Error {
  readonly code: AudioValidationErrorCode;

  constructor(message: string, code: AudioValidationErrorCode) {
    super(message);
    this.name = 'AudioValidationError';
    this.code = code;
    Object.setPrototypeOf(this, AudioValidationError.prototype);
  }
}

/** Binary audio payload transmitted across IPC from Renderer to Main. */
export interface AudioPayload {
  buffer: ArrayBuffer;
  format: AudioFormat;
}

