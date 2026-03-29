'use client';

import { useLanguage } from '@/providers/language-provider';

interface ApplicationsHeaderProps {
  count: number;
}

export function ApplicationsHeader({ count }: ApplicationsHeaderProps) {
  const { t } = useLanguage();

  // Get the subtitle template and replace the placeholder
  const subtitle = t('applications.subtitle').replace('{count}', count.toString());

  return (
    <div className="space-y-1 px-1">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-sage-dark)]/70">
        {t('applications.title')}
      </h2>
      <p className="text-muted-foreground text-xs mt-0.5">
        {subtitle}
      </p>
    </div>
  );
}
