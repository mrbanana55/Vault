import React, { useRef, useCallback } from 'react';

export interface RotaryKnobProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  label: string;
  tooltip?: string;
  formatValue?: (val: number) => string;
  onChange: (newValue: number) => void;
  size?: number;
  disabled?: boolean;
}

export function RotaryKnob({
  value,
  min,
  max,
  defaultValue = 1.0,
  label,
  tooltip,
  formatValue = (val) => `${Math.round(val * 100)}%`,
  onChange,
  size = 36,
  disabled = false,
}: RotaryKnobProps) {
  const knobRef = useRef<HTMLDivElement | null>(null);

  // Normalized fraction 0..1
  const fraction = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  // Sweep from -135deg to +135deg (total 270deg)
  const angle = -135 + fraction * 270;

  // Pointer drag handling
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    const startY = e.clientY;
    const startVal = value;
    const range = max - min;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaY = startY - moveEvent.clientY; // drag up = positive
      const sensitivity = range / 150; // 150px drag traverses entire range
      const rawNewVal = startVal + deltaY * sensitivity;
      const clamped = Math.max(min, Math.min(max, rawNewVal));
      onChange(clamped);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Wheel handling
  const handleWheel = (e: React.WheelEvent) => {
    if (disabled) return;
    e.preventDefault();
    const range = max - min;
    const stepDelta = -e.deltaY * (range / 1000);
    const clamped = Math.max(min, Math.min(max, value + stepDelta));
    onChange(clamped);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const range = max - min;
    const stepDelta = range / 20; // 5% step

    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      onChange(Math.min(max, value + stepDelta));
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      onChange(Math.max(min, value - stepDelta));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(min);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(max);
    }
  };

  // Double-click reset to default
  const handleDoubleClick = () => {
    if (disabled) return;
    onChange(defaultValue);
  };

  // SVG dimensions
  const center = size / 2;
  const radius = size / 2 - 4;
  const strokeWidth = 3;

  // Arc path math (circumference fraction)
  const arcLength = 2 * Math.PI * radius * (270 / 360);
  const strokeDashoffset = arcLength * (1 - fraction);

  return (
    <div
      className={`flex flex-col items-center select-none ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      title={tooltip || `${label}: ${formatValue(value)}`}
    >
      <div
        ref={knobRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={formatValue(value)}
        data-testid={`rotary-knob-${label.toLowerCase().replace(/\s+/g, '-')}`}
        onPointerDown={handlePointerDown}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        onDoubleClick={handleDoubleClick}
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center cursor-ns-resize focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full group"
      >
        {/* Background Track SVG */}
        <svg
          width={size}
          height={size}
          className="absolute inset-0 transform -rotate-225"
          style={{ transform: 'rotate(135deg)' }}
        >
          {/* Inactive Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} 999`}
            className="text-surface-hover/60"
          />
          {/* Active Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} 999`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-accent transition-all duration-75"
          />
        </svg>

        {/* Center Dial & Pointer Tick */}
        <div
          className="w-6 h-6 rounded-full bg-surface-secondary border border-border flex items-center justify-center shadow-inner group-hover:border-accent/60 transition-colors"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          {/* Tick Indicator Notch */}
          <div className="w-0.5 h-2 bg-content-primary rounded-full -translate-y-1.5" />
        </div>
      </div>

      {/* Label and formatted text */}
      <span className="text-[10px] font-semibold text-content-secondary uppercase tracking-wider mt-1">
        {label}
      </span>
      <span className="text-[9px] font-mono text-content-secondary/80 -mt-0.5">
        {formatValue(value)}
      </span>
    </div>
  );
}
