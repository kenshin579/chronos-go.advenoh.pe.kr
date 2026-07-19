'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AutoLangRedirect() {
  const router = useRouter();
  useEffect(() => {
    if (localStorage.getItem('chronos-lang')) return;
    if (navigator.language.toLowerCase().startsWith('ko')) {
      router.replace('/ko/');
    }
  }, [router]);
  return null;
}
