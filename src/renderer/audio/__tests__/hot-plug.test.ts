import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  subscribeToDeviceChanges,
  setSelectedDeviceId,
  getSelectedDeviceId,
} from '../device-manager';
import type { AudioInputDevice } from '@shared/types';
import { AudioRecorder } from '../audio-recorder';

describe('Hot-Plug Device Change Detection (US3)', () => {
  let mockStorage: Record<string, string>;
  let storageAdapter: Storage;
  let deviceChangeListeners: (() => void)[];
  let mockMediaDevices: MediaDevices;

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

    deviceChangeListeners = [];
    mockMediaDevices = {
      addEventListener: vi.fn((event: string, listener: () => void) => {
        if (event === 'devicechange') {
          deviceChangeListeners.push(listener);
        }
      }),
      removeEventListener: vi.fn((event: string, listener: () => void) => {
        if (event === 'devicechange') {
          deviceChangeListeners = deviceChangeListeners.filter((l) => l !== listener);
        }
      }),
    } as unknown as MediaDevices;
  });

  it('subscribes to devicechange and notifies listeners when hardware devices change', async () => {
    let currentDevices: Partial<MediaDeviceInfo>[] = [
      { deviceId: 'default', kind: 'audioinput', label: 'Default Mic' },
    ];

    const enumerateFn = vi.fn().mockImplementation(() => Promise.resolve(currentDevices as MediaDeviceInfo[]));
    const onDevicesChanged = vi.fn();

    const unsubscribe = subscribeToDeviceChanges({
      mediaDevices: mockMediaDevices,
      enumerateDevicesFn: enumerateFn,
      storage: storageAdapter,
      onDevicesChanged,
    });

    expect(mockMediaDevices.addEventListener).toHaveBeenCalledWith('devicechange', expect.any(Function));

    // Simulate plugging in an external USB audio interface
    currentDevices = [
      { deviceId: 'default', kind: 'audioinput', label: 'Default Mic' },
      { deviceId: 'usb-interface-id', kind: 'audioinput', label: 'Focusrite Scarlett 2i2' },
    ];

    // Trigger the devicechange listener
    for (const listener of deviceChangeListeners) {
      await listener();
    }

    expect(onDevicesChanged).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ deviceId: 'default' }),
        expect.objectContaining({ deviceId: 'usb-interface-id', label: 'Focusrite Scarlett 2i2' }),
      ])
    );

    // Unsubscribe removes listener
    unsubscribe();
    expect(mockMediaDevices.removeEventListener).toHaveBeenCalledWith('devicechange', expect.any(Function));
  });

  it('detects when currently selected active device is disconnected and triggers fallback to default', async () => {
    setSelectedDeviceId('usb-interface-id', storageAdapter);

    // Initial state: USB interface is connected
    let currentDevices: Partial<MediaDeviceInfo>[] = [
      { deviceId: 'default', kind: 'audioinput', label: 'Default Mic' },
      { deviceId: 'usb-interface-id', kind: 'audioinput', label: 'Focusrite Scarlett 2i2' },
    ];

    const enumerateFn = vi.fn().mockImplementation(() => Promise.resolve(currentDevices as MediaDeviceInfo[]));
    const onActiveDeviceDisconnected = vi.fn();

    subscribeToDeviceChanges({
      mediaDevices: mockMediaDevices,
      enumerateDevicesFn: enumerateFn,
      storage: storageAdapter,
      onActiveDeviceDisconnected,
    });

    // Simulate unplugging the USB interface
    currentDevices = [
      { deviceId: 'default', kind: 'audioinput', label: 'Default Mic' },
    ];

    for (const listener of deviceChangeListeners) {
      await listener();
    }

    expect(onActiveDeviceDisconnected).toHaveBeenCalledWith(
      expect.objectContaining({ deviceId: 'default', isDefault: true })
    );
    expect(getSelectedDeviceId(storageAdapter)).toBe('default');
  });

  it('preserves partial audio when active recording device is disconnected mid-recording', async () => {
    let trackEndedHandler: (() => void) | null = null;

    const mockTrack = {
      stop: vi.fn(),
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === 'ended') {
          trackEndedHandler = handler;
        }
      }),
      removeEventListener: vi.fn(),
      readyState: 'live',
    };

    const mockStream = {
      getAudioTracks: vi.fn().mockReturnValue([mockTrack]),
      getTracks: vi.fn().mockReturnValue([mockTrack]),
    } as unknown as MediaStream;

    let mediaRecorderStopCallback: (() => void) | null = null;
    let mediaRecorderDataCallback: ((e: unknown) => void) | null = null;

    const mockMediaRecorder = {
      state: 'inactive',
      start: vi.fn(function (this: { state: string }) {
        this.state = 'recording';
      }),
      stop: vi.fn(function (this: { state: string }) {
        this.state = 'inactive';
        if (mediaRecorderDataCallback) {
          mediaRecorderDataCallback({ data: new Blob(['partial audio data'], { type: 'audio/webm' }) });
        }
        if (mediaRecorderStopCallback) {
          mediaRecorderStopCallback();
        }
      }),
      addEventListener: vi.fn((event: string, handler: (e?: unknown) => void) => {
        if (event === 'dataavailable') mediaRecorderDataCallback = handler;
        if (event === 'stop') mediaRecorderStopCallback = handler;
      }),
      removeEventListener: vi.fn(),
    } as unknown as MediaRecorder;

    const mockAudioContext = {
      state: 'running',
      createMediaStreamSource: vi.fn().mockReturnValue({ connect: vi.fn(), disconnect: vi.fn() }),
      createGain: vi.fn().mockReturnValue({ gain: { value: 1.0 }, connect: vi.fn(), disconnect: vi.fn() }),
      createAnalyser: vi.fn().mockReturnValue({ fftSize: 256, getFloatTimeDomainData: vi.fn(), connect: vi.fn(), disconnect: vi.fn() }),
      createMediaStreamDestination: vi.fn().mockReturnValue({ stream: mockStream, disconnect: vi.fn() }),
      decodeAudioData: vi.fn().mockResolvedValue({
        sampleRate: 44100,
        numberOfChannels: 1,
        duration: 1.5,
        getChannelData: () => new Float32Array(66150),
      }),
      close: vi.fn().mockResolvedValue(undefined),
    } as unknown as AudioContext;

    const onInterruptedMock = vi.fn();

    const recorder = new AudioRecorder({
      getMediaStream: async () => mockStream,
      createAudioContext: () => mockAudioContext,
      createMediaRecorder: () => mockMediaRecorder,
      onRecordingInterrupted: onInterruptedMock,
    });

    await recorder.startRecording();
    expect(recorder.getState()).toBe('recording');

    // Simulate device disconnected hardware event (track 'ended' event fires)
    expect(trackEndedHandler).not.toBeNull();
    trackEndedHandler!();

    // Allow stopRecording promise to resolve
    await vi.waitFor(() => {
      expect(recorder.getState()).toBe('idle');
    });

    expect(onInterruptedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        arrayBuffer: expect.any(ArrayBuffer),
        durationSeconds: expect.any(Number),
      })
    );
  });
});
