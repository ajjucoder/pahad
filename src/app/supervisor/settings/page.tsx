'use client';

import { LogOut, User, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/shared/language-toggle';
import { useAuth } from '@/providers/auth-provider';
import { useLanguage } from '@/providers/language-provider';
import { useState } from 'react';

export default function SupervisorSettingsPage() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Language Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('settings.language')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LanguageToggle variant="default" />
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('settings.accountInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground text-sm">
              {t('settings.name')}
            </span>
            <span className="text-sm font-medium">
              {profile?.full_name || '—'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground text-sm">
              {t('settings.email')}
            </span>
            <span className="text-sm font-medium">
              {profile?.email || '—'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground text-sm">
              {t('settings.role')}
            </span>
            <span className="text-sm font-medium">{t('user.supervisor')}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground text-sm">
              {t('settings.area')}
            </span>
            <span className="text-sm font-medium">{t('settings.allAreas')}</span>
          </div>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Button
        variant="outline"
        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        <LogOut className="h-4 w-4 mr-2" />
        {t('settings.logout')}
      </Button>
    </div>
  );
}
