export interface WavEncodingOptions {
  sampleRate: number;
  channelData: Float32Array[];
}

/**
 * Encodes audio channels into a standard 16-bit linear PCM WAV ArrayBuffer.
 * Produces a standard 44-byte RIFF/WAVE header followed by interleaved or mono samples.
 *
 * @param options Sample rate and array of Float32Array channel buffers.
 * @returns ArrayBuffer containing complete, valid WAV audio binary data.
 */
export function encodeWav(options: WavEncodingOptions): ArrayBuffer {
  const { sampleRate, channelData } = options;
  const numChannels = channelData.length;
  if (numChannels === 0) {
    throw new Error('At least one channel of audio data must be provided');
  }

  const numSamples = channelData[0].length;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const totalBufferSize = 44 + dataSize;

  const buffer = new ArrayBuffer(totalBufferSize);
  const view = new DataView(buffer);

  // Helper to write ASCII strings
  const writeString = (offset: number, str: string): void => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // 1. "RIFF" chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // ChunkSize
  writeString(8, 'WAVE');

  // 2. "fmt " sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = linear PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // 3. "data" sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // 4. Write interleaved 16-bit PCM samples
  let writeOffset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = channelData[ch][i];
      // Clamp between -1.0 and 1.0
      const clamped = Math.max(-1, Math.min(1, sample));
      // Quantize to 16-bit signed integer [-32768, 32767]
      const int16 = clamped < 0 ? Math.round(clamped * 0x8000) : Math.round(clamped * 0x7fff);
      view.setInt16(writeOffset, int16, true);
      writeOffset += 2;
    }
  }

  return buffer;
}
