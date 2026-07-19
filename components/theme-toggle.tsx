'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Icon } from '@/lib/icons';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <button className="mi-icon-btn" aria-label="theme" />;
  }

  const isDark = resolvedTheme === 'dark';
  return (
    <button
      className="mi-icon-btn"
      title="theme"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      <Icon name={isDark ? 'sun' : 'moon'} size={15} />
    </button>
  );
}
