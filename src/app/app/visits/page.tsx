'use client';

import { useEffect, useState } from 'react';
import { Loader2, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { VisitCard } from '@/components/chw/visit-card';
import { useLanguage } from '@/providers/language-provider';
import { useAuth } from '@/providers/auth-provider';
import type { Visit, Household } from '@/lib/types';

type VisitWithHousehold = Visit & {
  households: Pick<Household, 'code'>;
};

export default function VisitsPage() {
  const { t } = useLanguage();
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
    <div>
      <h1 className="text-xl font-bold mb-6">{t('visit.visitHistory')}</h1>

      {visits.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {t('emptyStates.visits')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visits.map((visit) => (
            <VisitCard key={visit.id} visit={visit} />
          ))}
        </div>
      )}
    </div>
  );
}
