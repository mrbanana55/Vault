import { ThemeProvider } from './context/ThemeContext';
import { AudioPlayerProvider } from './context/AudioPlayerContext';
import { AppLayout } from './components/AppLayout';

export function App() {
  return (
    <ThemeProvider>
      <AudioPlayerProvider>
        <AppLayout />
      </AudioPlayerProvider>
    </ThemeProvider>
  );
}
