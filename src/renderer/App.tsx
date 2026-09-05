import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/AppLayout';

export function App() {
  return (
    <ThemeProvider>
      <AppLayout />
    </ThemeProvider>
  );
}
