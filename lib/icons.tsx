type IconName =
  | 'logo'
  | 'github'
  | 'sun'
  | 'moon'
  | 'chev'
  | 'download'
  | 'arrow'
  | 'tree'
  | 'chart'
  | 'diff'
  | 'send'
  | 'record'
  | 'shield';

const paths: Record<IconName, React.ReactNode> = {
  logo: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#mi-logo-grad)" stroke="none" />
      <path d="M6 15.5 9.5 10l3 4 2.5-5 3 6.5" stroke="#fff" strokeWidth="1.8" fill="none" />
    </>
  ),
  github: (
    <path d="M12 2A10 10 0 0 0 8.84 21.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85V21c0 .27.16.59.67.5A10 10 0 0 0 12 2Z" fill="currentColor" stroke="none" />
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
  chev: <path d="m6 9 6 6 6-6" />,
  download: <path d="M12 3v12m0 0 5-5m-5 5-5-5M4 21h16" />,
  arrow: <path d="M5 12h14m0 0-6-6m6 6-6 6" />,
  tree: <path d="M6 3v18M6 8h7a3 3 0 0 1 3 3v0M6 15h9a3 3 0 0 1 3 3v0" />,
  chart: <path d="M3 21h18M5 17l4-6 3 3 4-8 3 5" />,
  diff: <path d="M9 7h11M9 12h11M9 17h11M4 7h.01M4 12h.01M4 17h.01" />,
  send: <path d="m3 11 18-8-8 18-2.5-7.5L3 11Z" />,
  record: <circle cx="12" cy="12" r="6" fill="currentColor" stroke="none" />,
  shield: <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />,
};

export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === 'logo' && (
        <defs>
          <linearGradient id="mi-logo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4f8cff" />
            <stop offset="1" stopColor="#9f6bff" />
          </linearGradient>
        </defs>
      )}
      {paths[name]}
    </svg>
  );
}
