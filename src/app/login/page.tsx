'use client';

import { Suspense, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

function LoginContent() {
  const { t } = useLanguage();
  const {
    signInWithEmail,
    signInWithGoogle,
    user,
    profile,
    application,
    loading: authLoading,
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get error from URL params
  const urlError = searchParams.get('error');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && profile) {
      const redirectPath = profile.role === 'supervisor' ? '/supervisor' : '/app';
      router.replace(redirectPath);
    }
    if (!authLoading && user && !profile && application) {
      router.replace('/create-account');
    }
  }, [user, profile, application, authLoading, router]);

  // Set error from URL
  useEffect(() => {
    if (urlError === 'no_account') {
      // In development, provide more context about setup requirements
      if (process.env.NODE_ENV === 'development') {
        setError(
          'Account not found. If this is a new setup, ensure you have:\n' +
          '1. Run scripts/schema.sql in Supabase SQL Editor\n' +
          '2. Run npm run db:seed to create demo users\n' +
          '3. Use demo accounts: chw1@demo.com / demo1234'
        );
      } else {
        setError(t('auth.errors.noAccount'));
      }
    }
  }, [urlError, t]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signInWithEmail(email, password);

      if (result.error) {
        // Map error messages
        if (result.error.includes('Invalid login credentials')) {
          setError(t('auth.errors.invalidCredentials'));
        } else {
          setError(result.error);
        }
      }
      // Auth provider will handle redirect via useEffect
    } catch {
      setError(t('auth.errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
    } catch {
      setError(t('auth.errors.generic'));
      setIsGoogleLoading(false);
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

  // Don't show login page if already authenticated
  if (user && profile) {
    return null;
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
          className="w-full max-w-md relative z-10"
        >
          <motion.div variants={fadeInUp}>
            <Card className="border-border/50 shadow-organic-lg bg-card/80 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold text-center">
                  {t('auth.login.title')}
                </CardTitle>
                <CardDescription className="text-center">
                  {t('auth.login.subtitle')}
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
                      <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                {/* Disclaimer */}
                <DisclaimerBanner variant="compact" />

                {/* Google Sign In */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-xl border-border hover:bg-muted transition-colors"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || isLoading}
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
                      {t('auth.login.googleSignIn')}
                    </>
                  )}
                </Button>

                {/* Divider */}
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

                {/* Email/Password Form */}
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">
                      {t('auth.login.email')}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t('auth.login.emailPlaceholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 rounded-xl border-border focus:border-[#5B7553] focus:ring-[#5B7553]/20"
                        required
                        disabled={isLoading || isGoogleLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground">
                      {t('auth.login.password')}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder={t('auth.login.passwordPlaceholder')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-12 rounded-xl border-border focus:border-[#5B7553] focus:ring-[#5B7553]/20"
                        required
                        disabled={isLoading || isGoogleLoading}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-[#5B7553] hover:bg-[#3D5235] text-white shadow-md shadow-[#5B7553]/20"
                    disabled={isLoading || isGoogleLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {t('auth.login.submit')}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Help text */}
                <div className="text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {t('auth.login.noAccount')}
                  </p>
                  <Link
                    href="/create-account"
                    className="inline-flex items-center gap-1 text-sm text-[#5B7553] hover:text-[#3D5235] font-medium"
                  >
                    {t('auth.login.applyLink')}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
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

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-[#5B7553]" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
