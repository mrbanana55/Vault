import React, { useState, useEffect, useRef } from 'react';
import type { MeterSignalLevels } from '../types/recording-dock';
import { amplitudeToDbPercent } from '../audio/meter-service';

export interface VolumeMeterProps {
  levels: MeterSignalLevels;
  label?: string;
  orientation?: 'vertical' | 'horizontal';
  width?: number;
  height?: number;
  showClipping?: boolean;
  dbScale?: boolean;
}

export function VolumeMeter({
  levels,
  label,
  orientation = 'horizontal',
  width,
  height,
  showClipping = true,
  dbScale = true,
}: VolumeMeterProps) {
  const [isClipActive, setIsClipActive] = useState(false);
  const clipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isHorizontal = orientation === 'horizontal';
  const resolvedWidth = width ?? (isHorizontal ? 130 : 8);
  const resolvedHeight = height ?? (isHorizontal ? 14 : 44);

  useEffect(() => {
    if (levels.isClipping) {
      setIsClipActive(true);
      if (clipTimeoutRef.current) {
        clearTimeout(clipTimeoutRef.current);
      }
      clipTimeoutRef.current = setTimeout(() => {
        setIsClipActive(false);
      }, 500);
    }
  }, [levels.isClipping]);

  useEffect(() => {
    return () => {
      if (clipTimeoutRef.current) {
        clearTimeout(clipTimeoutRef.current);
      }
    };
  }, []);

  const rmsPercent = dbScale
    ? amplitudeToDbPercent(levels.rms)
    : Math.min(100, Math.max(0, levels.rms * 100));
  const peakPercent = dbScale
    ? amplitudeToDbPercent(levels.peak)
    : Math.min(100, Math.max(0, levels.peak * 100));

  if (isHorizontal) {
    return (
      <div
        data-testid={`volume-meter-${label ? label.toLowerCase() : 'signal'}`}
        className="flex items-center gap-2 select-none"
      >
        {/* Label */}
        {label && (
          <span className="text-[10px] font-semibold text-content-secondary/80 uppercase tracking-wider shrink-0 w-6 text-right">
            {label}
          </span>
        )}

        {/* Meter Bar Container */}
        <div
          style={{ width: resolvedWidth, height: resolvedHeight }}
          className="relative bg-surface-secondary border border-border/80 rounded-[3px] overflow-hidden flex items-center justify-start p-[1px]"
        >
          {/* RMS fill bar */}
          <div
            data-testid="meter-fill"
            style={{ width: `${rmsPercent}%` }}
            className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500 rounded-[2px]"
          />

          {/* Peak indicator notch */}
          {peakPercent > 0 && (
            <div
              data-testid="meter-peak"
              style={{ left: `${peakPercent}%` }}
              className="absolute top-0 bottom-0 w-[2px] bg-white/90 shadow-sm pointer-events-none"
            />
          )}
        </div>

        {/* Clipping LED Indicator */}
        {showClipping && (
          <div
            data-testid="clipping-indicator"
            title={isClipActive ? 'Signal Clipping (>= 0 dB)' : 'Headroom OK'}
            className={`w-2.5 h-2.5 rounded-[2px] shrink-0 transition-colors duration-150 ${
              isClipActive
                ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                : 'bg-surface-secondary border border-border/60'
            }`}
          />
        )}
      </div>
    );
  }

  // Vertical layout fallback
  return (
    <div
      data-testid={`volume-meter-${label ? label.toLowerCase() : 'signal'}`}
      className="flex flex-col items-center select-none"
    >
      {/* Clipping LED Indicator */}
      {showClipping && (
        <div
          data-testid="clipping-indicator"
          title={isClipActive ? 'Signal Clipping (>= 0 dB)' : 'Headroom OK'}
          className={`w-2 h-1.5 rounded-[1px] mb-1 transition-colors duration-150 ${
            isClipActive
              ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
              : 'bg-surface-secondary border border-border/60'
          }`}
        />
      )}

      {/* Meter Bar Container */}
      <div
        style={{ width: resolvedWidth, height: resolvedHeight }}
        className="relative bg-surface-secondary border border-border/80 rounded-[2px] overflow-hidden flex flex-col justify-end p-[1px]"
      >
        {/* RMS fill bar */}
        <div
          data-testid="meter-fill"
          style={{ height: `${rmsPercent}%` }}
          className="w-full bg-gradient-to-t from-emerald-500 via-yellow-400 to-red-500 rounded-[1px]"
        />

        {/* Peak indicator notch */}
        {peakPercent > 0 && (
          <div
            data-testid="meter-peak"
            style={{ bottom: `${peakPercent}%` }}
            className="absolute left-0 right-0 h-[1px] bg-white/90 shadow-sm pointer-events-none"
          />
        )}
      </div>

      {/* Label */}
      {label && (
        <span className="text-[9px] font-semibold text-content-secondary/80 uppercase tracking-wider mt-1">
          {label}
        </span>
      )}
    </div>
  );
}
