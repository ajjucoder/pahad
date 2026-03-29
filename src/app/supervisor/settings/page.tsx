'use client';

import { LogOut, User, Globe, Shield, Mail, Briefcase, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LanguageToggle } from '@/components/shared/language-toggle';
import { useAuth } from '@/providers/auth-provider';
import { useLanguage } from '@/providers/language-provider';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function SupervisorSettingsPage() {
  const { profile, signOut } = useAuth();
  const { t, locale } = useLanguage();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header Section */}
      <div className="space-y-1 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-sage-dark)]/70">
          {t('settings.title')}
        </h2>
        <p className="text-muted-foreground text-xs mt-0.5">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Profile Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white via-[var(--color-ivory)]/30 to-white overflow-hidden">
        <CardContent className="p-0">
          <div className="p-5 bg-gradient-to-r from-[var(--color-sage)]/10 to-transparent border-b border-border/30">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center size-14 rounded-2xl bg-[var(--color-sage)] text-white shadow-md">
                <User className="size-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-foreground truncate">
                  {profile?.full_name || 'User'}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {profile?.email || '—'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Quick Info Pills */}
          <div className="p-4 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-sage)]/10 text-[var(--color-sage-dark)] text-xs font-medium">
              <Briefcase className="size-3" />
              {t('user.supervisor')}
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
              <MapPin className="size-3" />
              {t('settings.allAreas')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-xl bg-[var(--color-sage)]/10 text-[var(--color-sage-dark)]">
                <Globe className="size-5" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">
                  {t('settings.language')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {locale === 'ne' ? 'नेपाली' : 'English'}
                </p>
              </div>
            </div>
          </div>
          <div className="px-4 pb-4 pt-3">
            <LanguageToggle variant="cards" />
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-xl bg-muted text-muted-foreground">
                <Shield className="size-5" />
              </div>
              <p className="font-medium text-sm text-foreground">
                {t('settings.accountInfo')}
              </p>
            </div>
          </div>
          
          <div className="divide-y divide-border/30">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('settings.name')}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{profile?.full_name || '—'}</span>
            </div>
            
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('settings.email')}</span>
              </div>
              <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{profile?.email || '—'}</span>
            </div>
            
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Briefcase className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('settings.role')}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{t('user.supervisor')}</span>
            </div>
            
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('settings.area')}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{t('settings.allAreas')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl",
          "bg-red-50 hover:bg-red-100 text-red-600 font-medium text-sm",
          "border border-red-200 hover:border-red-300",
          "transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <LogOut className="size-4" />
        {isLoggingOut ? 'Signing out...' : t('settings.logout')}
      </button>
    </div>
  );
}
