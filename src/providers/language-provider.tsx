'use client';

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import enTranslations from '@/i18n/en.json';
import neTranslations from '@/i18n/ne.json';

export type Locale = 'en' | 'ne';

type Translations = typeof enTranslations;

const translations: Record<Locale, Translations> = {
  en: enTranslations,
  ne: neTranslations,
};

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'saveika-locale';
const LEGACY_STORAGE_KEY = 'pahad-locale';

// Safely access localStorage - returns null in restricted contexts
function safeGetLocale(): Locale | null {
  try {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    return (stored === 'en' || stored === 'ne') ? stored : null;
  } catch {
    // localStorage access denied in restricted contexts (e.g., private browsing, sandboxed iframes)
    return null;
  }
}

// Safely set localStorage - fails silently in restricted contexts
function safeSetLocale(locale: Locale): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, locale);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    // Dispatch a storage event to notify other subscribers in the same window
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: locale }));
  } catch {
    // localStorage access denied - continue with in-memory state only
  }
}

// External store for locale using useSyncExternalStore pattern
function subscribe(callback: () => void) {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback();
    }
  };

  try {
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  } catch {
    // Return empty cleanup if window access fails
    return () => {};
  }
}

function getSnapshot(): Locale {
  const locale = safeGetLocale();
  return locale ?? 'en';
}

function getServerSnapshot(): Locale {
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Use useSyncExternalStore for proper hydration with external storage
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLocale = (newLocale: Locale) => {
    safeSetLocale(newLocale);
  };

  // Translation function using dot notation
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: unknown = translations[locale];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        // Fallback to English if key not found
        let fallback: unknown = translations.en;
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = (fallback as Record<string, unknown>)[fk];
          } else {
            return key; // Return key if not found in either
          }
        }
        return typeof fallback === 'string' ? fallback : key;
      }
    }

    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Export translations for direct access if needed
export { translations };
