'use client';

import { Card, CardContent } from '@/components/ui/card';
import { 
  ClipboardCheck, 
  AlertTriangle, 
  Users,
  TrendingUp
} from 'lucide-react';
import { useLanguage } from '@/providers/language-provider';
import type { RiskLevel } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
  totalScreenings: number;
  flaggedHouseholds: number;
  activeCHWs: number;
  avgAreaRisk: number;
  avgRiskLevel: RiskLevel;
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  variant = 'default',
  suffix
}: { 
  title: string; 
  value: number | string; 
  icon: React.ElementType;
  variant?: 'default' | 'warning' | 'danger' | 'success';
  suffix?: string;
}) {
  const variantStyles = {
    default: { icon: 'bg-[var(--color-sage)]/10 text-[var(--color-sage-dark)]', gradient: 'from-[var(--color-sage)] to-[var(--color-sage-dark)]' },
    warning: { icon: 'bg-amber-100 text-amber-600', gradient: 'from-amber-500 to-amber-600' },
    danger: { icon: 'bg-red-100 text-red-600', gradient: 'from-red-500 to-red-600' },
    success: { icon: 'bg-emerald-100 text-emerald-600', gradient: 'from-emerald-500 to-emerald-600' },
  };

  const styles = variantStyles[variant];

  return (
    <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn('flex items-center justify-center size-10 rounded-xl', styles.icon)}>
              <Icon className="size-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-medium">{title}</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {value}
                {suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SummaryCards({ 
  totalScreenings, 
  flaggedHouseholds, 
  activeCHWs, 
  avgAreaRisk,
  avgRiskLevel 
}: SummaryCardsProps) {
  const { t } = useLanguage();

  const getVariant = (level: RiskLevel): 'default' | 'warning' | 'danger' | 'success' => {
    if (level === 'low') return 'success';
    if (level === 'moderate') return 'warning';
    return 'danger';
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        title={t('dashboard.totalScreenings')}
        value={totalScreenings}
        icon={ClipboardCheck}
        variant="default"
      />
      <StatCard
        title={t('dashboard.flaggedHouseholds')}
        value={flaggedHouseholds}
        icon={AlertTriangle}
        variant={flaggedHouseholds > 0 ? 'danger' : 'success'}
      />
      <StatCard
        title={t('dashboard.activeCHWs')}
        value={activeCHWs}
        icon={Users}
        variant="default"
      />
      <StatCard
        title={t('dashboard.avgAreaRisk')}
        value={avgAreaRisk}
        icon={TrendingUp}
        variant={getVariant(avgRiskLevel)}
        suffix={t('common.score')}
      />
    </div>
  );
}

// Loading skeleton for summary cards
export function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="border-0 shadow-sm bg-white animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-20" />
                <div className="h-6 bg-muted rounded w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
