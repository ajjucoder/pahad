'use client';

import { useEffect, useState } from 'react';
import { Loader2, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { VisitCard } from '@/components/chw/visit-card';
import { useLanguage } from '@/providers/language-provider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Visit, Household } from '@/lib/types';

type VisitWithHousehold = Visit & {
  households: Pick<Household, 'code'>;
};

export default function VisitsPage() {
  const { t } = useLanguage();
  const [visits, setVisits] = useState<VisitWithHousehold[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVisits() {
      const supabase = getSupabaseBrowserClient();
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('visits')
          .select(`
            *,
            households (
              code
            )
          `)
          .eq('chw_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        setVisits(data as VisitWithHousehold[]);
      } catch (err) {
        console.error('Error fetching visits:', err);
        setError('Failed to load visits');
      } finally {
        setLoading(false);
      }
    }

    fetchVisits();
  }, []);

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
