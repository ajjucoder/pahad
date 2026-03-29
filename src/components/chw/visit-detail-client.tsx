'use client';

import { ArrowLeft, Calendar, MapPin, User2, FileText, Building2, User } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { SignalBreakdown } from '@/components/chw/signal-breakdown';
import { CareRecommendation } from '@/components/shared/care-recommendation';
import { useLanguage } from '@/providers/language-provider';
import { formatDate, cn } from '@/lib/utils';
import type { Visit, Household, Profile, Area, RiskLevel } from '@/lib/types';

// Safe type that excludes PII (head_name) - matches server component type
type VisitWithDetails = Visit & {
  households: Pick<Household, 'code' | 'area_id'> & {
    areas: Pick<Area, 'name' | 'name_ne'> | null;
  };
  profiles: Pick<Profile, 'full_name'>;
};

interface VisitDetailClientProps {
  visit: VisitWithDetails;
}

const RISK_COLORS: Record<RiskLevel, { gradient: string; dot: string; text: string }> = {
  low: {
    gradient: 'from-emerald-500 to-emerald-600',
    dot: 'bg-emerald-400',
    text: 'text-emerald-50'
  },
  moderate: {
    gradient: 'from-amber-500 to-amber-600',
    dot: 'bg-amber-400',
    text: 'text-amber-50'
  },
  high: {
    gradient: 'from-orange-500 to-orange-600',
    dot: 'bg-orange-400',
    text: 'text-orange-50'
  },
  critical: {
    gradient: 'from-red-500 to-red-600',
    dot: 'bg-red-400',
    text: 'text-red-50'
  },
};

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

  // Risk colors
  const riskStyle = RISK_COLORS[visit.risk_level];

  // Patient info display
  const hasPatientInfo = visit.patient_name || visit.patient_age || visit.patient_gender;

  return (
    <div className="space-y-5">
      {/* Back Button */}
      <Link href="/app/visits" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" />
        {t('common.back')}
      </Link>

      {/* Visit Header Card */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardContent className="p-0">
          {/* Risk Banner */}
          <div className={cn(
            "p-5 bg-gradient-to-r",
            riskStyle.gradient
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-11 rounded-xl bg-white/20 text-white">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {visit.households.code}
                  </h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Calendar className="size-3 text-white/70" />
                    <span className="text-xs text-white/80">{formattedDate}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white tabular-nums">
                  {visit.total_score}
                </div>
                <div className="text-xs text-white/80 uppercase tracking-wide">
                  {t('visit.score')}
                </div>
              </div>
            </div>
          </div>
          
          {/* Risk Level Indicator */}
          <div className="px-5 py-3 bg-muted/30 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("size-2 rounded-full", riskStyle.dot)} />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t('visit.riskLevel')}
              </span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {visit.risk_level.charAt(0).toUpperCase() + visit.risk_level.slice(1)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Patient Information */}
      {hasPatientInfo && (
        <>
          <div className="space-y-1 px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-sage-dark)]/70">
              {t('visit.patientInfo') || 'Patient Information'}
            </h2>
          </div>
          <Card className="border-0 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-0 divide-y divide-border/30">
              {visit.patient_name && (
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t('visit.patientName') || 'Name'}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{visit.patient_name}</span>
                </div>
              )}
              {visit.patient_age !== null && visit.patient_age !== undefined && (
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t('visit.patientAge') || 'Age'}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{visit.patient_age} {locale === 'ne' ? 'वर्ष' : 'years'}</span>
                </div>
              )}
              {visit.patient_gender && (
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User2 className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t('visit.patientGender') || 'Gender'}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{visit.patient_gender}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Signal Breakdown */}
      <div className="space-y-1 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-sage-dark)]/70">
          {t('visit.screeningResponses')}
        </h2>
      </div>
      
      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-4">
          <SignalBreakdown responses={visit.responses} />
        </CardContent>
      </Card>

      {/* Explanation */}
      <div className="space-y-1 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-sage-dark)]/70">
          {t('visit.explanation')}
        </h2>
      </div>

      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-[var(--color-ivory)]/30 overflow-hidden">
        <CardContent className="p-4">
          <p className="text-sm text-foreground/80 leading-relaxed">
            {explanation}
          </p>
        </CardContent>
      </Card>

      {/* Recommendation Card with Action, Care Path, and Specialist */}
      <CareRecommendation
        level={visit.risk_level}
        score={visit.total_score}
        action_en={visit.action_en}
        action_ne={visit.action_ne}
        recommendation_en={visit.recommendation_en}
        recommendation_ne={visit.recommendation_ne}
        specialist_type={visit.specialist_type}
        patient_age={visit.patient_age}
      />

      {/* Notes (if any) */}
      {visit.notes && (
        <>
          <div className="space-y-1 px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-sage-dark)]/70">
              {t('visit.notesDisplay')}
            </h2>
          </div>
          
          <Card className="border-0 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <FileText className="size-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/80">{visit.notes}</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Visit Metadata */}
      <div className="space-y-1 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-sage-dark)]/70">
          Details
        </h2>
      </div>
      
      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0 divide-y divide-border/30">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('visit.household')}</span>
            </div>
            <span className="text-sm font-medium text-foreground">{visit.households.code}</span>
          </div>
          
          {areaName && (
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('settings.area')}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{areaName}</span>
            </div>
          )}
          
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User2 className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('visit.chw')}</span>
            </div>
            <span className="text-sm font-medium text-foreground">{visit.profiles.full_name}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
