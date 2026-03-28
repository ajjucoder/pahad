import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import VisitsPage from '../app/app/visits/page';
import type { Profile, Visit, Household } from '../lib/types';

type VisitWithHousehold = Visit & {
  households: Pick<Household, 'code'>;
};

const mockProfile: Profile = {
  id: 'chw-123',
  email: 'chw1@demo.com',
  full_name: 'Test CHW',
  avatar_url: null,
  role: 'chw',
  area_id: 'area-1',
  created_at: '2024-01-01T00:00:00Z',
};

const visits: VisitWithHousehold[] = [
  {
    id: 'visit-1',
    household_id: 'household-1',
    chw_id: 'chw-123',
    visit_date: '2024-01-02',
    responses: {
      sleep: 0,
      appetite: 0,
      activities: 0,
      hopelessness: 0,
      withdrawal: 0,
      trauma: 0,
      fear_flashbacks: 0,
      psychosis_signs: 0,
      substance: 0,
      substance_neglect: 0,
      self_harm: 0,
      wish_to_die: 0,
    },
    total_score: 3,
    risk_level: 'low',
    explanation_en: 'Stable',
    explanation_ne: 'स्थिर',
    notes: null,
    created_at: '2024-01-02T00:00:00Z',
    households: {
      code: 'HH-001',
    },
  },
];

const mockFetch = vi.fn();
const mockGetSupabaseBrowserClient = vi.fn();

vi.mock('../providers/auth-provider', () => ({
  useAuth: () => ({
    user: { id: mockProfile.id, email: mockProfile.email },
    profile: mockProfile,
    role: mockProfile.role,
    session: null,
    loading: false,
    signInWithEmail: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

vi.mock('../providers/language-provider', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'visit.visitHistory': 'Visit History',
        'emptyStates.visits': 'No visits yet',
      };
      return translations[key] || key;
    },
    locale: 'en',
  }),
}));

vi.mock('../components/chw/visit-card', () => ({
  VisitCard: ({ visit }: { visit: VisitWithHousehold }) => (
    <div data-testid="visit-card">{visit.households.code}</div>
  ),
}));

vi.mock('../components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader">Loading...</span>,
  FileText: () => <span data-testid="file-text" />,
}));

vi.mock('../lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => mockGetSupabaseBrowserClient(),
}));

describe('VisitsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch as unknown as typeof fetch;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ visits }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads visits from the API when auth context is ready', async () => {
    render(<VisitsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('visit-card')).toBeInTheDocument();
    });

    expect(screen.getByText('Visit History')).toBeInTheDocument();
    expect(screen.getByText('HH-001')).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith('/api/visits', { cache: 'no-store' });
    expect(mockGetSupabaseBrowserClient).not.toHaveBeenCalled();
  });

  it('shows an error when the API request fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to load visits' }),
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<VisitsPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load visits')).toBeInTheDocument();
    });
  });
});
