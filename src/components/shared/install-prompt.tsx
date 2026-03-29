'use client';

import { Download, Share, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISSAL_KEY = 'saveika-install-dismissed';
const LEGACY_DISMISSAL_KEY = 'pahad-install-dismissed';
const DISMISSAL_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

// Helper functions to check device state
function getIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const iOSStandalone = 'standalone' in window.navigator && (window.navigator as Navigator & { standalone: boolean }).standalone;
  return standalone || iOSStandalone;
}

function getIsIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
}

function getIsDismissed(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const dismissed = localStorage.getItem(DISMISSAL_KEY) ?? localStorage.getItem(LEGACY_DISMISSAL_KEY);
    return dismissed ? Date.now() - parseInt(dismissed, 10) < DISMISSAL_DURATION : false;
  } catch {
    return false;
  }
}

function persistDismissal(timestamp: string) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DISMISSAL_KEY, timestamp);
    localStorage.removeItem(LEGACY_DISMISSAL_KEY);
  } catch {
    // Ignore storage failures in restricted browser contexts.
  }
}

/**
 * Install Prompt Component
 *
 * Shows PWA install prompt for:
 * - Desktop/Android: Native browser install prompt
 * - iOS: Manual "Add to Home Screen" instructions
 */
export function InstallPrompt() {
  // Initialize state with functions (called once on mount)
  const [isStandalone] = useState(getIsStandalone);
  const [isIOS] = useState(getIsIOS);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initRef = useRef(false);

  // Handle install prompt event and iOS timing
  useEffect(() => {
    if (isStandalone || initRef.current) return;
    initRef.current = true;

    const isDismissed = getIsDismissed();

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      if (!isDismissed) {
        timeoutRef.current = setTimeout(() => {
          setShowPrompt(true);
        }, 5000);
      }
    };

    // For iOS, show after delay if not dismissed
    if (isIOS && !isDismissed) {
      timeoutRef.current = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Check if app was installed
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isIOS, isStandalone]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    setShowPrompt(false);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    persistDismissal(Date.now().toString());
  }, []);

  // Don't show if already installed
  if (isStandalone) return null;
  // Don't show if not prompted
  if (!showPrompt) return null;
  // For non-iOS, require deferred prompt
  if (!isIOS && !deferredPrompt) return null;

  // iOS install instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 px-4 sm:left-auto sm:right-4 sm:max-w-sm">
        <Card className="border-primary/20 shadow-organic-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="w-4 h-4" />
                Install Saveika
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={handleDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <CardDescription className="text-sm">
              Add Saveika to your home screen for quick access
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>1.</span>
              <span>Tap the</span>
              <Share className="w-4 h-4" />
              <span>Share button</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>2.</span>
              <span>Scroll down and tap &quot;Add to Home Screen&quot;</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Android/Desktop install prompt
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 px-4 sm:left-auto sm:right-4 sm:max-w-sm">
      <Card className="border-primary/20 shadow-organic-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="w-4 h-4" />
              Install Saveika
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={handleDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription className="text-sm">
            Install this app for faster access and offline support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleInstall} className="w-full gap-2">
            <Download className="w-4 h-4" />
            Install App
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
