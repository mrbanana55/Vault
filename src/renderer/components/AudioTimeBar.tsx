import React, { useState } from "react";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { formatDuration } from "../lib/format";

export function AudioTimeBar() {
  const { currentNote, currentTime, duration, seek } = useAudioPlayer();
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState<number | null>(null);

  const displayTime = isDragging && dragTime !== null ? dragTime : currentTime;
  const totalDuration =
    duration || (currentNote ? currentNote.duration_seconds : 0);
  const isDisabled = !currentNote;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isDragging) {
      setDragTime(val);
    } else {
      seek(val);
    }
  };

  const handleMouseDown = () => {
    if (isDisabled) return;
    setIsDragging(true);
    setDragTime(currentTime);
  };

  const handleMouseUp = () => {
    if (isDragging && dragTime !== null) {
      seek(dragTime);
      setIsDragging(false);
      setDragTime(null);
    }
  };

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
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={() => {
          if (isDragging && dragTime !== null) {
            seek(dragTime);
            setIsDragging(false);
            setDragTime(null);
          }
        }}
        data-testid="audio-scrubber"
        aria-label="Audio playback scrubber"
        className={`flex-1 h-1.5 rounded-lg appearance-none cursor-pointer transition-opacity ${
          isDisabled
            ? "opacity-40 cursor-not-allowed bg-surface-secondary"
            : "bg-border/60 bg-border accent-accent-blue"
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
