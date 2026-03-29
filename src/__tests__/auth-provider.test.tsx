import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { AuthProvider, useAuth } from '@/providers/auth-provider';

const subscriptions: { unsubscribe: ReturnType<typeof vi.fn> }[] = [];
const authChangeCallbacks: Array<
  (event: AuthChangeEvent, session: Session | null) => void | Promise<void>
> = [];

let hasBrowserEnv = true;

const mockBrowserClient = {
  auth: {
    onAuthStateChange: vi.fn((callback) => {
      authChangeCallbacks.push(callback);
      const subscription = { unsubscribe: vi.fn() };
      subscriptions.push(subscription);

      return {
        data: {
          subscription,
        },
      };
    }),
    getSession: vi.fn(async () => ({
      data: {
        session: null,
      },
    })),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
  },
};

vi.mock('@/lib/supabase/client', () => ({
  hasSupabaseBrowserEnv: () => hasBrowserEnv,
  getSupabaseBrowserClientIfConfigured: () => (hasBrowserEnv ? mockBrowserClient : null),
}));

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function AuthStateProbe() {
  const { loading, user, profile, role, session } = useAuth();

  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user?.email ?? 'null'}</span>
      <span data-testid="profile">{profile?.id ?? 'null'}</span>
      <span data-testid="role">{String(role)}</span>
      <span data-testid="session">{session?.user?.id ?? 'null'}</span>
    </div>
  );
}

describe('AuthProvider', () => {
  const fetchSpy = vi.fn();

  beforeEach(() => {
    hasBrowserEnv = true;
    authChangeCallbacks.length = 0;
    subscriptions.length = 0;
    fetchSpy.mockReset();
    global.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing when Supabase browser env is missing', async () => {
    hasBrowserEnv = false;

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('profile')).toHaveTextContent('null');
    expect(screen.getByTestId('role')).toHaveTextContent('null');
    expect(screen.getByTestId('session')).toHaveTextContent('null');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('keeps the latest authenticated profile when an older auth fetch resolves afterwards', async () => {
    const initialRequest = createDeferred<Response>();
    const switchedAccountRequest = createDeferred<Response>();

    fetchSpy
      .mockImplementationOnce(() => initialRequest.promise)
      .mockImplementationOnce(() => switchedAccountRequest.promise);

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    const switchedSession = {
      user: { id: 'chw-2' },
    } as Session;

    await act(async () => {
      void authChangeCallbacks[0]?.('SIGNED_IN', switchedSession);
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    switchedAccountRequest.resolve({
      json: async () => ({
        user: { id: 'chw-2', email: 'chw2@demo.com' },
        profile: { id: 'chw-2', role: 'chw' },
      }),
    } as Response);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('chw2@demo.com');
      expect(screen.getByTestId('profile')).toHaveTextContent('chw-2');
    });

    initialRequest.resolve({
      json: async () => ({
        user: { id: 'chw-1', email: 'chw1@demo.com' },
        profile: { id: 'chw-1', role: 'chw' },
      }),
    } as Response);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('chw2@demo.com');
      expect(screen.getByTestId('profile')).toHaveTextContent('chw-2');
    });
  });

  it('retains the session from the latest auth change after refreshing the profile', async () => {
    fetchSpy.mockResolvedValue({
      json: async () => ({
        user: { id: 'chw-2', email: 'chw2@demo.com' },
        profile: { id: 'chw-2', role: 'chw' },
      }),
    } as Response);

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    const session = {
      user: { id: 'chw-2' },
    } as Session;

    await waitFor(() => {
      expect(authChangeCallbacks).toHaveLength(1);
    });

    await act(async () => {
      void authChangeCallbacks[0]?.('SIGNED_IN', session);
    });

    await waitFor(() => {
      expect(screen.getByTestId('session')).toHaveTextContent('chw-2');
    });
  });

  it('keeps the app hydrated during token refresh events', async () => {
    const tokenRefreshRequest = createDeferred<Response>();

    fetchSpy
      .mockResolvedValueOnce({
        json: async () => ({
          user: { id: 'chw-2', email: 'chw2@demo.com' },
          profile: { id: 'chw-2', role: 'chw' },
        }),
      } as Response)
      .mockImplementationOnce(() => tokenRefreshRequest.promise);

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('chw2@demo.com');
    });

    const refreshedSession = {
      user: { id: 'chw-2' },
    } as Session;

    await act(async () => {
      void authChangeCallbacks[0]?.('TOKEN_REFRESHED', refreshedSession);
    });

    expect(screen.getByTestId('loading')).toHaveTextContent('false');

    tokenRefreshRequest.resolve({
      json: async () => ({
        user: { id: 'chw-2', email: 'chw2@demo.com' },
        profile: { id: 'chw-2', role: 'chw' },
      }),
    } as Response);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('session')).toHaveTextContent('chw-2');
    });
  });
});
