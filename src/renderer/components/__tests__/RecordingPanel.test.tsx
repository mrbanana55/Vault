import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecordingPanel } from '../RecordingPanel';

const mockUseAudioRecordingDock = vi.fn();

vi.mock('../../hooks/useAudioRecordingDock', () => ({
  useAudioRecordingDock: (opts?: unknown) => mockUseAudioRecordingDock(opts),
}));

describe('RecordingPanel (US1, US2, US3)', () => {
  const defaultHookReturn = {
    state: 'idle',
    formattedTime: '0:00',
    error: null,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    inputGain: 1.0,
    setInputGain: vi.fn(),
    outputVolume: 0.8,
    setOutputVolume: vi.fn(),
    inputLevels: { rms: 0, peak: 0, isClipping: false },
    outputLevels: { rms: 0, peak: 0, isClipping: false },
    isPromptingMetadata: false,
    recordedDuration: 0,
    saveIdea: vi.fn(),
    discardIdea: vi.fn(),
    isSettingsOpen: false,
    openSettings: vi.fn(),
    closeSettings: vi.fn(),
    hardwareSettings: {
      inputDeviceId: 'default',
      outputDeviceId: 'default',
      channelMode: 'stereo',
      inputGain: 1.0,
      outputVolume: 0.8,
    },
    updateHardwareSettings: vi.fn(),
    availableInputs: [],
    availableOutputs: [],
    isMonitoring: false,
    toggleMonitoring: vi.fn(),
  };

  beforeEach(() => {
    mockUseAudioRecordingDock.mockReturnValue(defaultHookReturn);
  });

  it('renders all sections in idle state in correct order', () => {
    render(<RecordingPanel />);

    expect(screen.getByTestId('recording-panel')).toBeInTheDocument();
    expect(screen.getByTestId('btn-toggle-monitoring')).toBeInTheDocument();
    expect(screen.getByTestId('rotary-knob-gain')).toBeInTheDocument();
    expect(screen.getByTestId('volume-meter-in')).toBeInTheDocument();
    expect(screen.getByTestId('btn-record')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByTestId('volume-meter-out')).toBeInTheDocument();
    expect(screen.getByTestId('rotary-knob-vol')).toBeInTheDocument();
    expect(screen.getByTestId('btn-audio-settings')).toBeInTheDocument();
  });

  it('toggles self monitoring when headphones button is clicked', () => {
    const toggleMonitoring = vi.fn();
    mockUseAudioRecordingDock.mockReturnValue({
      ...defaultHookReturn,
      toggleMonitoring,
    });

    render(<RecordingPanel />);
    fireEvent.click(screen.getByTestId('btn-toggle-monitoring'));
    expect(toggleMonitoring).toHaveBeenCalledTimes(1);
  });

  it('renders active monitoring state styling', () => {
    mockUseAudioRecordingDock.mockReturnValue({
      ...defaultHookReturn,
      isMonitoring: true,
    });

    render(<RecordingPanel />);
    const btn = screen.getByTestId('btn-toggle-monitoring');
    expect(btn.className).toContain('text-accent');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('triggers startRecording when record button is clicked in idle state', () => {
    const startRecording = vi.fn();
    mockUseAudioRecordingDock.mockReturnValue({
      ...defaultHookReturn,
      startRecording,
    });

    render(<RecordingPanel />);
    fireEvent.click(screen.getByTestId('btn-record'));
    expect(startRecording).toHaveBeenCalledTimes(1);
  });

  it('renders recording state with timer and stops on click', () => {
    const stopRecording = vi.fn();
    mockUseAudioRecordingDock.mockReturnValue({
      ...defaultHookReturn,
      state: 'recording',
      formattedTime: '0:05',
      stopRecording,
    });

    render(<RecordingPanel />);
    expect(screen.getByTestId('recording-timer')).toHaveTextContent('0:05');

    fireEvent.click(screen.getByTestId('btn-record'));
    expect(stopRecording).toHaveBeenCalledTimes(1);
  });

  it('opens audio settings modal when gear icon is clicked', () => {
    const openSettings = vi.fn();
    mockUseAudioRecordingDock.mockReturnValue({
      ...defaultHookReturn,
      openSettings,
    });

    render(<RecordingPanel />);
    fireEvent.click(screen.getByTestId('btn-audio-settings'));
    expect(openSettings).toHaveBeenCalledTimes(1);
  });
});
