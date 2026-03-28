'use client';

import { Card, CardContent } from '@/components/ui/card';
import { 
  ClipboardCheck, 
  AlertTriangle, 
  Users, 
  Activity 
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

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  variant?: 'default' | 'warning' | 'danger';
  suffix?: string;
}

function StatCard({ title, value, icon: Icon, variant = 'default', suffix }: StatCardProps) {
  const variantStyles = {
    default: 'text-primary',
    warning: 'text-amber-600',
    danger: 'text-red-600',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <p className={cn('text-2xl font-bold', variantStyles[variant])}>
              {value}
              {suffix && <span className="text-base font-normal ml-1">{suffix}</span>}
            </p>
          </div>
          <div className={cn(
            'p-2 rounded-lg',
            variant === 'default' && 'bg-primary/10',
            variant === 'warning' && 'bg-amber-100',
            variant === 'danger' && 'bg-red-100'
          )}>
            <Icon className={cn('h-4 w-4', variantStyles[variant])} />
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

  const getVariant = (level: RiskLevel): 'default' | 'warning' | 'danger' => {
    if (level === 'low') return 'default';
    if (level === 'moderate') return 'warning';
    return 'danger';
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title={t('dashboard.totalScreenings')}
        value={totalScreenings}
        icon={ClipboardCheck}
      />
      <StatCard
        title={t('dashboard.flaggedHouseholds')}
        value={flaggedHouseholds}
        icon={AlertTriangle}
        variant={flaggedHouseholds > 0 ? 'danger' : 'default'}
      />
      <StatCard
        title={t('dashboard.activeCHWs')}
        value={activeCHWs}
        icon={Users}
      />
      <StatCard
        title={t('dashboard.avgAreaRisk')}
        value={avgAreaRisk}
        icon={Activity}
        variant={getVariant(avgRiskLevel)}
        suffix={t('common.score')}
      />
    </div>
  );
}

// Loading skeleton for summary cards
export function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-muted rounded w-20" />
                <div className="h-7 bg-muted rounded w-12" />
              </div>
              <div className="w-9 h-9 bg-muted rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
