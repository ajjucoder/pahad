'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/providers/language-provider';
import { STATUS_COLORS } from '@/lib/constants';
import type { RiskLevel, HouseholdStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ChevronRight, MapPin, Calendar, User2, Building2 } from 'lucide-react';
import Link from 'next/link';

export interface FlaggedHousehold {
  id: string;
  code: string;
  area_name: string;
  area_name_ne: string;
  risk_score: number;
  risk_level: RiskLevel;
  last_visit_date: string;
  chw_name: string;
  status: HouseholdStatus;
}

interface FlaggedTableProps {
  households: FlaggedHousehold[];
  loading?: boolean;
}

const RISK_STYLES: Record<RiskLevel, { bg: string; text: string; border: string; dot: string }> = {
  low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  moderate: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
};

export function FlaggedTable({ households, loading }: FlaggedTableProps) {
  const { t, locale } = useLanguage();

  if (loading) {
    return (
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-5">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (households.length === 0) {
    return (
      <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center size-12 rounded-xl bg-emerald-100 mx-auto mb-3">
            <Building2 className="size-6 text-emerald-600" />
          </div>
          <p className="text-emerald-700 font-medium text-sm">
            {t('emptyStates.flagged')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'ne' ? 'ne-NP' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-1 px-1">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-sage-dark)]/70">
        {t('dashboard.flaggedHouseholds')}
      </h2>
      
      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0 divide-y divide-border/30">
          {households.map((household) => {
            const areaName = locale === 'ne' ? household.area_name_ne : household.area_name;
            const statusColors = STATUS_COLORS[household.status];
            const riskStyle = RISK_STYLES[household.risk_level];

            return (
              <Link 
                key={household.id} 
                href={`/supervisor/household/${household.id}`}
                className="block"
              >
                <div className="px-4 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors">
                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground text-sm">
                        {household.code}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={cn('text-[10px] px-1.5 py-0 h-4', statusColors.badge)}
                      >
                        {t(`status.${household.status}`)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {areaName}
                      </span>
                      <span className="flex items-center gap-1">
                        <User2 className="size-3" />
                        {household.chw_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatDate(household.last_visit_date)}
                      </span>
                    </div>
                  </div>

                  {/* Risk Indicator */}
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border",
                      riskStyle.bg,
                      riskStyle.border
                    )}>
                      <div className={cn("size-2 rounded-full", riskStyle.dot)} />
                      <span className={cn("text-sm font-semibold tabular-nums", riskStyle.text)}>
                        {household.risk_score}
                      </span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground/60" />
                  </div>
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
