'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import { useLanguage } from '@/providers/language-provider';
import { UserDisplay } from '@/components/shared/user-display';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/supervisor', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { href: '/supervisor/workers', icon: Users, labelKey: 'nav.chwActivity' },
  { href: '/supervisor/settings', icon: Settings, labelKey: 'nav.settings' },
];

interface SidebarContentProps {
  pathname: string;
  t: (key: string) => string;
  signOut: () => Promise<void>;
  onClose?: () => void;
}

function SidebarContent({ pathname, t, signOut, onClose }: SidebarContentProps) {
  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo/Brand */}
      <div className="p-5 border-b border-sidebar-border">
        <Link href="/supervisor" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-sage)] flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <div>
            <span className="font-bold text-foreground text-lg">Pahad</span>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('user.supervisor')}</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/supervisor' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-[var(--color-sage)]/10 text-[var(--color-sage-dark)]'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center justify-between mb-2">
          <UserDisplay showLanguageToggle={false} />
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t('nav.logout')}
        </button>
      </div>
    </div>
  );
}

export function SupervisorSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col fixed left-0 top-0 h-screen bg-white border-r border-border/50 z-30">
        <SidebarContent pathname={pathname} t={t} signOut={signOut} />
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b border-border/50 z-40 flex items-center justify-between px-4">
        <Link href="/supervisor" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-sage)] flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-bold text-foreground">Pahad</span>
        </Link>
        <div className="flex items-center gap-2">
          <UserDisplay showLanguageToggle={false} />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'md:hidden fixed right-0 top-0 h-screen w-64 bg-white z-50 transform transition-transform duration-200 ease-in-out shadow-xl',
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <SidebarContent 
          pathname={pathname} 
          t={t} 
          signOut={signOut} 
          onClose={() => setMobileOpen(false)} 
        />
      </aside>

      {/* Spacer for desktop sidebar */}
      <div className="hidden md:block w-60 flex-shrink-0" />
    </>
  );
}
