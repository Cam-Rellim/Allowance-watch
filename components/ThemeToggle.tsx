// components/ThemeToggle.tsx
import { useEffect, useState } from 'react';

type Mode = 'system' | 'light' | 'dark';
const KEY = 'aw_theme';

function applyTheme(mode: Mode) {
  const root = document.documentElement;
  const sysDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const isDark = mode === 'dark' || (mode === 'system' && sysDark);
  root.classList.toggle('theme-dark', isDark);
  root.classList.toggle('theme-light', !isDark);
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>('system');

  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as Mode) || 'system';
    setMode(stored);
    applyTheme(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, mode);
    applyTheme(mode);
  }, [mode]);

  return (
    <div className="segmented">
      <button
        className={mode === 'light' ? 'active' : ''}
        onClick={() => setMode('light')}
        aria-pressed={mode === 'light'}
      >
        Light
      </button>
      <button
        className={mode === 'dark' ? 'active' : ''}
        onClick={() => setMode('dark')}
        aria-pressed={mode === 'dark'}
      >
        Dark
      </button>
      <button
        className={mode === 'system' ? 'active' : ''}
        onClick={() => setMode('system')}
        aria-pressed={mode === 'system'}
      >
        System
      </button>
    </div>
  );
}
