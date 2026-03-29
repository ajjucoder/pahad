'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BottomTabs } from '@/components/chw/bottom-tabs';
import { useAuth } from '@/providers/auth-provider';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, application, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!profile && application) {
        router.push('/create-account');
      } else if (profile?.role === 'supervisor') {
        router.push('/supervisor');
      }
    }
  }, [user, profile, application, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || profile?.role !== 'chw') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="max-w-lg mx-auto px-4 py-6">
        {children}
      </main>
      <BottomTabs />
    </div>
  );
}
