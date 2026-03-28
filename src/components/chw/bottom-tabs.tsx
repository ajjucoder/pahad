'use client';

import { Home, PlusCircle, History, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/providers/language-provider';

const TABS = [
  { href: '/app', icon: Home, labelKey: 'nav.home' },
  { href: '/app/visit/new', icon: PlusCircle, labelKey: 'nav.newVisit' },
  { href: '/app/visits', icon: History, labelKey: 'nav.history' },
  { href: '/app/settings', icon: Settings, labelKey: 'nav.settings' },
] as const;

export function BottomTabs() {
  const pathname = usePathname();
  const { t } = useLanguage();

  // Determine active tab - exact match for root, startsWith for others
  const getIsActive = (href: string) => {
    if (href === '/app') {
      return pathname === '/app';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-border/50 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {TABS.map((tab) => {
          const isActive = getIsActive(tab.href);
          const Icon = tab.icon;
          const label = t(tab.labelKey);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full',
                'transition-all duration-200 touch-manipulation',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'relative',
                isActive
                  ? 'text-[var(--color-sage-dark)]'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                "relative",
                isActive && "flex items-center justify-center"
              )}>
                <Icon className={cn('h-5 w-5 mb-1', isActive && 'stroke-[2.5px]')} />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--color-sage)]" />
                )}
              </div>
              <span className={cn('text-[10px] uppercase tracking-wider', isActive && 'font-semibold')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
