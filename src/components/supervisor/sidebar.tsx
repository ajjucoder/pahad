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
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/supervisor" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-lg">P</span>
          </div>
          <span className="font-semibold text-lg">Pahad</span>
        </Link>
        <p className="text-xs text-muted-foreground mt-1">{t('user.supervisor')}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/supervisor' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between mb-3">
          <UserDisplay showLanguageToggle={false} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t('nav.logout')}
        </Button>
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
      <aside className="hidden md:flex w-64 flex-col fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-30">
        <SidebarContent pathname={pathname} t={t} signOut={signOut} />
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-background border-b border-border z-40 flex items-center justify-between px-4">
        <Link href="/supervisor" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold">P</span>
          </div>
          <span className="font-semibold">Pahad</span>
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
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'md:hidden fixed right-0 top-0 h-screen w-72 bg-sidebar z-50 transform transition-transform duration-200 ease-in-out',
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
      <div className="hidden md:block w-64 flex-shrink-0" />
    </>
  );
}
