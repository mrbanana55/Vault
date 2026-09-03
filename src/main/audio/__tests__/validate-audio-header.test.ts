import { describe, it, expect } from 'vitest';
import { validateAudioHeader } from '../validate-audio-header';
import type { AudioFormat } from '@shared/types';

describe('validateAudioHeader()', () => {
  it('validates a valid WAV header (RIFF at 0, WAVE at 8)', () => {
    // 12 bytes minimum: RIFF + 4 length bytes + WAVE
    const wavHeader = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // 'RIFF'
      0x24, 0x00, 0x00, 0x00, // file length - 8
      0x57, 0x41, 0x56, 0x45, // 'WAVE'
    ]);
    expect(validateAudioHeader(wavHeader, 'wav')).toBe(true);
  });

  it('validates a valid MP3 header with ID3 tag and frame sync', () => {
    // ID3 tag: 'ID3' at offset 0
    const id3Header = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    expect(validateAudioHeader(id3Header, 'mp3')).toBe(true);

    // Frame sync: FF FB
    const frameSyncFB = Buffer.from([0xff, 0xfb, 0x90, 0x64]);
    expect(validateAudioHeader(frameSyncFB, 'mp3')).toBe(true);

    // Frame sync: FF F3
    const frameSyncF3 = Buffer.from([0xff, 0xf3, 0x90, 0x64]);
    expect(validateAudioHeader(frameSyncF3, 'mp3')).toBe(true);

    // Frame sync: FF F2
    const frameSyncF2 = Buffer.from([0xff, 0xf2, 0x90, 0x64]);
    expect(validateAudioHeader(frameSyncF2, 'mp3')).toBe(true);
  });

  it('validates a valid M4A header (ftyp at offset 4)', () => {
    // Offset 4: 'ftyp'
    const m4aHeader = Buffer.from([
      0x00, 0x00, 0x00, 0x20, // atom size
      0x66, 0x74, 0x79, 0x70, // 'ftyp'
      0x4d, 0x34, 0x41, 0x20, // 'M4A '
    ]);
    expect(validateAudioHeader(m4aHeader, 'm4a')).toBe(true);
  });

  it('validates a valid OGG header (OggS at offset 0)', () => {
    const oggHeader = Buffer.from([
      0x4f, 0x67, 0x67, 0x53, // 'OggS'
      0x00, 0x02, 0x00, 0x00,
    ]);
    expect(validateAudioHeader(oggHeader, 'ogg')).toBe(true);
  });

  it('validates a valid FLAC header (fLaC at offset 0)', () => {
    const flacHeader = Buffer.from([
      0x66, 0x4c, 0x61, 0x43, // 'fLaC'
      0x00, 0x00, 0x00, 0x22,
    ]);
    expect(validateAudioHeader(flacHeader, 'flac')).toBe(true);
  });

  it('returns false for mismatched format (e.g. WAV header with mp3 format)', () => {
    const wavHeader = Buffer.from([
      0x52, 0x49, 0x46, 0x46,
      0x24, 0x00, 0x00, 0x00,
      0x57, 0x41, 0x56, 0x45,
    ]);
    expect(validateAudioHeader(wavHeader, 'mp3')).toBe(false);
    expect(validateAudioHeader(wavHeader, 'flac')).toBe(false);
    expect(validateAudioHeader(wavHeader, 'ogg')).toBe(false);
    expect(validateAudioHeader(wavHeader, 'm4a')).toBe(false);
  });

  it('returns false for empty, truncated, or invalid buffers', () => {
    expect(validateAudioHeader(Buffer.alloc(0), 'wav')).toBe(false);
    expect(validateAudioHeader(Buffer.from([0x52, 0x49]), 'wav')).toBe(false);
    expect(validateAudioHeader(Buffer.from('Not an audio file at all'), 'mp3')).toBe(false);
    expect(validateAudioHeader(Buffer.from('JPEG header content here'), 'wav')).toBe(false);
  });
});
