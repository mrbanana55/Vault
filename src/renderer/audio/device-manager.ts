import type { AudioInputDevice } from '@shared/types';
import type { AudioDeviceOption, ChannelMode } from '../types/recording-dock';

export const SELECTED_DEVICE_STORAGE_KEY = 'vault_selected_audio_device_id';
export const SELECTED_OUTPUT_DEVICE_STORAGE_KEY = 'vault_selected_audio_output_device_id';
export const SELECTED_CHANNEL_MODE_STORAGE_KEY = 'vault_audio_channel_mode';
export const INPUT_GAIN_STORAGE_KEY = 'vault_input_gain';
export const OUTPUT_VOLUME_STORAGE_KEY = 'vault_output_volume';

/**
 * Enumerates all available audio input devices connected to the host system.
 *
 * @param enumerateDevicesFn Optional custom enumerator (useful for test injection).
 * @returns Array of typed AudioInputDevice objects.
 */
export async function getAudioInputDevices(
  enumerateDevicesFn?: () => Promise<MediaDeviceInfo[]>
): Promise<AudioInputDevice[]> {
  const enumerator =
    enumerateDevicesFn ||
    (() => navigator.mediaDevices.enumerateDevices());

  const devices = await enumerator();
  const audioInputs = devices.filter((d) => d.kind === 'audioinput');

  let defaultFound = false;

  const result: AudioInputDevice[] = audioInputs.map((device, index) => {
    const isDefaultDevice = device.deviceId === 'default' || (!defaultFound && index === 0 && audioInputs.length === 1);
    if (isDefaultDevice) {
      defaultFound = true;
    }

    const label = device.label && device.label.trim().length > 0
      ? device.label.trim()
      : `Microphone ${index + 1}`;

    return {
      deviceId: device.deviceId,
      label,
      isDefault: isDefaultDevice,
    };
  });

  return result;
}

/**
 * Retrieves the persisted deviceId preference from storage.
 */
export function getSelectedDeviceId(storage?: Storage): string | null {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return null;
  return store.getItem(SELECTED_DEVICE_STORAGE_KEY);
}

/**
 * Persists the selected deviceId preference to storage.
 */
export function setSelectedDeviceId(deviceId: string, storage?: Storage): void {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return;
  store.setItem(SELECTED_DEVICE_STORAGE_KEY, deviceId);
}

/**
 * Clears the persisted deviceId preference.
 */
export function clearSelectedDeviceId(storage?: Storage): void {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return;
  store.removeItem(SELECTED_DEVICE_STORAGE_KEY);
}

export interface DeviceChangeSubscriptionOptions {
  mediaDevices?: MediaDevices;
  enumerateDevicesFn?: () => Promise<MediaDeviceInfo[]>;
  storage?: Storage;
  onDevicesChanged?: (devices: AudioInputDevice[]) => void;
  onActiveDeviceDisconnected?: (fallbackDevice: AudioInputDevice | null) => void;
}

/**
 * Listens to devicechange hardware events, notifies listeners, and handles active device disconnection fallback.
 *
 * @param options Subscription configuration and callbacks.
 * @returns Cleanup function to unsubscribe the listener.
 */
export function subscribeToDeviceChanges(
  options: DeviceChangeSubscriptionOptions = {}
): () => void {
  const mediaDevices =
    options.mediaDevices ||
    (typeof navigator !== 'undefined' ? navigator.mediaDevices : null);

  if (!mediaDevices || typeof mediaDevices.addEventListener !== 'function') {
    return () => {};
  }

  const listener = async () => {
    const devices = await getAudioInputDevices(options.enumerateDevicesFn);
    if (options.onDevicesChanged) {
      options.onDevicesChanged(devices);
    }

    const currentSelectedId = getSelectedDeviceId(options.storage);
    if (currentSelectedId) {
      const stillPresent = devices.some((d) => d.deviceId === currentSelectedId);
      if (!stillPresent) {
        const defaultDevice = devices.find((d) => d.isDefault) || devices[0] || null;
        if (defaultDevice) {
          setSelectedDeviceId(defaultDevice.deviceId, options.storage);
        } else {
          clearSelectedDeviceId(options.storage);
        }

        if (options.onActiveDeviceDisconnected) {
          options.onActiveDeviceDisconnected(defaultDevice);
        }
      }
    }
  };

  mediaDevices.addEventListener('devicechange', listener);

  return () => {
    mediaDevices.removeEventListener('devicechange', listener);
  };
}

/**
 * Enumerates all available audio output devices connected to the host system.
 */
export async function getAudioOutputDevices(
  enumerateDevicesFn?: () => Promise<MediaDeviceInfo[]>
): Promise<AudioDeviceOption[]> {
  const enumerator =
    enumerateDevicesFn ||
    (() => navigator.mediaDevices.enumerateDevices());

  const devices = await enumerator();
  const audioOutputs = devices.filter((d) => d.kind === 'audiooutput');

  let defaultFound = false;

  return audioOutputs.map((device, index) => {
    const isDefaultDevice =
      device.deviceId === 'default' || (!defaultFound && index === 0 && audioOutputs.length === 1);
    if (isDefaultDevice) {
      defaultFound = true;
    }

    const label =
      device.label && device.label.trim().length > 0
        ? device.label.trim()
        : `Speaker ${index + 1}`;

    return {
      deviceId: device.deviceId,
      label,
      isDefault: isDefaultDevice,
      kind: 'audiooutput',
    };
  });
}

export function getSelectedOutputDeviceId(storage?: Storage): string | null {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return null;
  return store.getItem(SELECTED_OUTPUT_DEVICE_STORAGE_KEY);
}

export function setSelectedOutputDeviceId(deviceId: string, storage?: Storage): void {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return;
  store.setItem(SELECTED_OUTPUT_DEVICE_STORAGE_KEY, deviceId);
}

export function clearSelectedOutputDeviceId(storage?: Storage): void {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return;
  store.removeItem(SELECTED_OUTPUT_DEVICE_STORAGE_KEY);
}

export function getChannelMode(storage?: Storage): ChannelMode {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return 'stereo';
  const val = store.getItem(SELECTED_CHANNEL_MODE_STORAGE_KEY);
  if (val === 'mono-ch1' || val === 'mono-ch2' || val === 'stereo') {
    return val;
  }
  return 'stereo';
}

export function setChannelMode(mode: ChannelMode, storage?: Storage): void {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return;
  store.setItem(SELECTED_CHANNEL_MODE_STORAGE_KEY, mode);
}

export function getStoredInputGain(storage?: Storage): number {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return 1.0;
  const val = store.getItem(INPUT_GAIN_STORAGE_KEY);
  if (val === null) return 1.0;
  const parsed = parseFloat(val);
  return Number.isFinite(parsed) ? Math.max(0.0, Math.min(2.0, parsed)) : 1.0;
}

export function setStoredInputGain(gain: number, storage?: Storage): void {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return;
  store.setItem(INPUT_GAIN_STORAGE_KEY, String(gain));
}

export function getStoredOutputVolume(storage?: Storage): number {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return 1.0;
  const val = store.getItem(OUTPUT_VOLUME_STORAGE_KEY);
  if (val === null) return 1.0;
  const parsed = parseFloat(val);
  return Number.isFinite(parsed) ? Math.max(0.0, Math.min(2.0, parsed)) : 1.0;
}

export function setStoredOutputVolume(volume: number, storage?: Storage): void {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return;
  store.setItem(OUTPUT_VOLUME_STORAGE_KEY, String(volume));
}

