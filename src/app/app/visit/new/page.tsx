'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { VisitForm } from '@/components/chw/visit-form';
import { useLanguage } from '@/providers/language-provider';
import { useAuth } from '@/providers/auth-provider';
import type { Household } from '@/lib/types';

export default function NewVisitPage() {
  const { t } = useLanguage();
  const { profile, loading: authLoading } = useAuth();
  const [households, setHouseholds] = useState<Household[]>([]);
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

    async function fetchHouseholds() {
      try {
        const response = await fetch('/api/households', { cache: 'no-store' });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to load households');
        }

        const data = await response.json();
        setHouseholds(data.households as Household[]);
      } catch (err) {
        console.error('Error fetching households:', err);
        setError(err instanceof Error ? err.message : 'Failed to load households');
      } finally {
        setLoading(false);
      }
    }

    fetchHouseholds();
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

  if (households.length === 0 && !profile?.area_id) {
    return (
      <div className="text-center py-12 space-y-2">
        <p className="text-muted-foreground">{t('emptyStates.chwHome')}</p>
        <p className="text-sm text-muted-foreground">{t('visit.noAssignedArea')}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">{t('nav.newVisit')}</h1>
      <VisitForm households={households} />
    </div>
  );
}
