'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 380);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (pathname.startsWith('/admin') || pathname.startsWith('/diar')) return null;

  return (
    <button
      type="button"
      className={`scroll-top${visible ? ' is-visible' : ''}`}
      aria-label="Späť na začiatok"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <ChevronUp size={20} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
