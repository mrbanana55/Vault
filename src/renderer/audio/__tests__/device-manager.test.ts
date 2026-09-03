import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAudioInputDevices,
  getSelectedDeviceId,
  setSelectedDeviceId,
  clearSelectedDeviceId,
} from '../device-manager';
import type { AudioInputDevice } from '@shared/types';

describe('Device Manager (US2)', () => {
  let mockStorage: Record<string, string>;
  let storageAdapter: Storage;

  beforeEach(() => {
    mockStorage = {};
    storageAdapter = {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, val: string) => {
        mockStorage[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    } as unknown as Storage;
  });

  it('filters only audioinput devices and formats them as AudioInputDevice interfaces', async () => {
    const mockDevices: Partial<MediaDeviceInfo>[] = [
      { deviceId: 'default', kind: 'audioinput', label: 'Default - MacBook Pro Mic' },
      { deviceId: 'mic-1', kind: 'audioinput', label: 'Scarlett 2i2 USB' },
      { deviceId: 'cam-1', kind: 'videoinput', label: 'FaceTime HD Camera' },
      { deviceId: 'speaker-1', kind: 'audiooutput', label: 'Built-in Output' },
    ];

    const enumerateFn = vi.fn().mockResolvedValue(mockDevices as MediaDeviceInfo[]);
    const devices = await getAudioInputDevices(enumerateFn);

    expect(devices).toHaveLength(2);
    expect(devices[0]).toEqual<AudioInputDevice>({
      deviceId: 'default',
      label: 'Default - MacBook Pro Mic',
      isDefault: true,
    });
    expect(devices[1]).toEqual<AudioInputDevice>({
      deviceId: 'mic-1',
      label: 'Scarlett 2i2 USB',
      isDefault: false,
    });
  });

  it('generates fallback labels when hardware device labels are empty', async () => {
    const mockDevices: Partial<MediaDeviceInfo>[] = [
      { deviceId: 'dev-1', kind: 'audioinput', label: '' },
      { deviceId: 'dev-2', kind: 'audioinput', label: '' },
    ];

    const enumerateFn = vi.fn().mockResolvedValue(mockDevices as MediaDeviceInfo[]);
    const devices = await getAudioInputDevices(enumerateFn);

    expect(devices[0].label).toBe('Microphone 1');
    expect(devices[1].label).toBe('Microphone 2');
  });

  it('returns empty array when no audio input devices are detected', async () => {
    const mockDevices: Partial<MediaDeviceInfo>[] = [
      { deviceId: 'cam-1', kind: 'videoinput', label: 'Camera' },
    ];

    const enumerateFn = vi.fn().mockResolvedValue(mockDevices as MediaDeviceInfo[]);
    const devices = await getAudioInputDevices(enumerateFn);

    expect(devices).toEqual([]);
  });

  it('persists and retrieves selected deviceId in storage', () => {
    expect(getSelectedDeviceId(storageAdapter)).toBeNull();

    setSelectedDeviceId('scarlett-usb-id', storageAdapter);
    expect(getSelectedDeviceId(storageAdapter)).toBe('scarlett-usb-id');

    clearSelectedDeviceId(storageAdapter);
    expect(getSelectedDeviceId(storageAdapter)).toBeNull();
  });
});
