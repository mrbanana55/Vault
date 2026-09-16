import React from 'react';
import { useAudioRecordingDock } from '../hooks/useAudioRecordingDock';
import { RotaryKnob } from './RotaryKnob';
import { VolumeMeter } from './VolumeMeter';
import { SaveIdeaModal } from './SaveIdeaModal';
import { AudioSettingsModal } from './AudioSettingsModal';

export interface RecordingPanelProps {
  onNoteCreated?: () => void;
}

export function RecordingPanel({ onNoteCreated }: RecordingPanelProps) {
  const {
    state,
    formattedTime,
    error,
    startRecording,
    stopRecording,
    inputGain,
    setInputGain,
    outputVolume,
    setOutputVolume,
    inputLevels,
    outputLevels,
    isPromptingMetadata,
    recordedDuration,
    saveIdea,
    discardIdea,
    isSettingsOpen,
    openSettings,
    closeSettings,
    hardwareSettings,
    updateHardwareSettings,
    availableInputs,
    availableOutputs,
    isMonitoring,
    toggleMonitoring,
  } = useAudioRecordingDock({ onNoteSaved: onNoteCreated });

  const handleRecordClick = () => {
    if (state === 'recording') {
      stopRecording();
    } else if (state === 'idle') {
      startRecording();
    }
  };

  return (
    <>
      <footer
        data-testid="recording-panel"
        className="h-20 border-t border-border bg-surface-primary flex items-center justify-between px-6 shrink-0 transition-colors z-20 select-none"
      >
        {/* Left Section: 1. Monitoring, 2. Input Knob, 3. Horizontal Volume Input */}
        <div className="flex items-center gap-4 flex-1 justify-start min-w-0">
          {/* 1. Monitoring Button */}
          <button
            type="button"
            data-testid="btn-toggle-monitoring"
            onClick={toggleMonitoring}
            aria-label="Toggle self monitoring"
            aria-pressed={isMonitoring}
            title={
              isMonitoring
                ? 'Self monitoring ON (click to disable)'
                : 'Self monitoring OFF (click to enable)'
            }
            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
              isMonitoring
                ? 'bg-accent/15 border-accent text-accent shadow-sm ring-1 ring-accent/30'
                : 'bg-surface-primary border-border text-content-secondary hover:text-content-primary hover:bg-surface-secondary'
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
            </svg>
          </button>

          {/* 2. Input Knob (GAIN) */}
          <RotaryKnob
            value={inputGain}
            min={0.0}
            max={2.0}
            defaultValue={1.0}
            label="GAIN"
            tooltip="Input Recording Gain (0% to 200%)"
            onChange={setInputGain}
          />

          {/* 3. Horizontal Volume Input Meter */}
          <VolumeMeter
            levels={inputLevels}
            label="IN"
            orientation="horizontal"
            width={130}
            height={14}
          />

          {error && (
            <span
              data-testid="recording-error"
              className="text-[11px] text-red-500 truncate max-w-[120px]"
              title={error}
            >
              {error}
            </span>
          )}
        </div>

        {/* Center Section: 4. Record Button & Timer */}
        <div className="flex flex-col items-center justify-center gap-1 px-4 shrink-0">
          <button
            type="button"
            data-testid="btn-record"
            onClick={handleRecordClick}
            disabled={state === 'processing'}
            title={state === 'recording' ? 'Stop recording' : 'Start recording idea'}
            aria-label={state === 'recording' ? 'Stop recording' : 'Start recording'}
            className="relative group p-1.5 rounded-full hover:bg-surface-secondary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-all cursor-pointer disabled:opacity-50"
          >
            <span
              className={`block transition-all duration-300 ease-in-out shadow-md ${
                state === 'recording'
                  ? 'w-6 h-6 rounded-md bg-red-600 ring-4 ring-red-500/30'
                  : 'w-10 h-10 rounded-full bg-red-600 group-hover:bg-red-500 group-hover:scale-105'
              }`}
            />
          </button>

          <div className="h-4 flex items-center justify-center">
            {state === 'recording' ? (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                <span
                  data-testid="recording-timer"
                  className="font-mono text-xs font-semibold text-red-500"
                >
                  {formattedTime}
                </span>
              </div>
            ) : (
              <span className="text-[11px] font-medium text-content-secondary/80 tracking-wide">
                Ready
              </span>
            )}
          </div>
        </div>

        {/* Right Section: 5. Horizontal Output Meter, 6. Output Knob, 7. Settings */}
        <div className="flex items-center gap-4 flex-1 justify-end min-w-0">
          {/* 5. Horizontal Volume Output Meter */}
          <VolumeMeter
            levels={outputLevels}
            label="OUT"
            orientation="horizontal"
            width={130}
            height={14}
          />

          {/* 6. Output Knob (VOL) */}
          <RotaryKnob
            value={outputVolume}
            min={0.0}
            max={2.0}
            defaultValue={1.0}
            label="VOL"
            tooltip="Master Output Volume (0% to 200%)"
            onChange={setOutputVolume}
          />

          {/* 7. Settings Button */}
          <button
            type="button"
            data-testid="btn-audio-settings"
            onClick={openSettings}
            title="Audio Hardware Settings"
            aria-label="Audio Hardware Settings"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-content-secondary hover:text-content-primary hover:bg-surface-secondary border border-border transition-colors cursor-pointer shrink-0"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </footer>

      {/* Post-Recording Metadata Modal */}
      <SaveIdeaModal
        isOpen={isPromptingMetadata}
        durationSeconds={recordedDuration}
        onSave={saveIdea}
        onDiscard={discardIdea}
      />

      {/* Audio Hardware Settings Modal */}
      <AudioSettingsModal
        isOpen={isSettingsOpen}
        settings={hardwareSettings}
        availableInputs={availableInputs}
        availableOutputs={availableOutputs}
        onUpdateSettings={updateHardwareSettings}
        onClose={closeSettings}
      />
    </>
  );
}
