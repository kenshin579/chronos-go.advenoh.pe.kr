'use client';

import { usePathname, useRouter } from 'next/navigation';

export function LangToggle() {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const isKo = pathname.startsWith('/ko');

  function go(to: 'en' | 'ko') {
    const rest = isKo ? pathname.replace(/^\/ko/, '') || '/' : pathname;
    const path = to === 'ko' ? `/ko${rest === '/' ? '/' : rest}` : rest;
    if (typeof window !== 'undefined') {
      localStorage.setItem('mi-lang', to);
    }
    router.push(path);
  }

  return (
    <div className="mi-pill-toggle">
      <button className={!isKo ? 'active' : ''} onClick={() => go('en')}>
        EN
      </button>
      <button className={isKo ? 'active' : ''} onClick={() => go('ko')}>
        KO
      </button>
    </div>
  );
}
