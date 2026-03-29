import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import NewVisitPage from '../app/app/visit/new/page';
import type { Household, Profile } from '../lib/types';

const mockProfile: Profile = {
  id: 'chw-123',
  email: 'chw1@demo.com',
  full_name: 'Test CHW',
  avatar_url: null,
  role: 'chw',
  area_id: 'area-1',
  created_at: '2024-01-01T00:00:00Z',
};

const households: Household[] = [
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
    area_name: 'Kathmandu',
    area_name_ne: 'काठमाडौं',
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    code: 'HH-002',
    head_name: 'Second Household',
    area_id: 'area-1',
    assigned_chw_id: 'chw-123',
    latest_risk_score: 2,
    latest_risk_level: 'moderate',
    status: 'active',
    created_at: '2024-01-02T00:00:00Z',
    area_name: 'Kathmandu',
    area_name_ne: 'काठमाडौं',
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
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
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
}));

vi.mock('../components/chw/visit-form', () => ({
  VisitForm: ({ households }: { households: Household[] }) => (
    <div data-testid="visit-form">
      <span data-testid="household-count">{households.length} households</span>
      {households.map((household) => (
        <span key={household.id}>{household.code}</span>
      ))}
    </div>
  ),
}));

vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader">Loading...</span>,
}));

vi.mock('../lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => mockGetSupabaseBrowserClient(),
}));

describe('NewVisitPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch as unknown as typeof fetch;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ households }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads households from the API when auth context is ready', async () => {
    render(<NewVisitPage />);

    await waitFor(() => {
      expect(screen.getByTestId('visit-form')).toBeInTheDocument();
    });

    expect(screen.getByText('New Visit')).toBeInTheDocument();
    expect(screen.getByTestId('household-count')).toHaveTextContent('2 households');
    expect(screen.getByText('HH-001')).toBeInTheDocument();
    expect(screen.getByText('HH-002')).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith('/api/households', { cache: 'no-store' });
    expect(mockGetSupabaseBrowserClient).not.toHaveBeenCalled();
  });

  it('renders VisitForm when no households are returned so new household can be created in-form', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ households: [] }),
    });

    render(<NewVisitPage />);

    await waitFor(() => {
      expect(screen.getByTestId('visit-form')).toBeInTheDocument();
    });

    expect(screen.getByTestId('household-count')).toHaveTextContent('0 households');
    expect(screen.queryByText('No households assigned')).not.toBeInTheDocument();
  });

  it('shows an error when the API request fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to load households' }),
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<NewVisitPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load households')).toBeInTheDocument();
    });
  });
});
