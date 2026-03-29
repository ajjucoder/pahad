'use client';

import { useEffect } from 'react';

/**
 * Service Worker Registration Component
 *
 * Registers the service worker for PWA installability.
 * Should be included in the root layout.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let updateIntervalId: ReturnType<typeof setInterval> | null = null;

    // Only register in production or when explicitly enabled
    const shouldRegister =
      process.env.NODE_ENV === 'production' ||
      process.env.NEXT_PUBLIC_SW_ENABLED === 'true';

    if (!shouldRegister) return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })
        .then((registration) => {
          console.log('[PWA] Service worker registered:', registration.scope);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content available, notify user or auto-update
                  console.log('[PWA] New content available, please refresh.');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Service worker registration failed:', error);
        });

      // Handle service worker updates
      navigator.serviceWorker.ready.then((registration) => {
        // Check for updates every hour
        updateIntervalId = setInterval(
          () => {
            registration.update().catch(console.error);
          },
          60 * 60 * 1000
        );
      });
    }

    return () => {
      if (updateIntervalId) {
        clearInterval(updateIntervalId);
      }
    };
  }, []);

  return null;
}
