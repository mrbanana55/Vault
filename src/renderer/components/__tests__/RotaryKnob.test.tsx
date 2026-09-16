import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RotaryKnob } from '../RotaryKnob';

describe('RotaryKnob (US2)', () => {
  it('renders with accessible slider role and initial value', () => {
    render(
      <RotaryKnob
        value={1.0}
        min={0.0}
        max={2.0}
        label="GAIN"
        onChange={vi.fn()}
      />
    );

    const slider = screen.getByRole('slider', { name: 'GAIN' });
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('aria-valuenow', '1');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '2');
    expect(screen.getByText('GAIN')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('handles keyboard arrow keys to adjust value', () => {
    const onChange = vi.fn();
    render(
      <RotaryKnob
        value={1.0}
        min={0.0}
        max={2.0}
        label="GAIN"
        onChange={onChange}
      />
    );

    const slider = screen.getByRole('slider', { name: 'GAIN' });

    fireEvent.keyDown(slider, { key: 'ArrowUp' });
    expect(onChange).toHaveBeenCalledWith(1.1);

    fireEvent.keyDown(slider, { key: 'ArrowDown' });
    expect(onChange).toHaveBeenCalledWith(0.9);
  });

  it('resets to defaultValue on double click', () => {
    const onChange = vi.fn();
    render(
      <RotaryKnob
        value={1.5}
        min={0.0}
        max={2.0}
        defaultValue={1.0}
        label="GAIN"
        onChange={onChange}
      />
    );

    const slider = screen.getByRole('slider', { name: 'GAIN' });
    fireEvent.doubleClick(slider);
    expect(onChange).toHaveBeenCalledWith(1.0);
  });

  it('handles wheel events to scale value', () => {
    const onChange = vi.fn();
    render(
      <RotaryKnob
        value={1.0}
        min={0.0}
        max={2.0}
        label="GAIN"
        onChange={onChange}
      />
    );

    const slider = screen.getByRole('slider', { name: 'GAIN' });
    fireEvent.wheel(slider, { deltaY: -50 });
    expect(onChange).toHaveBeenCalled();
  });
});
