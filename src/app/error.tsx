'use client';

import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16">
      <Card className="max-w-md w-full border-destructive/20 bg-card shadow-organic">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. Please try again or return to the home page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error details (development only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-mono text-muted-foreground break-all">
                {error.message || 'Unknown error'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={reset}
              variant="default"
              className="flex-1 gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            <Button asChild variant="outline" className="flex-1 gap-2">
              <Link href="/">
                <Home className="w-4 h-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <p className="mt-8 text-xs text-muted-foreground text-center max-w-xs">
        Saveika is a decision-support tool. It does not diagnose mental health conditions.
      </p>
    </div>
  );
}
