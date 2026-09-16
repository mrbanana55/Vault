# Interface Contracts: Bottom Recording Dock and Audio Settings

## UI Component and Hook Contracts

### 1. Hook Contract: `useAudioRecordingDock`

Coordinates hardware devices, recording state, volume metering, gain/volume knobs, and take saving.

```typescript
export interface UseAudioRecordingDockReturn {
  // Session State
  state: DockRecordingState;
  elapsedSeconds: number;
  formattedTime: string; // e.g. "00:04"
  error: string | null;

  // Recording Actions
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;

  // Knobs and Levels
  inputGain: number; // 0.0 to 2.0
  setInputGain: (gain: number) => void;
  outputVolume: number; // 0.0 to 1.0
  setOutputVolume: (volume: number) => void;
  inputLevels: MeterSignalLevels;
  outputLevels: MeterSignalLevels;

  // Post-Recording Modal
  isPromptingMetadata: boolean;
  saveIdea: (input: PostRecordingIdeaInput) => Promise<void>;
  discardIdea: () => void;

  // Settings Modal
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  hardwareSettings: AudioHardwareSettings;
  updateHardwareSettings: (updates: Partial<AudioHardwareSettings>) => void;
  availableInputs: AudioDeviceOption[];
  availableOutputs: AudioDeviceOption[];
}
```

### 2. Component Contract: `<RotaryKnob />`

Interactive circular control for gain and volume adjustment.

```typescript
export interface RotaryKnobProps {
  value: number; // Current value (e.g. 1.0)
  min: number; // Minimum value (e.g. 0.0)
  max: number; // Maximum value (e.g. 2.0)
  step?: number; // Granularity (default 0.01)
  defaultValue?: number; // Reset target on double click (e.g. 1.0)
  label: string; // Display label beneath knob (e.g. "GAIN", "VOL")
  tooltip?: string;
  formatValue?: (val: number) => string; // e.g. (val) => `${Math.round(val * 100)}%`
  onChange: (newValue: number) => void;
  size?: number; // Pixel diameter (default 36)
  disabled?: boolean;
}
```

### 3. Component Contract: `<VolumeMeter />`

Visual LED/gradient audio signal level meter with clipping detector.

```typescript
export interface VolumeMeterProps {
  levels: MeterSignalLevels;
  label?: string; // e.g. "IN", "OUT"
  orientation?: 'vertical' | 'horizontal';
  width?: number; // Width in px
  height?: number; // Height in px
  showClipping?: boolean;
}
```

### 4. Component Contract: `<SaveIdeaModal />`

Post-recording metadata prompt modal with strict backdrop/Escape dismissal suppression.

```typescript
export interface SaveIdeaModalProps {
  isOpen: boolean;
  durationSeconds: number;
  onSave: (metadata: PostRecordingIdeaInput) => Promise<void>;
  onDiscard: () => void;
}
```

### 5. Component Contract: `<AudioSettingsModal />`

Modal for hardware device selection and channel input routing.

```typescript
export interface AudioSettingsModalProps {
  isOpen: boolean;
  settings: AudioHardwareSettings;
  availableInputs: AudioDeviceOption[];
  availableOutputs: AudioDeviceOption[];
  onUpdateSettings: (updates: Partial<AudioHardwareSettings>) => void;
  onClose: () => void;
}
```

### 6. Storage Keys

- `vault_selected_audio_device_id`: Active input device ID.
- `vault_selected_audio_output_device_id`: Active output device ID.
- `vault_audio_channel_mode`: Active input channel mode (`'stereo' | 'mono-ch1' | 'mono-ch2'`).
- `vault_input_gain`: Persisted input gain (`0.0` to `2.0`).
- `vault_output_volume`: Persisted master volume (`0.0` to `1.0`).
