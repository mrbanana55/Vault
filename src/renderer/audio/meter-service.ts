/**
 * Measured amplitude levels extracted from audio sample data.
 */
export interface AudioLevelResult {
  /** Root-mean-square signal power, normalized between 0.0 and 1.0 */
  rms: number;
  /** Maximum absolute sample peak, normalized between 0.0 and 1.0 */
  peak: number;
  /** True if peak exceeds the clipping threshold (default 0.99) */
  isClipping: boolean;
}

/**
 * Calculates real-time RMS, Peak, and clipping status from Float32Array time-domain audio samples.
 *
 * @param timeDomainData Array of raw sample values from an AnalyserNode.
 * @param clippingThreshold Amplitude above which clipping is detected (default: 0.99).
 * @returns AudioLevelResult containing normalized rms, peak, and isClipping.
 */
export function calculateAudioLevels(
  timeDomainData: Float32Array,
  clippingThreshold: number = 0.99
): AudioLevelResult {
  const len = timeDomainData.length;
  if (len === 0) {
    return { rms: 0, peak: 0, isClipping: false };
  }

  let sumSquares = 0;
  let rawPeak = 0;

  for (let i = 0; i < len; i++) {
    const absVal = Math.abs(timeDomainData[i]);
    if (absVal > rawPeak) {
      rawPeak = absVal;
    }
    sumSquares += absVal * absVal;
  }

  const rawRms = Math.sqrt(sumSquares / len);

  const peak = Math.max(0.0, Math.min(1.0, rawPeak));
  const rms = Math.max(0.0, Math.min(1.0, rawRms));
  const isClipping = rawPeak >= clippingThreshold;

  return {
    rms,
    peak,
    isClipping,
  };
}

/**
 * Converts a linear amplitude value (0.0 to 1.0) to a decibel-scaled percentage (0 to 100)
 * matching standard DAW logarithmic volume meters.
 *
 * @param linear Amplitude from 0.0 to 1.0.
 * @param minDb Minimum visible dBFS threshold (default: -48 dB).
 * @returns Logarithmic percentage between 0 and 100.
 */
export function amplitudeToDbPercent(linear: number, minDb: number = -48): number {
  if (linear <= 0.0001) {
    return 0;
  }
  const db = 20 * Math.log10(linear);
  if (db <= minDb) {
    return 0;
  }
  if (db >= 0) {
    return 100;
  }
  return ((db - minDb) / -minDb) * 100;
}

