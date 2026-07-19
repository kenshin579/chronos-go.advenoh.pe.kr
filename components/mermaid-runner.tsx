'use client';

import { useEffect } from 'react';

/**
 * Renders any `.mermaid` blocks on the page. Mermaid (~large) is dynamically
 * imported ONLY when a diagram is present, so pages without one never load it.
 * Always uses the dark theme to match the site's dark diagram panels.
 */
export function MermaidRunner() {
  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>('.mermaid:not([data-processed])'),
    );
    if (nodes.length === 0) return;
    let cancelled = false;
    (async () => {
      const mermaid = (await import('mermaid')).default;
      if (cancelled) return;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'strict',
        flowchart: { htmlLabels: true, curve: 'basis' },
      });
      try {
        await mermaid.run({ nodes });
      } catch {
        // On a parse error, leave the block hidden rather than showing raw source.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
