'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/providers/language-provider';
import { RiskBadge } from '@/components/shared/risk-badge';
import { STATUS_COLORS } from '@/lib/constants';
import type { RiskLevel, HouseholdStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
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

export function FlaggedTable({ households, loading }: FlaggedTableProps) {
  const { t, locale } = useLanguage();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('dashboard.flaggedHouseholds')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (households.length === 0) {
    return (
      <Card className="bg-emerald-50 border-emerald-200">
        <CardContent className="p-6 text-center">
          <p className="text-emerald-700 font-medium">
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('dashboard.flaggedHouseholds')}</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('dashboard.householdCode')}</TableHead>
                <TableHead>{t('dashboard.area')}</TableHead>
                <TableHead className="text-center">{t('dashboard.riskScore')}</TableHead>
                <TableHead>{t('dashboard.lastVisit')}</TableHead>
                <TableHead>{t('dashboard.chw')}</TableHead>
                <TableHead>{t('dashboard.status')}</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {households.map((household) => {
                const areaName = locale === 'ne' ? household.area_name_ne : household.area_name;
                const statusColors = STATUS_COLORS[household.status];
                
                return (
                  <TableRow key={household.id} className="group">
                    <TableCell className="font-medium">{household.code}</TableCell>
                    <TableCell className="text-muted-foreground">{areaName}</TableCell>
                    <TableCell className="text-center">
                      <RiskBadge 
                        level={household.risk_level} 
                        score={household.risk_score}
                        showScore
                        size="sm"
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(household.last_visit_date)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {household.chw_name}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn('text-xs', statusColors.badge)}
                      >
                        {t(`status.${household.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/supervisor/household/${household.id}`}>
                        <Button 
                          variant="ghost" 
                          size="icon-sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3 px-4">
          {households.map((household) => {
            const areaName = locale === 'ne' ? household.area_name_ne : household.area_name;
            const statusColors = STATUS_COLORS[household.status];
            
            return (
              <Link 
                key={household.id} 
                href={`/supervisor/household/${household.id}`}
                className="block"
              >
                <div className="border rounded-lg p-3 hover:bg-accent transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{household.code}</p>
                      <p className="text-xs text-muted-foreground">{areaName}</p>
                    </div>
                    <RiskBadge 
                      level={household.risk_level} 
                      score={household.risk_score}
                      showScore
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{household.chw_name}</span>
                    <span>{formatDate(household.last_visit_date)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge 
                      variant="outline" 
                      className={cn('text-xs', statusColors.badge)}
                    >
                      {t(`status.${household.status}`)}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
