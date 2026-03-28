'use client';

import { useLanguage } from '@/providers/language-provider';

export function WorkersHeader() {
  const { t } = useLanguage();

  return (
    <div className="space-y-1 px-1">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-sage-dark)]/70">
        {t('workers.title')}
      </h2>
      <p className="text-muted-foreground text-xs mt-0.5">
        {t('workers.subtitle')}
      </p>
    </div>
  );
}
