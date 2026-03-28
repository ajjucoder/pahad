'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { SupervisorSidebar } from '@/components/supervisor/sidebar';

export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (profile?.role === 'chw') {
        router.push('/app');
      }
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || profile?.role !== 'supervisor') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <SupervisorSidebar />
      <main className="flex-1 flex flex-col min-h-screen">
        <div className="flex-1 p-4 md:p-6 pt-16 md:pt-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
