'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, CalendarCheck, Plus, MapPin, Building2, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/providers/auth-provider';
import { useLanguage } from '@/providers/language-provider';
import { getSupabaseBrowserClientIfConfigured } from '@/lib/supabase/client';
import type { Area } from '@/lib/types';

export default function CHWHomePage() {
  const { profile } = useAuth();
  const { t, locale } = useLanguage();
  const [visitsThisMonth, setVisitsThisMonth] = useState<number>(0);
  const [assignedHouseholds, setAssignedHouseholds] = useState<number>(0);
  const [area, setArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!profile?.id) return;

      const supabase = getSupabaseBrowserClientIfConfigured();
      if (!supabase) {
        setLoading(false);
        return;
      }
      
      try {
        // Get visits this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: visitsCount } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('chw_id', profile.id)
          .gte('created_at', startOfMonth.toISOString());

        setVisitsThisMonth(visitsCount || 0);

        // Get assigned households count
        const { count: householdsCount } = await supabase
          .from('households')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_chw_id', profile.id);

        setAssignedHouseholds(householdsCount || 0);

        // Fetch area if profile has area_id
        if (profile.area_id) {
          const { data: areaData } = await supabase
            .from('areas')
            .select('*')
            .eq('id', profile.area_id)
            .single();

          if (areaData) {
            setArea(areaData as Area);
          }
        }
      } catch (error) {
        console.error('Error fetching CHW data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [profile?.id, profile?.area_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const greeting = profile?.full_name?.split(' ')[0] || t('home.greeting');
  const areaName = area ? (locale === 'ne' ? area.name_ne : area.name) : null;

  return (
    <div className="space-y-6">
      {/* Hero Greeting Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-[var(--color-sage)] via-[var(--color-sage-dark)] to-[var(--color-sage-dark)] overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-white/80 text-sm font-medium">
                {t('home.greeting')}
              </p>
              <h1 className="text-2xl font-bold text-white">
                {greeting}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium text-white">
                  {t('user.chw')}
                </span>
                {areaName && (
                  <span className="flex items-center gap-1 text-white/70 text-xs">
                    <MapPin className="h-3 w-3" />
                    {areaName}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-center size-12 rounded-xl bg-white/20 backdrop-blur-sm">
              <Sparkles className="size-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Section */}
      <div className="space-y-1 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-sage-dark)]/70">
          Overview
        </h2>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Visits This Month */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-[var(--color-ivory)]/30 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center size-10 rounded-xl bg-[var(--color-sage)]/10 text-[var(--color-sage-dark)] mb-2">
                <CalendarCheck className="size-5" />
              </div>
              <span className="text-3xl font-bold text-foreground tabular-nums">
                {visitsThisMonth}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">
                {t('home.visitsThisMonth')}
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Assigned Households */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-[var(--color-ivory)]/30 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center size-10 rounded-xl bg-[var(--color-terracotta)]/10 text-[var(--color-terracotta)] mb-2">
                <Building2 className="size-5" />
              </div>
              <span className="text-3xl font-bold text-foreground tabular-nums">
                {assignedHouseholds}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">
                {t('home.assignedHouseholds')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State Message */}
      {visitsThisMonth === 0 && assignedHouseholds === 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-[var(--color-sage)]/5 to-transparent">
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">
              {t('emptyStates.chwHome')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main CTA */}
      <Link href="/app/visit/new" className="block">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-[var(--color-sage)] to-[var(--color-sage-dark)] hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-11 rounded-xl bg-white/20 text-white">
                  <Plus className="size-5" />
                </div>
                <div>
                  <p className="text-white font-semibold text-base">
                    {t('home.startNewVisit')}
                  </p>
                  <p className="text-white/70 text-xs">
                    Begin a new screening
                  </p>
                </div>
              </div>
              <div className="size-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Plus className="size-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
