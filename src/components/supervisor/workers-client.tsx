'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Calendar, Activity } from 'lucide-react';
import { useLanguage } from '@/providers/language-provider';

export interface WorkerData {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  area_name: string;
  area_name_ne: string;
  visits_this_month: number;
  last_active: string | null;
}

interface WorkersClientProps {
  workers: WorkerData[];
}

export function WorkersClient({ workers }: WorkersClientProps) {
  const { t, locale } = useLanguage();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return t('workers.never');
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'ne' ? 'ne-NP' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  if (workers.length === 0) {
    return (
      <Card className="border-0 shadow-sm bg-gradient-to-br from-muted/50 to-white">
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center size-12 rounded-xl bg-muted mx-auto mb-3">
            <Activity className="size-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">{t('workers.noActivity')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-white overflow-hidden">
      <CardContent className="p-0 divide-y divide-border/30">
        {workers.map((worker) => {
          const areaName = locale === 'ne' ? worker.area_name_ne : worker.area_name;
          
          return (
            <div key={worker.id} className="p-4 flex items-center gap-4">
              {/* Avatar */}
              <Avatar className="size-12 rounded-xl">
                <AvatarImage src={worker.avatar_url || undefined} alt={worker.name} />
                <AvatarFallback className="bg-[var(--color-sage)]/10 text-[var(--color-sage-dark)] text-sm font-semibold rounded-xl">
                  {getInitials(worker.name)}
                </AvatarFallback>
              </Avatar>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">{worker.name}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    {areaName}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{worker.email}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {worker.visits_this_month}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {t('workers.visitsThisMonthShort')}
                  </p>
                </div>
                <div className="text-center px-3 py-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="size-3" />
                    <span className="text-xs">{formatDate(worker.last_active)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
