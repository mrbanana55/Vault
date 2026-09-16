export type DockRecordingState =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'processing'
  | 'prompting';

export type ChannelMode = 'stereo' | 'mono-ch1' | 'mono-ch2';

export interface AudioHardwareSettings {
  inputDeviceId: string;
  outputDeviceId: string;
  channelMode: ChannelMode;
  inputGain: number; // 0.0 to 2.0 (default 1.0)
  outputVolume: number; // 0.0 to 1.0 (default 1.0)
}

export interface AudioDeviceOption {
  deviceId: string;
  label: string;
  isDefault: boolean;
  kind: 'audioinput' | 'audiooutput';
}

export interface MeterSignalLevels {
  rms: number; // 0.0 to 1.0
  peak: number; // 0.0 to 1.0
  isClipping: boolean;
}

export interface PostRecordingIdeaInput {
  title: string;
  musical_key?: string;
  bpm?: number | null;
  authors?: string;
  song_section?: string;
  instruments?: string;
  notes?: string;
}
