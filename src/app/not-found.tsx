import { Home, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        {/* Illustration */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
            <MapPin className="w-12 h-12 text-muted-foreground" />
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>

        {/* Message */}
        <h2 className="text-2xl font-semibold text-foreground mb-3">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Disclaimer */}
        <p className="mt-12 text-xs text-muted-foreground max-w-xs mx-auto">
          Pahad is a decision-support tool. It does not diagnose mental health conditions.
        </p>
      </div>
    </div>
  );
}
