'use client';

import { Suspense, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Loader2, Phone, Home, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DisclaimerBanner } from '@/components/shared/disclaimer-banner';
import { LanguageToggle } from '@/components/shared/language-toggle';
import { useAuth } from '@/providers/auth-provider';
import { useLanguage } from '@/providers/language-provider';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

interface Area {
  id: string;
  name: string;
  name_ne: string;
}

const APPLY_STORAGE_KEYS = {
  phone: 'saveika_apply_phone',
  address: 'saveika_apply_address',
  area: 'saveika_apply_area',
} as const;

const LEGACY_APPLY_STORAGE_KEYS = {
  phone: 'pahad_apply_phone',
  address: 'pahad_apply_address',
  area: 'pahad_apply_area',
} as const;

function getApplyStorageValue(
  key: keyof typeof APPLY_STORAGE_KEYS
): string {
  if (typeof window === 'undefined') return '';

  return (
    sessionStorage.getItem(APPLY_STORAGE_KEYS[key]) ??
    sessionStorage.getItem(LEGACY_APPLY_STORAGE_KEYS[key]) ??
    ''
  );
}

function clearApplyStorage() {
  if (typeof window === 'undefined') return;

  for (const key of Object.values(APPLY_STORAGE_KEYS)) {
    sessionStorage.removeItem(key);
  }

  for (const key of Object.values(LEGACY_APPLY_STORAGE_KEYS)) {
    sessionStorage.removeItem(key);
  }
}

function ApplyContent() {
  const { t } = useLanguage();
  const { signInWithGoogle, user, profile, application, loading: authLoading } = useAuth();
  const router = useRouter();

  const [phone, setPhone] = useState(() => getApplyStorageValue('phone'));
  const [address, setAddress] = useState(() => getApplyStorageValue('address'));
  const [areaId, setAreaId] = useState(() => getApplyStorageValue('area'));
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const existingApplication = application
    ? {
        status: application.status,
        rejection_reason: application.rejection_reason ?? undefined,
      }
    : null;
  const isPendingCompletedApplication = Boolean(
    application &&
    application.status === 'pending' &&
    application.phone &&
    application.address &&
    application.area_id
  );
  const effectivePhone = phone || application?.phone || '';
  const effectiveAddress = address || application?.address || '';
  const effectiveAreaId = areaId || application?.area_id || '';

  // Load areas on mount
  useEffect(() => {
    const loadAreas = async () => {
      try {
        const response = await fetch('/api/areas');
        const data = await response.json();
        if (data.areas) {
          setAreas(data.areas);
        }
      } catch {
        console.error('Failed to load areas');
      }
    };
    loadAreas();
  }, []);

  useEffect(() => {
    if (!application) {
      return;
    }

    if (application.status === 'approved') {
      router.replace('/login');
    }
  }, [application, router]);

  // Redirect if already logged in with profile
  useEffect(() => {
    if (!authLoading && user && profile) {
      const redirectPath = profile.role === 'supervisor' ? '/supervisor' : '/app';
      router.replace(redirectPath);
    }
  }, [user, profile, authLoading, router]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      // Store form data in session storage before OAuth redirect
      clearApplyStorage();
      sessionStorage.setItem(APPLY_STORAGE_KEYS.phone, effectivePhone);
      sessionStorage.setItem(APPLY_STORAGE_KEYS.address, effectiveAddress);
      sessionStorage.setItem(APPLY_STORAGE_KEYS.area, effectiveAreaId);

      await signInWithGoogle();
    } catch {
      setError(t('auth.errors.generic'));
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError(t('apply.errors.notAuthenticated'));
      return;
    }

    if (!effectivePhone || !effectiveAddress || !effectiveAreaId) {
      setError(t('apply.errors.required'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: effectivePhone,
          address: effectiveAddress,
          area_id: effectiveAreaId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('apply.errors.submit'));
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      clearApplyStorage();
    } catch {
      setError(t('apply.errors.generic'));
      setIsLoading(false);
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-[#5B7553]" />
      </div>
    );
  }

  // If already has profile, don't show apply page
  if (user && profile) {
    return null;
  }

  // Success state - application submitted
  if (success || (user && isPendingCompletedApplication)) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="border-b border-border/40 bg-background/80 backdrop-blur-lg"
        >
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#5B7553] to-[#3D5235] flex items-center justify-center shadow-lg shadow-[#5B7553]/20">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-foreground">
                {t('app.name')}
              </span>
            </Link>
            <LanguageToggle />
          </div>
        </motion.header>

        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#5B7553]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#C67B5C]/5 rounded-full blur-3xl" />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md relative z-10"
          >
            <Card className="border-border/50 shadow-organic-lg bg-card/80 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-4">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#5B7553]/10 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-[#5B7553]" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-center">
                  {t('apply.success.title')}
                </CardTitle>
                <CardDescription className="text-center">
                  {t('apply.success.message')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground text-center">
                    {t('apply.success.nextSteps')}
                  </p>
                </div>
                <Button
                  asChild
                  className="w-full h-12 rounded-xl bg-[#5B7553] hover:bg-[#3D5235] text-white shadow-md shadow-[#5B7553]/20"
                >
                  <Link href="/login">
                    {t('apply.success.backToLogin')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    );
  }

  // Rejection state
  if (user && existingApplication?.status === 'rejected') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="border-b border-border/40 bg-background/80 backdrop-blur-lg"
        >
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#5B7553] to-[#3D5235] flex items-center justify-center shadow-lg shadow-[#5B7553]/20">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-foreground">
                {t('app.name')}
              </span>
            </Link>
            <LanguageToggle />
          </div>
        </motion.header>

        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C67B5C]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#C67B5C]/5 rounded-full blur-3xl" />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md relative z-10"
          >
            <Card className="border-border/50 shadow-organic-lg bg-card/80 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold text-center">
                  {t('apply.rejected.title')}
                </CardTitle>
                <CardDescription className="text-center">
                  {t('apply.rejected.message')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {existingApplication?.rejection_reason && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
                    <AlertDescription>{existingApplication.rejection_reason}</AlertDescription>
                  </Alert>
                )}
                <Button
                  asChild
                  className="w-full h-12 rounded-xl bg-[#5B7553] hover:bg-[#3D5235] text-white shadow-md shadow-[#5B7553]/20"
                >
                  <Link href="/login">
                    {t('apply.success.backToLogin')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border-b border-border/40 bg-background/80 backdrop-blur-lg"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#5B7553] to-[#3D5235] flex items-center justify-center shadow-lg shadow-[#5B7553]/20">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">
              {t('app.name')}
            </span>
          </Link>
          <LanguageToggle />
        </div>
      </motion.header>

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#5B7553]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#C67B5C]/5 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="w-full max-w-lg relative z-10"
        >
          <motion.div variants={fadeInUp}>
            <Card className="border-border/50 shadow-organic-lg bg-card/80 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold text-center">
                  {t('apply.title')}
                </CardTitle>
                <CardDescription className="text-center">
                  {t('apply.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Error Alert */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                {/* Disclaimer */}
                <DisclaimerBanner variant="compact" />

                {/* Google Sign In - First step */}
                {!user && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 rounded-xl border-border hover:bg-muted transition-colors"
                      onClick={handleGoogleSignIn}
                      disabled={isGoogleLoading}
                    >
                      {isGoogleLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          {t('apply.googleSignIn')}
                        </>
                      )}
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          {t('auth.login.orDivider')}
                        </span>
                      </div>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      className="w-full h-12 rounded-xl"
                    >
                      <Link href="/login">
                        {t('apply.signIn')}
                      </Link>
                    </Button>
                  </>
                )}

                {/* Profile Form - After Google sign-in */}
                {user && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* User info display */}
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-[#5B7553] flex items-center justify-center text-white font-semibold">
                        {user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.user_metadata?.full_name || user.email?.split('@')[0]}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-foreground">
                        {t('apply.form.phone')}
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder={t('apply.form.phonePlaceholder')}
                          value={effectivePhone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-10 h-12 rounded-xl border-border focus:border-[#5B7553] focus:ring-[#5B7553]/20"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-foreground">
                        {t('apply.form.address')}
                      </Label>
                      <div className="relative">
                        <Home className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Textarea
                          id="address"
                          placeholder={t('apply.form.addressPlaceholder')}
                          value={effectiveAddress}
                          onChange={(e) => setAddress(e.target.value)}
                          className="pl-10 min-h-[80px] rounded-xl border-border focus:border-[#5B7553] focus:ring-[#5B7553]/20"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="area" className="text-foreground">
                        {t('apply.form.area')}
                      </Label>
                      <Select value={effectiveAreaId} onValueChange={setAreaId} disabled={isLoading}>
                        <SelectTrigger className="h-12 rounded-xl border-border focus:border-[#5B7553] focus:ring-[#5B7553]/20">
                          <SelectValue placeholder={t('apply.form.areaPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {areas.map((area) => (
                            <SelectItem key={area.id} value={area.id}>
                              {area.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl bg-[#5B7553] hover:bg-[#3D5235] text-white shadow-md shadow-[#5B7553]/20"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          {t('apply.form.submit')}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {t('app.name')} • {t('app.tagline')}
          </p>
        </div>
      </footer>
    </div>
  );
}

function ApplyFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-[#5B7553]" />
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<ApplyFallback />}>
      <ApplyContent />
    </Suspense>
  );
}
