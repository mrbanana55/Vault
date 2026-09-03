import type { AudioFormat } from './audio';

/** Represents an audio input device (built-in mic, external interface, etc.) */
export interface AudioInputDevice {
  deviceId: string;
  label: string;
  isDefault: boolean;
}

/** Real-time lifecycle state of an audio recording session */
export type RecordingState = 'idle' | 'recording' | 'paused' | 'processing';

export const RECORDING_STATES: readonly RecordingState[] = [
  'idle',
  'recording',
  'paused',
  'processing',
] as const;

/** Real-time dual volume level metering and clipping detection */
export interface VolumeMeterLevels {
  preGainRms: number;
  preGainPeak: number;
  postGainRms: number;
  postGainPeak: number;
  isClipping: boolean;
}

/** Payload passed across IPC from Renderer to Main to persist audio data */
export interface SaveAudioFileInput {
  buffer: ArrayBuffer;
  format?: AudioFormat;
}
