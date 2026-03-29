import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize Supabase relation result that may be an object or array.
 * Supabase one-to-one relations can return either:
 * - An object directly: { name: "Area 1" }
 * - An array with one element: [{ name: "Area 1" }]
 * - null if no relation exists
 *
 * This helper safely extracts the first element if it's an array,
 * or returns the object directly if it's already an object.
 */
export function normalizeRelation<T>(
  relation: T | T[] | null | undefined
): T | null {
  if (!relation) return null;
  if (Array.isArray(relation)) {
    return relation.length > 0 ? relation[0] : null;
  }
  return relation;
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateStr: string | Date, locale: string = 'en'): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat(locale === 'ne' ? 'ne-NP' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Format a date string to a relative time (e.g., "2 days ago")
 */
export function formatRelativeDate(dateStr: string | Date, locale: string = 'en'): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale === 'ne' ? 'ne-NP' : 'en-US', {
    numeric: 'auto',
  });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (diffInSeconds < 604800) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 604800), 'week');
  } else {
    return formatDate(date, locale);
  }
}

export function getMetadataBase(appUrl?: string) {
  const normalized = appUrl?.trim();

  if (!normalized) {
    return new URL('http://localhost:3000');
  }

  if (/^https?:\/\//i.test(normalized)) {
    return new URL(normalized);
  }

  return new URL(`https://${normalized}`);
}
