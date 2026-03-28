'use client';

import { Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage, type Locale } from '@/providers/language-provider';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  className?: string;
  variant?: 'default' | 'compact' | 'cards';
}

const LANGUAGES: { code: Locale; label: string; nativeLabel: string; flag: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'ne', label: 'Nepali', nativeLabel: 'नेपाली', flag: '🇳🇵' },
];

export function LanguageToggle({ className, variant = 'default' }: LanguageToggleProps) {
  const { locale, setLocale, t } = useLanguage();

  const currentLanguage = LANGUAGES.find((l) => l.code === locale);

  // Cards variant - used in settings page
  if (variant === 'cards') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {LANGUAGES.map((language) => {
          const isSelected = locale === language.code;
          
          return (
            <button
              key={language.code}
              onClick={() => setLocale(language.code)}
              className={cn(
                "flex flex-col items-center p-4 rounded-xl transition-all duration-200",
                "border-2",
                "focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/30 focus:ring-offset-2",
                isSelected
                  ? "bg-[var(--color-sage)] border-[var(--color-sage)] text-white shadow-md"
                  : "bg-white border-border/40 text-foreground hover:border-[var(--color-sage)]/50"
              )}
            >
              <span className="text-2xl mb-1">{language.flag}</span>
              <span className={cn(
                "text-sm font-semibold",
                isSelected ? "text-white" : "text-foreground"
              )}>
                {language.nativeLabel}
              </span>
              <span className={cn(
                "text-xs mt-0.5",
                isSelected ? "text-white/80" : "text-muted-foreground"
              )}>
                {language.label}
              </span>
              {isSelected && (
                <div className="mt-2 flex items-center gap-1 text-xs font-medium text-white/90">
                  <Check className="size-3" />
                  Active
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === 'compact' ? 'sm' : 'default'}
          className={cn(
            "gap-2 font-medium",
            variant === 'compact' && "px-2",
            className
          )}
        >
          <Globe className="h-4 w-4" />
          {variant === 'compact' ? (
            <span className="sr-only">{t('common.language')}</span>
          ) : (
            <span>{currentLanguage?.nativeLabel}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl">
        {LANGUAGES.map((language) => {
          const isSelected = locale === language.code;
          
          return (
            <button
              key={language.code}
              onClick={() => setLocale(language.code)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                "text-left",
                isSelected
                  ? "bg-[var(--color-sage)] text-white"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <span className="text-lg">{language.flag}</span>
              <div className="flex-1">
                <p className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-white" : "text-foreground"
                )}>
                  {language.nativeLabel}
                </p>
                <p className={cn(
                  "text-xs",
                  isSelected ? "text-white/70" : "text-muted-foreground"
                )}>
                  {language.label}
                </p>
              </div>
              {isSelected && (
                <Check className="size-4 text-white" />
              )}
            </button>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
