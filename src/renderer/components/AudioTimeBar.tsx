import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { formatDuration } from "../lib/format";

export function AudioTimeBar() {
  const { currentNote, currentTime, duration, seek } = useAudioPlayer();
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState<number | null>(null);

  const isDraggingRef = useRef(false);
  const dragTimeRef = useRef<number | null>(null);

  const totalDuration =
    duration || (currentNote ? currentNote.duration_seconds : 0);
  const isDisabled = !currentNote;

  const displayTime = isDragging && dragTime !== null ? dragTime : currentTime;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (Number.isNaN(val)) return;

    if (isDraggingRef.current) {
      dragTimeRef.current = val;
      setDragTime(val);
    } else {
      seek(val);
    }
  };

  const handleDragStart = (e: React.SyntheticEvent<HTMLInputElement>) => {
    if (isDisabled) return;
    isDraggingRef.current = true;
    setIsDragging(true);

    const val = parseFloat(e.currentTarget.value);
    if (!Number.isNaN(val)) {
      dragTimeRef.current = val;
      setDragTime(val);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLInputElement>) => {
    handleDragStart(e);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // In testing environments or unsupported browsers, safely ignore
    }
  };

  const handleDragEnd = useCallback(() => {
    if (isDraggingRef.current) {
      const finalTime = dragTimeRef.current;
      isDraggingRef.current = false;
      setIsDragging(false);
      setDragTime(null);

      if (finalTime !== null && Number.isFinite(finalTime)) {
        seek(finalTime);
      }
    }
  }, [seek]);

  // Global window listeners while dragging to ensure releasing mouse/touch anywhere commits the seek
  useEffect(() => {
    if (!isDragging) return;

    const onGlobalUp = () => {
      handleDragEnd();
    };

    window.addEventListener("pointerup", onGlobalUp);
    window.addEventListener("pointercancel", onGlobalUp);
    window.addEventListener("mouseup", onGlobalUp);
    window.addEventListener("touchend", onGlobalUp);

    return () => {
      window.removeEventListener("pointerup", onGlobalUp);
      window.removeEventListener("pointercancel", onGlobalUp);
      window.removeEventListener("mouseup", onGlobalUp);
      window.removeEventListener("touchend", onGlobalUp);
    };
  }, [isDragging, handleDragEnd]);

  return (
    <div
      data-testid="audio-time-bar-container"
      className="flex items-center gap-3 w-full max-w-sm sm:max-w-md mx-4"
    >
      <input
        type="range"
        min={0}
        max={totalDuration || 100}
        step={0.1}
        value={displayTime}
        disabled={isDisabled}
        onChange={handleChange}
        onPointerDown={handlePointerDown}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
        data-testid="audio-scrubber"
        aria-label="Audio playback scrubber"
        className={`flex-1 h-1.5 rounded-lg appearance-none cursor-pointer transition-opacity accent-accent ${
          isDisabled
            ? "opacity-40 cursor-not-allowed bg-surface-secondary [&::-webkit-slider-thumb]:cursor-not-allowed"
            : "bg-border [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm hover:[&::-webkit-slider-thumb]:scale-110 active:[&::-webkit-slider-thumb]:scale-125 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-sm"
        }`}
      />
      <span
        data-testid="audio-time-display"
        className="text-xs font-mono tabular-nums text-content-secondary shrink-0 select-none"
      >
        {formatDuration(displayTime)} / {formatDuration(totalDuration)}
      </span>
    </div>
  );
}
