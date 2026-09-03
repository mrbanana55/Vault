import { describe, it, expect } from 'vitest';
import { encodeWav } from '../wav-encoder';
import { validateAudioHeader } from '../../../main/audio/validate-audio-header';

describe('WAV Encoder (US1)', () => {
  it('generates a valid 44-byte RIFF/WAVE header verified by validateAudioHeader', () => {
    const monoData = new Float32Array(100);
    const wavBuffer = encodeWav({
      sampleRate: 44100,
      channelData: [monoData],
    });

    expect(wavBuffer.byteLength).toBe(44 + 100 * 2); // 44 header + 100 16-bit samples

    const nodeBuffer = Buffer.from(wavBuffer);
    expect(validateAudioHeader(nodeBuffer, 'wav')).toBe(true);
  });

  it('correctly populates WAV header fields for mono 44.1kHz audio', () => {
    const samples = new Float32Array(50);
    const wavBuffer = encodeWav({
      sampleRate: 44100,
      channelData: [samples],
    });

    const view = new DataView(wavBuffer);

    // "RIFF"
    expect(String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))).toBe('RIFF');
    // ChunkSize: 36 + dataSize (50 * 2 = 100) = 136
    expect(view.getUint32(4, true)).toBe(136);
    // "WAVE"
    expect(String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11))).toBe('WAVE');
    // "fmt "
    expect(String.fromCharCode(view.getUint8(12), view.getUint8(13), view.getUint8(14), view.getUint8(15))).toBe('fmt ');
    // Subchunk1Size: 16
    expect(view.getUint32(16, true)).toBe(16);
    // AudioFormat: 1 (PCM)
    expect(view.getUint16(20, true)).toBe(1);
    // NumChannels: 1
    expect(view.getUint16(22, true)).toBe(1);
    // SampleRate: 44100
    expect(view.getUint32(24, true)).toBe(44100);
    // ByteRate: 44100 * 1 * 2 = 88200
    expect(view.getUint32(28, true)).toBe(88200);
    // BlockAlign: 1 * 2 = 2
    expect(view.getUint16(32, true)).toBe(2);
    // BitsPerSample: 16
    expect(view.getUint16(34, true)).toBe(16);
    // "data"
    expect(String.fromCharCode(view.getUint8(36), view.getUint8(37), view.getUint8(38), view.getUint8(39))).toBe('data');
    // Subchunk2Size: 100
    expect(view.getUint32(40, true)).toBe(100);
  });

  it('correctly quantizes and clamps Float32Array samples to signed 16-bit PCM', () => {
    // Test points: silence (0.0), max positive (1.0), max negative (-1.0), and out of range clamping (1.5, -2.0)
    const samples = new Float32Array([0.0, 1.0, -1.0, 1.5, -2.0]);
    const wavBuffer = encodeWav({
      sampleRate: 48000,
      channelData: [samples],
    });

    const view = new DataView(wavBuffer);
    const offset = 44; // Data start

    expect(view.getInt16(offset + 0, true)).toBe(0);
    expect(view.getInt16(offset + 2, true)).toBe(32767);
    expect(view.getInt16(offset + 4, true)).toBe(-32768);
    expect(view.getInt16(offset + 6, true)).toBe(32767); // Clamped
    expect(view.getInt16(offset + 8, true)).toBe(-32768); // Clamped
  });

  it('correctly interleaves multi-channel stereo audio', () => {
    const left = new Float32Array([1.0, 0.5]);
    const right = new Float32Array([-1.0, -0.5]);
    const wavBuffer = encodeWav({
      sampleRate: 44100,
      channelData: [left, right],
    });

    const view = new DataView(wavBuffer);
    expect(view.getUint16(22, true)).toBe(2); // 2 channels
    expect(view.getUint32(40, true)).toBe(8); // 4 samples * 2 bytes = 8 bytes

    const offset = 44;
    expect(view.getInt16(offset + 0, true)).toBe(32767);  // L0
    expect(view.getInt16(offset + 2, true)).toBe(-32768); // R0
    expect(view.getInt16(offset + 4, true)).toBe(16384);  // L1 (0.5 * 32767 rounded)
    expect(view.getInt16(offset + 6, true)).toBe(-16384); // R1 (-0.5 * 32768 rounded)
  });
});
