import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioRecorder } from '../audio-recorder';
import type { RecordingState } from '@shared/types';
import { validateAudioHeader } from '../../../main/audio/validate-audio-header';

describe('AudioRecorder (US1)', () => {
  let mockStream: MediaStream;
  let mockAudioContext: AudioContext;
  let mockSourceNode: MediaStreamAudioSourceNode;
  let mockGainNode: GainNode;
  let mockPreAnalyser: AnalyserNode;
  let mockPostAnalyser: AnalyserNode;
  let mockDestination: MediaStreamAudioDestinationNode;
  let recorderEvents: { [key: string]: ((event?: unknown) => void)[] };
  let mockMediaRecorder: MediaRecorder;

  beforeEach(() => {
    recorderEvents = {};

    mockStream = {
      getTracks: vi.fn().mockReturnValue([
        {
          stop: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          readyState: 'live',
        },
      ]),
    } as unknown as MediaStream;

    mockPreAnalyser = {
      fftSize: 256,
      getFloatTimeDomainData: vi.fn((array: Float32Array) => {
        array.fill(0.1);
      }),
      disconnect: vi.fn(),
    } as unknown as AnalyserNode;

    mockPostAnalyser = {
      fftSize: 256,
      getFloatTimeDomainData: vi.fn((array: Float32Array) => {
        array.fill(0.2);
      }),
      disconnect: vi.fn(),
    } as unknown as AnalyserNode;

    mockGainNode = {
      gain: { value: 1.0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    } as unknown as GainNode;

    mockSourceNode = {
      connect: vi.fn(),
      disconnect: vi.fn(),
    } as unknown as MediaStreamAudioSourceNode;

    mockDestination = {
      stream: mockStream,
      disconnect: vi.fn(),
    } as unknown as MediaStreamAudioDestinationNode;

    mockAudioContext = {
      state: 'running',
      sampleRate: 44100,
      createMediaStreamSource: vi.fn().mockReturnValue(mockSourceNode),
      createGain: vi.fn().mockReturnValue(mockGainNode),
      createAnalyser: vi.fn()
        .mockReturnValueOnce(mockPreAnalyser)
        .mockReturnValueOnce(mockPostAnalyser),
      createMediaStreamDestination: vi.fn().mockReturnValue(mockDestination),
      decodeAudioData: vi.fn().mockImplementation((_buf: ArrayBuffer) => {
        return Promise.resolve({
          sampleRate: 44100,
          numberOfChannels: 1,
          duration: 2.0,
          getChannelData: () => new Float32Array(88200),
        });
      }),
      resume: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    } as unknown as AudioContext;

    mockMediaRecorder = {
      state: 'inactive',
      start: vi.fn(function (this: { state: string }) {
        this.state = 'recording';
      }),
      stop: vi.fn(function (this: { state: string }) {
        this.state = 'inactive';
        if (recorderEvents['dataavailable']) {
          recorderEvents['dataavailable'].forEach((cb) =>
            cb({ data: new Blob(['fake audio chunk'], { type: 'audio/webm' }) })
          );
        }
        if (recorderEvents['stop']) {
          recorderEvents['stop'].forEach((cb) => cb());
        }
      }),
      pause: vi.fn(function (this: { state: string }) {
        this.state = 'paused';
      }),
      resume: vi.fn(function (this: { state: string }) {
        this.state = 'recording';
      }),
      addEventListener: vi.fn((event: string, handler: (e?: unknown) => void) => {
        if (!recorderEvents[event]) recorderEvents[event] = [];
        recorderEvents[event].push(handler);
      }),
      removeEventListener: vi.fn(),
    } as unknown as MediaRecorder;
  });

  it('initializes in idle state with unity gain', () => {
    const recorder = new AudioRecorder({
      getMediaStream: async () => mockStream,
      createAudioContext: () => mockAudioContext,
      createMediaRecorder: () => mockMediaRecorder,
    });

    expect(recorder.getState()).toBe('idle');
    expect(recorder.getInputGain()).toBe(1.0);
  });

  it('transitions from idle to recording on startRecording', async () => {
    const recorder = new AudioRecorder({
      getMediaStream: async () => mockStream,
      createAudioContext: () => mockAudioContext,
      createMediaRecorder: () => mockMediaRecorder,
    });

    await recorder.startRecording();
    expect(recorder.getState()).toBe('recording');
    expect(mockMediaRecorder.start).toHaveBeenCalled();
  });

  it('passes specific deviceId constraint to getMediaStream when provided (US2)', async () => {
    const getMediaStreamMock = vi.fn().mockResolvedValue(mockStream);
    const recorder = new AudioRecorder({
      getMediaStream: getMediaStreamMock,
      createAudioContext: () => mockAudioContext,
      createMediaRecorder: () => mockMediaRecorder,
    });

    await recorder.startRecording('external-usb-device-id');
    expect(getMediaStreamMock).toHaveBeenCalledWith({
      audio: { deviceId: { exact: 'external-usb-device-id' } },
      video: false,
    });
  });

  it('handles pause and resume lifecycle transitions', async () => {
    const recorder = new AudioRecorder({
      getMediaStream: async () => mockStream,
      createAudioContext: () => mockAudioContext,
      createMediaRecorder: () => mockMediaRecorder,
    });

    await recorder.startRecording();
    recorder.pauseRecording();
    expect(recorder.getState()).toBe('paused');
    expect(mockMediaRecorder.pause).toHaveBeenCalled();

    recorder.resumeRecording();
    expect(recorder.getState()).toBe('recording');
    expect(mockMediaRecorder.resume).toHaveBeenCalled();
  });

  it('stops recording, assembles chunks into Blob, converts to WAV ArrayBuffer, and returns to idle', async () => {
    const recorder = new AudioRecorder({
      getMediaStream: async () => mockStream,
      createAudioContext: () => mockAudioContext,
      createMediaRecorder: () => mockMediaRecorder,
    });

    await recorder.startRecording();
    const resultPromise = recorder.stopRecording();

    expect(recorder.getState()).toBe('processing');
    const result = await resultPromise;

    expect(recorder.getState()).toBe('idle');
    expect(result.arrayBuffer).toBeDefined();
    expect(result.durationSeconds).toBeGreaterThan(0);

    // Verify resulting binary is valid WAV
    expect(validateAudioHeader(Buffer.from(result.arrayBuffer), 'wav')).toBe(true);
  });

  it('throws an error if startRecording is called while already recording', async () => {
    const recorder = new AudioRecorder({
      getMediaStream: async () => mockStream,
      createAudioContext: () => mockAudioContext,
      createMediaRecorder: () => mockMediaRecorder,
    });

    await recorder.startRecording();
    await expect(recorder.startRecording()).rejects.toThrow('Cannot start recording from state: recording');
  });

  it('throws an error if stopRecording is called when idle', async () => {
    const recorder = new AudioRecorder({
      getMediaStream: async () => mockStream,
      createAudioContext: () => mockAudioContext,
      createMediaRecorder: () => mockMediaRecorder,
    });

    await expect(recorder.stopRecording()).rejects.toThrow('Cannot stop recording from state: idle');
  });

  it('updates input gain within clamped bounds [0.0, 2.0] and updates active GainNode (US4)', async () => {
    const recorder = new AudioRecorder({
      getMediaStream: async () => mockStream,
      createAudioContext: () => mockAudioContext,
      createMediaRecorder: () => mockMediaRecorder,
    });

    await recorder.startRecording();
    recorder.setInputGain(1.5);
    expect(recorder.getInputGain()).toBe(1.5);
    expect(mockGainNode.gain.value).toBe(1.5);

    // Test upper clamp
    recorder.setInputGain(3.0);
    expect(recorder.getInputGain()).toBe(2.0);

    // Test lower clamp
    recorder.setInputGain(-0.5);
    expect(recorder.getInputGain()).toBe(0.0);
  });

  it('returns real-time dual meter levels from pre and post analysers (US4)', async () => {
    const recorder = new AudioRecorder({
      getMediaStream: async () => mockStream,
      createAudioContext: () => mockAudioContext,
      createMediaRecorder: () => mockMediaRecorder,
    });

    await recorder.startRecording();
    const levels = recorder.getMeterLevels();

    expect(levels.preGainRms).toBeGreaterThanOrEqual(0);
    expect(levels.preGainPeak).toBeGreaterThanOrEqual(0);
    expect(levels.postGainRms).toBeGreaterThanOrEqual(0);
    expect(levels.postGainPeak).toBeGreaterThanOrEqual(0);
    expect(typeof levels.isClipping).toBe('boolean');
  });
});
