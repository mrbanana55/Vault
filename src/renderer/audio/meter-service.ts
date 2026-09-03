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
