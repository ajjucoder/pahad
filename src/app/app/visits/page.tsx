'use client';

import { useEffect, useState } from 'react';
import { Loader2, FileText, Calendar, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/providers/language-provider';
import { useAuth } from '@/providers/auth-provider';
import { cn, formatDate } from '@/lib/utils';
import Link from 'next/link';
import type { Visit, Household, RiskLevel } from '@/lib/types';

type VisitWithHousehold = Visit & {
  households: Pick<Household, 'code'>;
};

export default function VisitsPage() {
  const { t, locale } = useLanguage();
  const { profile, loading: authLoading } = useAuth();
  const [visits, setVisits] = useState<VisitWithHousehold[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth context to load
    if (authLoading) {
      return;
    }

    // If auth is loaded but no profile, show error
    if (!profile) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    // Clear any stale error from previous renders before fetching
    setError(null);
    setLoading(true);

    async function fetchVisits() {
      try {
        const response = await fetch('/api/visits', { cache: 'no-store' });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to load visits');
        }

        const data = await response.json();
        setVisits(data.visits as VisitWithHousehold[]);
      } catch (err) {
        console.error('Error fetching visits:', err);
        setError(err instanceof Error ? err.message : 'Failed to load visits');
      } finally {
        setLoading(false);
      }
    }

    fetchVisits();
  }, [authLoading, profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-1 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-sage-dark)]/70">
          {t('visit.visitHistory')}
        </h2>
      </div>

      {visits.length === 0 ? (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-[var(--color-ivory)]/30">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center size-14 rounded-xl bg-muted/50 mx-auto mb-4">
              <FileText className="size-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              {t('emptyStates.visits')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visits.map((visit) => {
            const householdCode = visit.households?.code || 'Unknown';
            const visitDate = formatDate(visit.visit_date, locale);
            
            // Risk level colors
            const riskColors: Record<RiskLevel, { bg: string; text: string; dot: string }> = {
              low: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
              moderate: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
              high: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
              critical: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
            };
            const colors = riskColors[visit.risk_level];
            
            return (
              <Link key={visit.id} href={`/app/visits/${visit.id}`}>
                <Card className={cn(
                  "border-0 shadow-sm overflow-hidden transition-all duration-300 cursor-pointer",
                  "hover:shadow-md hover:scale-[1.01]",
                  "bg-gradient-to-r from-white via-white to-[var(--color-ivory)]/20"
                )}>
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      {/* Date Column */}
                      <div className="flex flex-col items-center justify-center px-4 py-4 bg-muted/30 border-r border-border/30 min-w-[80px]">
                        <Calendar className="size-4 text-muted-foreground mb-1" />
                        <span className="text-xs font-medium text-foreground tabular-nums">
                          {visitDate}
                        </span>
                      </div>
                      
                      {/* Main Content */}
                      <div className="flex-1 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-semibold text-foreground text-sm">
                              {householdCode}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Score: <span className="font-medium tabular-nums">{visit.total_score}</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-full",
                            colors.bg
                          )}>
                            <div className={cn("size-2 rounded-full", colors.dot)} />
                            <span className={cn("text-xs font-medium", colors.text)}>
                              {visit.risk_level.charAt(0).toUpperCase() + visit.risk_level.slice(1)}
                            </span>
                          </div>
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
