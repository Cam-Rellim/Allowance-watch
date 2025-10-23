import React, { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    try {
      const saved = (localStorage.getItem('theme') as Theme) || 'system';
      setTheme(saved);
      apply(saved);
    } catch {}
  }, []);

  function apply(next: Theme) {
    try {
      let finalTheme = next;
      if (next === 'system') {
        const dark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
        finalTheme = dark ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', finalTheme);
    } catch {}
  }

  function update(next: Theme) {
    setTheme(next);
    try { localStorage.setItem('theme', next); } catch {}
    apply(next);
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} title="Theme">
      <button
        className="btn"
        style={{ height: 36, padding: '0 10px', opacity: theme==='light'?1:0.8 }}
        onClick={() => update('light')}
      >Light</button>
      <button
        className="btn"
        style={{ height: 36, padding: '0 10px', opacity: theme==='dark'?1:0.8 }}
        onClick={() => update('dark')}
      >Dark</button>
      <button
        className="btn"
        style={{ height: 36, padding: '0 10px', opacity: theme==='system'?1:0.8 }}
        onClick={() => update('system')}
      >System</button>
    </div>
  );
      }
