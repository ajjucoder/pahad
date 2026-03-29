'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import {
  getSupabaseBrowserClientIfConfigured,
  hasSupabaseBrowserEnv,
} from '@/lib/supabase/client';
import type { ChwApplication, Profile, Role } from '@/lib/types';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  application: ChwApplication | null;
  role: Role | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [application, setApplication] = useState<ChwApplication | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(() => hasSupabaseBrowserEnv());
  const authUnavailableError = 'Authentication is not configured';
  const latestLoadIdRef = useRef(0);

  // Initialize auth state and subscribe to changes
  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClientIfConfigured();

    if (!supabase) {
      return () => {
        mounted = false;
      };
    }

    const loadAuthState = async (nextSession: Session | null) => {
      const loadId = ++latestLoadIdRef.current;
      const response = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await response.json();

      if (!mounted || loadId !== latestLoadIdRef.current) {
        return;
      }

      setUser(data.user ?? null);
      setProfile(data.profile ?? null);
      setApplication(data.application ?? null);
      setSession(nextSession);
      setLoading(false);
    };

    // Get initial session
    const initializeAuth = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        await loadAuthState(currentSession);
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT' || !newSession?.user) {
          latestLoadIdRef.current += 1;
          setSession(null);
          setUser(null);
          setProfile(null);
          setApplication(null);
          setLoading(false);
          return;
        }

        if (event !== 'TOKEN_REFRESHED') {
          setLoading(true);
        }

        try {
          await loadAuthState(newSession);
        } catch (error) {
          console.error('Error refreshing auth state:', error);
          if (mounted) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email/password - goes through /api/auth/login for proper session handling
  const signInWithEmail = async (email: string, password: string): Promise<{ error?: string }> => {
    if (!hasSupabaseBrowserEnv()) {
      return { error: authUnavailableError };
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { error: data.error || 'Login failed' };
      }

      if (typeof window !== 'undefined') {
        window.location.assign(data.redirectPath || '/app');
      }

      return {};
    } catch {
      return { error: 'An unexpected error occurred' };
    }
  };

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    const supabase = getSupabaseBrowserClientIfConfigured();
    if (!supabase) {
      return;
    }

    const redirectUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : '/auth/callback';

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
  };

  // Sign out
  const signOut = async () => {
    const supabase = getSupabaseBrowserClientIfConfigured();
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setApplication(null);
    setSession(null);

    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  // Refresh profile manually
  const refreshProfile = async () => {
    if (!user?.id || !hasSupabaseBrowserEnv()) {
      return;
    }

    const response = await fetch('/api/auth/me', { cache: 'no-store' });
    const data = await response.json();
    setProfile((data.profile as Profile | null) ?? null);
    setApplication((data.application as ChwApplication | null) ?? null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        application,
        role: profile?.role ?? null,
        session,
        loading,
        signInWithEmail,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
