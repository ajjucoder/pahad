'use client';

import { useLanguage } from '@/providers/language-provider';

export function DashboardHeader() {
  const { t } = useLanguage();

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
      <p className="text-muted-foreground text-sm mt-1">
        {t('dashboard.subtitle')}
      </p>
    </div>
  );
}
