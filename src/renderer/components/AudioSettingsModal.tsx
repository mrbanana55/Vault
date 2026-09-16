import React, { useEffect } from 'react';
import type { AudioHardwareSettings, AudioDeviceOption, ChannelMode } from '../types/recording-dock';

export interface AudioSettingsModalProps {
  isOpen: boolean;
  settings: AudioHardwareSettings;
  availableInputs: AudioDeviceOption[];
  availableOutputs: AudioDeviceOption[];
  onUpdateSettings: (updates: Partial<AudioHardwareSettings>) => void;
  onClose: () => void;
}

export function AudioSettingsModal({
  isOpen,
  settings,
  availableInputs,
  availableOutputs,
  onUpdateSettings,
  onClose,
}: AudioSettingsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="audio-settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface-primary border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-accent"
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
            <h2 className="text-base font-semibold text-content-primary">Audio Settings</h2>
          </div>
          <button
            type="button"
            data-testid="btn-close-settings"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-content-secondary hover:text-content-primary hover:bg-surface-secondary transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm">
          {/* Input Device */}
          <div>
            <label className="block text-xs font-medium text-content-secondary mb-1.5">
              Audio Input Device (Microphone / Interface)
            </label>
            <select
              data-testid="select-input-device"
              value={settings.inputDeviceId}
              onChange={(e) => onUpdateSettings({ inputDeviceId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-content-primary focus:outline-none focus:ring-1 focus:ring-accent text-xs"
            >
              <option value="default">System Default Input</option>
              {availableInputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label} {d.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Output Device */}
          <div>
            <label className="block text-xs font-medium text-content-secondary mb-1.5">
              Audio Output Device (Playback / Monitor)
            </label>
            <select
              data-testid="select-output-device"
              value={settings.outputDeviceId}
              onChange={(e) => onUpdateSettings({ outputDeviceId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-content-primary focus:outline-none focus:ring-1 focus:ring-accent text-xs"
            >
              <option value="default">System Default Output</option>
              {availableOutputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label} {d.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Channel Input Configuration */}
          <div>
            <label className="block text-xs font-medium text-content-secondary mb-1.5">
              Input Channel Routing
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'stereo', label: 'Stereo (L+R)' },
                  { id: 'mono-ch1', label: 'Mono Ch 1' },
                  { id: 'mono-ch2', label: 'Mono Ch 2' },
                ] as { id: ChannelMode; label: string }[]
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  data-testid={`btn-channel-${mode.id}`}
                  onClick={() => onUpdateSettings({ channelMode: mode.id })}
                  className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all text-center ${
                    settings.channelMode === mode.id
                      ? 'bg-accent/15 border-accent text-accent font-semibold shadow-sm'
                      : 'bg-surface-secondary border-border text-content-secondary hover:text-content-primary hover:bg-surface-hover'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-content-secondary/60 mt-1">
              Select specific mono channel when using multi-input audio interfaces.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex justify-end bg-surface-secondary/50">
          <button
            type="button"
            data-testid="btn-done-settings"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
