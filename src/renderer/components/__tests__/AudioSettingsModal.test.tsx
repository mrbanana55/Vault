import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AudioSettingsModal } from '../AudioSettingsModal';
import type { AudioHardwareSettings, AudioDeviceOption } from '../../types/recording-dock';

describe('AudioSettingsModal (US3)', () => {
  const mockSettings: AudioHardwareSettings = {
    inputDeviceId: 'mic-1',
    outputDeviceId: 'speaker-1',
    channelMode: 'stereo',
    inputGain: 1.0,
    outputVolume: 0.8,
  };

  const mockInputs: AudioDeviceOption[] = [
    { deviceId: 'default', label: 'MacBook Mic', isDefault: true, kind: 'audioinput' },
    { deviceId: 'mic-1', label: 'Scarlett 2i2 USB', isDefault: false, kind: 'audioinput' },
  ];

  const mockOutputs: AudioDeviceOption[] = [
    { deviceId: 'default', label: 'Internal Speakers', isDefault: true, kind: 'audiooutput' },
    { deviceId: 'speaker-1', label: 'External Headphones', isDefault: false, kind: 'audiooutput' },
  ];

  it('renders input, output, and channel options when open', () => {
    render(
      <AudioSettingsModal
        isOpen={true}
        settings={mockSettings}
        availableInputs={mockInputs}
        availableOutputs={mockOutputs}
        onUpdateSettings={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('audio-settings-modal')).toBeInTheDocument();
    expect(screen.getByTestId('select-input-device')).toBeInTheDocument();
    expect(screen.getByTestId('select-output-device')).toBeInTheDocument();
    expect(screen.getByTestId('btn-channel-stereo')).toBeInTheDocument();
    expect(screen.getByTestId('btn-channel-mono-ch1')).toBeInTheDocument();
    expect(screen.getByTestId('btn-channel-mono-ch2')).toBeInTheDocument();
  });

  it('updates input device when changed', () => {
    const onUpdate = vi.fn();
    render(
      <AudioSettingsModal
        isOpen={true}
        settings={mockSettings}
        availableInputs={mockInputs}
        availableOutputs={mockOutputs}
        onUpdateSettings={onUpdate}
        onClose={vi.fn()}
      />
    );

    fireEvent.change(screen.getByTestId('select-input-device'), {
      target: { value: 'default' },
    });
    expect(onUpdate).toHaveBeenCalledWith({ inputDeviceId: 'default' });
  });

  it('updates output device when changed', () => {
    const onUpdate = vi.fn();
    render(
      <AudioSettingsModal
        isOpen={true}
        settings={mockSettings}
        availableInputs={mockInputs}
        availableOutputs={mockOutputs}
        onUpdateSettings={onUpdate}
        onClose={vi.fn()}
      />
    );

    fireEvent.change(screen.getByTestId('select-output-device'), {
      target: { value: 'default' },
    });
    expect(onUpdate).toHaveBeenCalledWith({ outputDeviceId: 'default' });
  });

  it('switches channel mode on button click', () => {
    const onUpdate = vi.fn();
    render(
      <AudioSettingsModal
        isOpen={true}
        settings={mockSettings}
        availableInputs={mockInputs}
        availableOutputs={mockOutputs}
        onUpdateSettings={onUpdate}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('btn-channel-mono-ch1'));
    expect(onUpdate).toHaveBeenCalledWith({ channelMode: 'mono-ch1' });
  });

  it('closes on Done button click, close button, or Escape key', () => {
    const onClose = vi.fn();
    render(
      <AudioSettingsModal
        isOpen={true}
        settings={mockSettings}
        availableInputs={mockInputs}
        availableOutputs={mockOutputs}
        onUpdateSettings={vi.fn()}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByTestId('btn-done-settings'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('btn-close-settings'));
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
