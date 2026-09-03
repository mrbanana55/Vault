import type { AudioInputDevice } from '@shared/types';

export const SELECTED_DEVICE_STORAGE_KEY = 'vault_selected_audio_device_id';

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
