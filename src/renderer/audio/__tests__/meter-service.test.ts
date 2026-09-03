import { describe, it, expect } from 'vitest';
import { calculateAudioLevels } from '../meter-service';

describe('Meter Service (US4)', () => {
  it('returns zero RMS, zero peak, and false clipping for silence', () => {
    const silence = new Float32Array(256);
    const result = calculateAudioLevels(silence);

    expect(result.rms).toBe(0);
    expect(result.peak).toBe(0);
    expect(result.isClipping).toBe(false);
  });

  it('correctly calculates peak and RMS for constant amplitude square wave', () => {
    // Square wave with amplitude 0.5 alternating between +0.5 and -0.5
    const squareWave = new Float32Array(100);
    for (let i = 0; i < squareWave.length; i++) {
      squareWave[i] = i % 2 === 0 ? 0.5 : -0.5;
    }

    const result = calculateAudioLevels(squareWave);
    expect(result.peak).toBe(0.5);
    expect(result.rms).toBeCloseTo(0.5, 5);
    expect(result.isClipping).toBe(false);
  });

  it('calculates RMS accurately for a sine wave (RMS = Peak / sqrt(2))', () => {
    const numSamples = 1000;
    const sineWave = new Float32Array(numSamples);
    const peakAmp = 0.8;

    for (let i = 0; i < numSamples; i++) {
      sineWave[i] = peakAmp * Math.sin((2 * Math.PI * i) / 100);
    }

    const result = calculateAudioLevels(sineWave);
    expect(result.peak).toBeCloseTo(peakAmp, 2);
    // Theoretical RMS of sine wave = Peak / sqrt(2) = 0.8 / 1.4142... = 0.5657
    expect(result.rms).toBeCloseTo(peakAmp / Math.SQRT2, 2);
    expect(result.isClipping).toBe(false);
  });

  it('flags clipping when peak reaches or exceeds clipping threshold (0.99)', () => {
    const normalSignal = new Float32Array([0.2, 0.5, 0.98, -0.4]);
    expect(calculateAudioLevels(normalSignal).isClipping).toBe(false);

    const clippingSignal = new Float32Array([0.2, 0.5, 0.995, -0.4]);
    expect(calculateAudioLevels(clippingSignal).isClipping).toBe(true);

    const maxSignal = new Float32Array([1.0]);
    expect(calculateAudioLevels(maxSignal).isClipping).toBe(true);
  });

  it('clamps output peak and RMS between 0.0 and 1.0 even if input exceeds 1.0', () => {
    const hotSignal = new Float32Array([1.5, -2.0, 1.2]);
    const result = calculateAudioLevels(hotSignal);

    expect(result.peak).toBe(1.0);
    expect(result.rms).toBe(1.0);
    expect(result.isClipping).toBe(true);
  });
});
