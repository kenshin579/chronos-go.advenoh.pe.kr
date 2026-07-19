type IconName = 'logo' | 'github' | 'sun' | 'moon';

const paths: Record<IconName, React.ReactNode> = {
  logo: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#chronos-logo-grad)" stroke="none" />
      <rect x="10.3" y="3.4" width="3.4" height="1.6" rx="0.7" fill="#fff" stroke="none" />
      <line x1="12" y1="5" x2="12" y2="6.4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="12" cy="13.2" r="5.4" fill="none" stroke="#fff" strokeWidth="1.7" />
      <line x1="12" y1="13.2" x2="12" y2="9.7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="13.2" x2="14.7" y2="14.6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
      <circle cx="12" cy="13.2" r="1" fill="#fff" stroke="none" />
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
          <linearGradient id="chronos-logo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6366f1" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      )}
      {paths[name]}
    </svg>
  );
}
