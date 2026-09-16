import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { VolumeMeter } from '../VolumeMeter';

describe('VolumeMeter (US2)', () => {
  it('renders horizontal volume meter with linear scale', () => {
    render(
      <VolumeMeter
        levels={{ rms: 0.5, peak: 0.75, isClipping: false }}
        label="IN"
        dbScale={false}
      />
    );

    expect(screen.getByTestId('volume-meter-in')).toBeInTheDocument();
    expect(screen.getByText('IN')).toBeInTheDocument();

    const fill = screen.getByTestId('meter-fill');
    expect(fill.style.width).toBe('50%');

    const peak = screen.getByTestId('meter-peak');
    expect(peak.style.left).toBe('75%');
  });

  it('renders vertical volume meter with linear scale when specified', () => {
    render(
      <VolumeMeter
        levels={{ rms: 0.5, peak: 0.75, isClipping: false }}
        label="IN"
        orientation="vertical"
        dbScale={false}
      />
    );

    const fill = screen.getByTestId('meter-fill');
    expect(fill.style.height).toBe('50%');

    const peak = screen.getByTestId('meter-peak');
    expect(peak.style.bottom).toBe('75%');
  });

  it('applies logarithmic dB scale by default for accurate dynamic range', () => {
    render(
      <VolumeMeter
        levels={{ rms: 0.5, peak: 0.75, isClipping: false }}
        label="IN"
      />
    );

    const fill = screen.getByTestId('meter-fill');
    // -6 dBFS (0.5 linear) on -48 dBFS floor maps to ~87.46%
    const fillPercent = parseFloat(fill.style.width);
    expect(fillPercent).toBeGreaterThan(80);
    expect(fillPercent).toBeLessThan(90);

    const peak = screen.getByTestId('meter-peak');
    const peakPercent = parseFloat(peak.style.left);
    expect(peakPercent).toBeGreaterThan(90);
    expect(peakPercent).toBeLessThan(98);
  });

  it('activates clipping indicator when signal is clipping', () => {
    const { rerender } = render(
      <VolumeMeter
        levels={{ rms: 0.9, peak: 1.0, isClipping: true }}
        label="OUT"
      />
    );

    const clip = screen.getByTestId('clipping-indicator');
    expect(clip.className).toContain('bg-red-500');

    rerender(
      <VolumeMeter
        levels={{ rms: 0.1, peak: 0.2, isClipping: false }}
        label="OUT"
      />
    );

    // Should hold clipping active momentarily
    expect(clip.className).toContain('bg-red-500');
  });
});
