'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskBadge } from '@/components/shared/risk-badge';
import { SignalBreakdown } from '@/components/chw/signal-breakdown';
import { useLanguage } from '@/providers/language-provider';
import { formatDate } from '@/lib/utils';
import type { Visit, Household, Profile, Area } from '@/lib/types';

type VisitWithDetails = Visit & {
  households: Pick<Household, 'code' | 'head_name' | 'area_id'> & {
    areas: Pick<Area, 'name' | 'name_ne'> | null;
  };
  profiles: Pick<Profile, 'full_name'>;
};

interface VisitDetailClientProps {
  visit: VisitWithDetails;
}

export function VisitDetailClient({ visit }: VisitDetailClientProps) {
  const { locale, t } = useLanguage();

  // Get explanation based on current locale
  const explanation = locale === 'ne' && visit.explanation_ne
    ? visit.explanation_ne
    : visit.explanation_en;

  // Get area name based on locale
  const areaName = visit.households.areas
    ? (locale === 'ne' && visit.households.areas.name_ne
        ? visit.households.areas.name_ne
        : visit.households.areas.name)
    : null;

  // Format date with current locale
  const formattedDate = formatDate(visit.visit_date, locale);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/app/visits">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
      </Link>

      {/* Visit Header */}
      <div>
        <h1 className="text-xl font-bold">{visit.households.code}</h1>
        <p className="text-sm text-muted-foreground">
          {formattedDate}
        </p>
      </div>

      {/* Risk Score Card */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('visit.riskAssessment')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('visit.score')}</span>
            <RiskBadge level={visit.risk_level} score={visit.total_score} showScore size="lg" />
          </div>
        </CardContent>
      </Card>

      {/* Signal Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('visit.screeningResponses')}</CardTitle>
        </CardHeader>
        <CardContent>
          <SignalBreakdown responses={visit.responses} />
        </CardContent>
      </Card>

      {/* Explanation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('visit.explanation')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {explanation}
          </p>
        </CardContent>
      </Card>

      {/* Notes (if any) */}
      {visit.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('visit.notesDisplay')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{visit.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Visit Metadata */}
      <Card className="bg-muted/50">
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('visit.household')}</span>
            <span>{visit.households.code}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('settings.area')}</span>
            <span>{areaName || 'Unknown'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('visit.chw')}</span>
            <span>{visit.profiles.full_name}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
