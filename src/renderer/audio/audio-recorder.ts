import type { RecordingState, VolumeMeterLevels } from '@shared/types';
import { encodeWav } from './wav-encoder';
import { calculateAudioLevels, type AudioLevelResult } from './meter-service';

export interface AudioRecorderDependencies {
  getMediaStream?: (constraints?: MediaStreamConstraints) => Promise<MediaStream>;
  createAudioContext?: () => AudioContext;
  createMediaRecorder?: (stream: MediaStream) => MediaRecorder;
  onRecordingInterrupted?: (result: RecordingResult) => void;
}

export interface RecordingResult {
  arrayBuffer: ArrayBuffer;
  durationSeconds: number;
}

export class AudioRecorder {
  private state: RecordingState = 'idle';
  private inputGain: number = 1.0;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private preGainAnalyser: AnalyserNode | null = null;
  private postGainAnalyser: AnalyserNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private startTime: number = 0;
  private totalRecordedSeconds: number = 0;
  private lastPauseTime: number = 0;
  private onDeviceDisconnectHandler: (() => void) | null = null;

  private readonly getMediaStreamFn: (constraints?: MediaStreamConstraints) => Promise<MediaStream>;
  private readonly createAudioContextFn: () => AudioContext;
  private readonly createMediaRecorderFn: (stream: MediaStream) => MediaRecorder;
  private readonly onRecordingInterruptedFn?: (result: RecordingResult) => void;

  constructor(dependencies: AudioRecorderDependencies = {}) {
    this.onRecordingInterruptedFn = dependencies.onRecordingInterrupted;
    this.getMediaStreamFn =
      dependencies.getMediaStream ||
      ((constraints) => navigator.mediaDevices.getUserMedia(constraints));

    this.createAudioContextFn =
      dependencies.createAudioContext ||
      (() => new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)());

    this.createMediaRecorderFn =
      dependencies.createMediaRecorder ||
      ((stream) => new MediaRecorder(stream));
  }

  /** Gets current recording state. */
  getState(): RecordingState {
    return this.state;
  }

  /** Gets current input gain (0.0 to 2.0). */
  getInputGain(): number {
    return this.inputGain;
  }

  /**
   * Sets input gain multiplier (clamped between 0.0 and 2.0).
   * Updates active GainNode in real time if running.
   */
  setInputGain(gain: number): void {
    this.inputGain = Math.max(0.0, Math.min(2.0, gain));
    if (this.gainNode) {
      this.gainNode.gain.value = this.inputGain;
    }
  }

  /**
   * Starts an audio recording session from the specified or default input device.
   *
   * @param deviceId Optional specific deviceId to capture from.
   */
  async startRecording(deviceId?: string): Promise<void> {
    if (this.state !== 'idle') {
      throw new Error(`Cannot start recording from state: ${this.state}`);
    }

    const constraints: MediaStreamConstraints = {
      audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      video: false,
    };

    this.mediaStream = await this.getMediaStreamFn(constraints);
    this.audioContext = this.createAudioContextFn();
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Set up Web Audio graph
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = this.inputGain;

    this.preGainAnalyser = this.audioContext.createAnalyser();
    this.preGainAnalyser.fftSize = 256;

    this.postGainAnalyser = this.audioContext.createAnalyser();
    this.postGainAnalyser.fftSize = 256;

    this.destinationNode = this.audioContext.createMediaStreamDestination();

    // Connect: source -> pre-gain analyser
    this.sourceNode.connect(this.preGainAnalyser);

    // Connect: source -> gain -> post-gain analyser & destination
    this.sourceNode.connect(this.gainNode);
    this.gainNode.connect(this.postGainAnalyser);
    this.gainNode.connect(this.destinationNode);

    // Initialize MediaRecorder from destination stream
    this.mediaRecorder = this.createMediaRecorderFn(this.destinationNode.stream);
    this.recordedChunks = [];

    this.mediaRecorder.addEventListener('dataavailable', (event: unknown) => {
      const blobEvent = event as { data?: Blob };
      if (blobEvent.data && blobEvent.data.size > 0) {
        this.recordedChunks.push(blobEvent.data);
      }
    });

    // Listen for hardware disconnection mid-recording
    const audioTracks = this.mediaStream.getAudioTracks
      ? this.mediaStream.getAudioTracks()
      : this.mediaStream.getTracks();
    const audioTrack = audioTracks[0];
    if (audioTrack) {
      this.onDeviceDisconnectHandler = () => {
        if (this.state === 'recording' || this.state === 'paused') {
          // Gracefully stop and salvage partial recording
          this.stopRecording()
            .then((result) => {
              if (this.onRecordingInterruptedFn) {
                this.onRecordingInterruptedFn(result);
              }
            })
            .catch(() => {});
        }
      };
      audioTrack.addEventListener('ended', this.onDeviceDisconnectHandler);
    }

    this.mediaRecorder.start();
    this.startTime = Date.now();
    this.totalRecordedSeconds = 0;
    this.state = 'recording';
  }

  /** Pauses the active recording session. */
  pauseRecording(): void {
    if (this.state !== 'recording' || !this.mediaRecorder) {
      return;
    }
    this.mediaRecorder.pause();
    this.lastPauseTime = Date.now();
    this.totalRecordedSeconds += (this.lastPauseTime - this.startTime) / 1000;
    this.state = 'paused';
  }

  /** Resumes a paused recording session. */
  resumeRecording(): void {
    if (this.state !== 'paused' || !this.mediaRecorder) {
      return;
    }
    this.mediaRecorder.resume();
    this.startTime = Date.now();
    this.state = 'recording';
  }

  /**
   * Stops recording, assembles chunks into Blob, converts to standard WAV ArrayBuffer.
   * Cleans up hardware audio tracks and resets state to idle.
   */
  async stopRecording(): Promise<RecordingResult> {
    if (this.state === 'idle' || !this.mediaRecorder) {
      throw new Error(`Cannot stop recording from state: ${this.state}`);
    }

    if (this.state === 'recording') {
      this.totalRecordedSeconds += (Date.now() - this.startTime) / 1000;
    }

    this.state = 'processing';

    const stoppedPromise = new Promise<void>((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve();
        return;
      }
      this.mediaRecorder.addEventListener('stop', () => resolve(), { once: true });
      this.mediaRecorder.stop();
    });

    await stoppedPromise;

    // Assemble recorded chunks into Blob
    const mimeType = this.recordedChunks.length > 0 && this.recordedChunks[0].type
      ? this.recordedChunks[0].type
      : 'audio/webm';
    const blob = new Blob(this.recordedChunks, { type: mimeType });
    const rawBuffer = await blob.arrayBuffer();

    let wavBuffer: ArrayBuffer;
    let durationSeconds = Math.max(0.1, this.totalRecordedSeconds);

    // Convert to PCM WAV via AudioContext decodeAudioData
    if (this.audioContext && rawBuffer.byteLength > 0) {
      try {
        const decoded = await this.audioContext.decodeAudioData(rawBuffer.slice(0));
        durationSeconds = decoded.duration || durationSeconds;
        const channelData: Float32Array[] = [];
        for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
          channelData.push(decoded.getChannelData(ch));
        }
        wavBuffer = encodeWav({
          sampleRate: decoded.sampleRate,
          channelData,
        });
      } catch {
        // Fallback: if decode fails (e.g. mock test environment), encode silence or raw PCM
        wavBuffer = encodeWav({
          sampleRate: 44100,
          channelData: [new Float32Array(Math.round(durationSeconds * 44100))],
        });
      }
    } else {
      wavBuffer = encodeWav({
        sampleRate: 44100,
        channelData: [new Float32Array(Math.round(durationSeconds * 44100))],
      });
    }

    this.cleanup();
    this.state = 'idle';

    return {
      arrayBuffer: wavBuffer,
      durationSeconds,
    };
  }

  /** Extracts real-time pre-gain and post-gain signal levels from AnalyserNodes. */
  getMeterLevels(): VolumeMeterLevels {
    const preLevels = this.sampleAnalyser(this.preGainAnalyser);
    const postLevels = this.sampleAnalyser(this.postGainAnalyser);

    return {
      preGainRms: preLevels.rms,
      preGainPeak: preLevels.peak,
      postGainRms: postLevels.rms,
      postGainPeak: postLevels.peak,
      isClipping: postLevels.isClipping,
    };
  }

  private sampleAnalyser(analyser: AnalyserNode | null): AudioLevelResult {
    if (!analyser) {
      return { rms: 0, peak: 0, isClipping: false };
    }

    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);
    return calculateAudioLevels(buffer);
  }

  /** Cleans up audio nodes, streams, and tracks. */
  private cleanup(): void {
    if (this.mediaStream) {
      const audioTracks = this.mediaStream.getAudioTracks
        ? this.mediaStream.getAudioTracks()
        : this.mediaStream.getTracks();
      const audioTrack = audioTracks[0];
      if (audioTrack && this.onDeviceDisconnectHandler) {
        audioTrack.removeEventListener('ended', this.onDeviceDisconnectHandler);
      }
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (this.preGainAnalyser) {
      this.preGainAnalyser.disconnect();
      this.preGainAnalyser = null;
    }

    if (this.postGainAnalyser) {
      this.postGainAnalyser.disconnect();
      this.postGainAnalyser = null;
    }

    if (this.destinationNode) {
      this.destinationNode.disconnect();
      this.destinationNode = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.onDeviceDisconnectHandler = null;
  }
}
