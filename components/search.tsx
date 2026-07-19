'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Dict } from '@/lib/i18n/types';

declare global {
  interface Window {
    PagefindUI?: new (opts: Record<string, unknown>) => unknown;
  }
}

export function Search({ t }: { t: Dict }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  const close = useCallback(() => setOpen(false), []);

  // ⌘K / Ctrl+K toggles, Esc closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // lazy-load + mount Pagefind UI on first open
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const focusInput = () =>
      requestAnimationFrame(() =>
        containerRef.current?.querySelector<HTMLInputElement>('input')?.focus(),
      );

    const mount = () => {
      if (cancelled || !containerRef.current) return;
      if (!window.PagefindUI) {
        setStatus('error');
        return;
      }
      if (!mountedRef.current) {
        new window.PagefindUI({
          element: containerRef.current,
          showSubResults: true,
          showImages: false,
          resetStyles: false,
          translations: { placeholder: t.search.placeholder, zero_results: t.search.empty },
        });
        mountedRef.current = true;
      }
      setStatus('ready');
      focusInput();
    };

    if (window.PagefindUI) {
      mount();
      return () => {
        cancelled = true;
      };
    }

    setStatus('loading');
    let script = document.querySelector<HTMLScriptElement>('script[data-pagefind-ui]');
    if (!script) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/pagefind/pagefind-ui.css';
      document.head.appendChild(link);

      script = document.createElement('script');
      script.src = '/pagefind/pagefind-ui.js';
      script.async = true;
      script.dataset.pagefindUi = 'true';
      document.body.appendChild(script);
    }
    const onLoad = () => mount();
    const onError = () => {
      if (!cancelled) setStatus('error');
    };
    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);

    return () => {
      cancelled = true;
      script?.removeEventListener('load', onLoad);
      script?.removeEventListener('error', onError);
    };
  }, [open, t]);

  return (
    <>
      <button
        type="button"
        className="mi-icon-btn mi-search-btn"
        aria-label={t.search.label}
        onClick={() => setOpen(true)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="mi-search-btn-label">{t.search.label}</span>
        <kbd className="mi-search-kbd">{t.search.shortcut}</kbd>
      </button>

      {open && (
        <div className="mi-search-overlay" onClick={close}>
          <div
            className="mi-search-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t.search.label}
            onClick={(e) => e.stopPropagation()}
          >
            <div ref={containerRef} className="mi-search-pagefind" />
            {status === 'error' && <p className="mi-search-note">{t.search.unavailable}</p>}
          </div>
        </div>
      )}
    </>
  );
}
