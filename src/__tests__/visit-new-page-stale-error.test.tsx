import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import NewVisitPage from '../app/app/visit/new/page';
import type { Profile, Household } from '../lib/types';

// ---- Types ----
type AuthState = {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
  role: string | null;
  session: unknown;
  signInWithEmail: ReturnType<typeof vi.fn>;
  signInWithGoogle: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
  refreshProfile: ReturnType<typeof vi.fn>;
};

// ---- Mutable auth state (module-level for mock hoisting) ----
let mutableAuthState: AuthState = {
  user: null,
  profile: null,
  loading: false,
  role: null,
  session: null,
  signInWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
};

// ---- Test Data ----
const mockProfile: Profile = {
  id: 'chw-123',
  email: 'chw1@demo.com',
  full_name: 'Test CHW',
  avatar_url: null,
  role: 'chw',
  area_id: 'area-1',
  created_at: '2024-01-01T00:00:00Z',
};

const mockUser = {
  id: 'chw-123',
  email: 'chw1@demo.com',
};

const testHouseholds: Household[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    code: 'HH-001',
    head_name: 'Test Household',
    area_id: 'area-1',
    assigned_chw_id: 'chw-123',
    latest_risk_score: 0,
    latest_risk_level: 'low',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
  },
];

// ---- Mocks (must be at top level for hoisting) ----
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('../providers/auth-provider', () => ({
  useAuth: () => mutableAuthState,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader">Loading...</span>,
}));

vi.mock('../providers/language-provider', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'nav.newVisit': 'New Visit',
        'emptyStates.chwHome': 'No households assigned',
      };
      return translations[key] || key;
    },
    locale: 'en',
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('../components/chw/visit-form', () => ({
  VisitForm: ({ households }: { households: Household[] }) => (
    <div data-testid="visit-form">
      <span data-testid="household-count">{households.length} households</span>
    </div>
  ),
}));

const mockFetch = vi.fn();

describe('NewVisitPage - Stale Error State Recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    global.fetch = mockFetch as unknown as typeof fetch;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ households: testHouseholds }),
    });
  });

  afterEach(() => {
    // Reset auth state after each test
    mutableAuthState = {
      user: null,
      profile: null,
      loading: false,
      role: null,
      session: null,
      signInWithEmail: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    };
  });

  it('should clear error and load households when profile becomes available after initial error', async () => {
    // SCENARIO:
    // 1. Initial render: authLoading=false, profile=null -> error="Not authenticated"
    // 2. Rerender: profile becomes available -> should clear error and load households

    // Start with no profile (simulates initial auth state not ready)
    mutableAuthState = {
      user: null,
      profile: null,
      loading: false,
      role: null,
      session: null,
      signInWithEmail: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    };

    const { rerender } = render(<NewVisitPage />);

    // Wait for initial render - should show error because profile is null
    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });

    // Should show "Not authenticated" error
    expect(screen.getByText('Not authenticated')).toBeInTheDocument();

    // Now simulate profile becoming available (auth hydration completes)
    mutableAuthState = {
      user: mockUser,
      profile: mockProfile,
      loading: false,
      role: 'chw',
      session: null,
      signInWithEmail: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    };

    // Rerender to trigger effect with new auth state
    rerender(<NewVisitPage />);

    // Should now load households successfully
    await waitFor(
      () => {
        expect(screen.getByTestId('visit-form')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Error should be cleared
    expect(screen.queryByText('Not authenticated')).not.toBeInTheDocument();
    expect(screen.queryByText('Failed to load households')).not.toBeInTheDocument();

    expect(mockFetch).toHaveBeenCalledWith('/api/households', { cache: 'no-store' });
  });

  it('should clear error before attempting to fetch households when profile loads', async () => {
    // This test verifies the fix more explicitly:
    // When profile transitions from null to a value, the effect must clear error first

    // Start with no profile
    mutableAuthState = {
      user: null,
      profile: null,
      loading: false,
      role: null,
      session: null,
      signInWithEmail: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    };

    const { rerender } = render(<NewVisitPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Not authenticated')).toBeInTheDocument();

    // Transition to having a profile
    mutableAuthState = {
      user: mockUser,
      profile: mockProfile,
      loading: false,
      role: 'chw',
      session: null,
      signInWithEmail: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    };

    rerender(<NewVisitPage />);

    // After transition, should show the form (not the stale error)
    await waitFor(
      () => {
        expect(screen.getByTestId('visit-form')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
