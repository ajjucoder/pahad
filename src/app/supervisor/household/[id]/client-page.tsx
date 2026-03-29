'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { RiskBadge } from '@/components/shared/risk-badge';
import { SignalBreakdown } from '@/components/chw/signal-breakdown';
import { useLanguage } from '@/providers/language-provider';
import { STATUS_COLORS, RISK_COLORS } from '@/lib/constants';
import type { RiskLevel, HouseholdStatus, Visit, SpecialistType } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  MapPin,
  User,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Zap,
  Heart,
} from 'lucide-react';
import { toast } from 'sonner';

// Specialist type display for compact view
const SPECIALIST_LABELS: Record<SpecialistType, { en: string; ne: string; color: string }> = {
  psychiatrist: { en: 'Psychiatrist', ne: 'मनोचिकित्सक', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  child_psychiatrist: { en: 'Child Psychiatrist', ne: 'बाल मनोचिकित्सक', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  addiction_psychiatrist: { en: 'Addiction Specialist', ne: 'व्यसन विशेषज्ञ', color: 'text-rose-700 bg-rose-50 border-rose-200' },
};

interface HouseholdData {
  id: string;
  code: string;
  head_name: string;
  latest_risk_score: number;
  latest_risk_level: RiskLevel;
  status: HouseholdStatus;
  area: { id: string; name: string; name_ne: string } | null;
  chw: { id: string; full_name: string; email: string } | null;
  visits: (Visit & { chw_name: string })[];
}

interface HouseholdDetailClientProps {
  household: HouseholdData;
}

export function HouseholdDetailClient({ household }: HouseholdDetailClientProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(household.status);

  const areaName = household.area
    ? locale === 'ne'
      ? household.area.name_ne
      : household.area.name
    : '—';

  const handleStatusUpdate = async (newStatus: 'reviewed' | 'referred') => {
    setStatusUpdating(true);
    try {
      const response = await fetch('/api/household/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          household_id: household.id,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setCurrentStatus(newStatus);
      toast.success(t('household.statusUpdated'));
    } catch {
      toast.error(t('household.statusUpdateError'));
    } finally {
      setStatusUpdating(false);
    }
  };

  // Calculate risk trend
  const getTrendIcon = () => {
    if (household.visits.length < 2) return Minus;
    const scores = household.visits.map((v) => v.total_score).slice(0, 2);
    if (scores[0] > scores[1]) return TrendingUp; // Risk increasing
    if (scores[0] < scores[1]) return TrendingDown; // Risk decreasing
    return Minus;
  };

  const TrendIcon = getTrendIcon();
  const trendColor =
    TrendIcon === TrendingUp
      ? 'text-red-500'
      : TrendIcon === TrendingDown
      ? 'text-emerald-500'
      : 'text-muted-foreground';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'ne' ? 'ne-NP' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statusColors = STATUS_COLORS[currentStatus];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/supervisor')}
        className="mb-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('household.backToDashboard')}
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{household.code}</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {areaName}
          </p>
          {/* Head name - only visible on household detail per privacy rule */}
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <User className="h-4 w-4" />
            {household.head_name}
          </p>
        </div>

        {/* Status Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={statusUpdating || currentStatus === 'reviewed'}
              >
                {t('household.markReviewed')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('household.markReviewed')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('household.reviewedConfirmDesc').replace('{code}', household.code)}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleStatusUpdate('reviewed')}
                >
                  {t('common.save')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={statusUpdating || currentStatus === 'referred'}
              >
                {t('household.markReferred')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('household.markReferred')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('household.referredConfirmDesc').replace('{code}', household.code)}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleStatusUpdate('referred')}
                >
                  {t('common.save')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Status */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{t('household.currentStatus')}</p>
            <Badge
              variant="outline"
              className={cn('text-sm', statusColors.badge)}
            >
              {t(`status.${currentStatus}`)}
            </Badge>
          </CardContent>
        </Card>

        {/* Current Risk */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{t('household.currentRisk')}</p>
            <div className="flex items-center gap-2">
              <RiskBadge
                level={household.latest_risk_level}
                score={household.latest_risk_score}
                showScore
              />
              <TrendIcon className={cn('h-4 w-4', trendColor)} />
            </div>
          </CardContent>
        </Card>

        {/* Assigned CHW */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{t('household.assignedCHW')}</p>
            <p className="font-medium">{household.chw?.full_name || '—'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Trend */}
      {household.visits.length >= 3 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendIcon className={cn('h-4 w-4', trendColor)} />
              {t('household.riskTrend')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-16">
              {household.visits
                .slice(0, 5)
                .reverse()
                .map((visit) => {
                  const height = Math.min(100, visit.total_score);
                  const colors = RISK_COLORS[visit.risk_level];
                  return (
                    <div
                      key={visit.id}
                      className="flex flex-col items-center gap-1 flex-1"
                    >
                      <div
                        className={cn(
                          'w-full rounded-t-sm transition-all',
                          colors.bg
                        )}
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(visit.visit_date).split(',')[0]}
                      </span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visit History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t('household.visitHistory')}
            <span className="text-muted-foreground font-normal ml-2">
              ({household.visits.length} {t('household.visitsCount')})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {household.visits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t('household.noVisits')}</p>
            </div>
          ) : (
            <div className="space-y-4 px-4">
              {household.visits.map((visit, idx) => {
                  // Get action and recommendation for current locale
                  const action = locale === 'ne' && visit.action_ne ? visit.action_ne : visit.action_en;
                  const recommendation = locale === 'ne' && visit.recommendation_ne ? visit.recommendation_ne : visit.recommendation_en;
                  const specialistLabel = visit.specialist_type
                    ? (locale === 'ne'
                        ? SPECIALIST_LABELS[visit.specialist_type].ne
                        : SPECIALIST_LABELS[visit.specialist_type].en)
                    : null;
                  const specialistColor = visit.specialist_type ? SPECIALIST_LABELS[visit.specialist_type].color : '';

                  return (
                    <div key={visit.id}>
                      {idx > 0 && <Separator className="mb-4" />}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {formatDate(visit.visit_date)}
                            </span>
                            <RiskBadge
                              level={visit.risk_level}
                              score={visit.total_score}
                              showScore
                              size="sm"
                            />
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {t('visit.chw')}: {visit.chw_name}
                            {visit.patient_name && (
                              <span className="ml-2">
                                • {t('visit.patient') || 'Patient'}: {visit.patient_name}
                              </span>
                            )}
                          </p>
                          <SignalBreakdown responses={visit.responses} compact />

                          {/* Recommendation Details */}
                          {(action || recommendation || specialistLabel) && (
                            <div className="mt-3 p-3 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg space-y-2">
                              {action && (
                                <div className="flex items-start gap-2">
                                  <Zap className="size-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80 mb-0.5">
                                      {t('recommendation.actionLabel') || 'Action'}
                                    </p>
                                    <p className="text-xs font-medium text-foreground leading-snug">
                                      {action}
                                    </p>
                                  </div>
                                </div>
                              )}
                              {recommendation && (
                                <div className="flex items-start gap-2">
                                  <Heart className="size-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80 mb-0.5">
                                      {t('recommendation.careRecommendation') || 'Recommendation'}
                                    </p>
                                    <p className="text-xs text-foreground/80 leading-relaxed">
                                      {recommendation}
                                    </p>
                                  </div>
                                </div>
                              )}
                              {specialistLabel && (
                                <div className="flex items-center gap-2 pt-1">
                                  <span className="text-[10px] text-muted-foreground">
                                    {t('recommendation.specialistSuggestion') || 'Specialist'}:
                                  </span>
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-semibold border",
                                    specialistColor
                                  )}>
                                    {specialistLabel}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {visit.notes && (
                            <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                              <p className="text-xs text-muted-foreground mb-1">
                                {t('visit.notesDisplay')}:
                              </p>
                              {visit.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
