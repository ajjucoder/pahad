'use client';

import { LogOut, User, MapPin, Globe, Shield, Mail, Briefcase, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LanguageToggle } from '@/components/shared/language-toggle';
import { useAuth } from '@/providers/auth-provider';
import { useLanguage } from '@/providers/language-provider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { Area } from '@/lib/types';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const { profile } = useAuth();
  const { t, locale } = useLanguage();
  const [area, setArea] = useState<Area | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    async function fetchArea() {
      if (!profile?.area_id) return;
      
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from('areas')
        .select('*')
        .eq('id', profile.area_id)
        .single();

      if (data) {
        setArea(data as Area);
      }
    }

    fetchArea();
  }, [profile?.area_id]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const areaName = area ? (locale === 'ne' ? area.name_ne : area.name) : '—';

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-1 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-sage-dark)]/70">
          {t('settings.title')}
        </h2>
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
              {t('user.chw')}
            </div>
            {areaName && areaName !== '—' && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                <MapPin className="size-3" />
                {areaName}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 flex items-center justify-between">
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
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
          <div className="px-4 pb-4">
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
            {/* Name */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('settings.name')}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{profile?.full_name || '—'}</span>
            </div>
            
            {/* Email */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('settings.email')}</span>
              </div>
              <span className="text-sm font-medium text-foreground truncate max-w-[180px]">{profile?.email || '—'}</span>
            </div>
            
            {/* Role */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Briefcase className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('settings.role')}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{t('user.chw')}</span>
            </div>
            
            {/* Area */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('settings.area')}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{areaName}</span>
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
