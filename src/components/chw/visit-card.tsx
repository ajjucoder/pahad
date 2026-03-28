'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { RiskBadge } from '@/components/shared/risk-badge';
import { useLanguage } from '@/providers/language-provider';
import { cn, formatDate } from '@/lib/utils';
import type { Visit, Household } from '@/lib/types';

interface VisitCardProps {
  visit: Visit & { households?: Pick<Household, 'code'> };
  showHousehold?: boolean;
  className?: string;
}

export function VisitCard({ visit, showHousehold = true, className }: VisitCardProps) {
  const { locale } = useLanguage();
  const householdCode = visit.households?.code || 'Unknown';
  const visitDate = formatDate(visit.visit_date, locale);

  return (
    <Link href={`/app/visits/${visit.id}`}>
      <Card className={cn('transition-shadow hover:shadow-md cursor-pointer', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {showHousehold && (
                <p className="font-medium text-sm truncate">{householdCode}</p>
              )}
              <p className="text-xs text-muted-foreground">{visitDate}</p>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <RiskBadge level={visit.risk_level} score={visit.total_score} size="sm" />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
