'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageVisit } from '@/actions/analytics';

export default function PageTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    // Only track if pathname is available and we haven't already tracked this exact path immediately
    if (pathname && pathname !== lastTrackedPath.current) {
      lastTrackedPath.current = pathname;
      
      // Fire and forget
      trackPageVisit(pathname).catch(err => {
        // Silently fail if tracking errors
        console.error('Tracking error:', err);
      });
    }
  }, [pathname]);

  return null;
}
