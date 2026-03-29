import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import SettingsPage from '../app/app/settings/page';
import SupervisorSettingsPage from '../app/supervisor/settings/page';
import type { Profile } from '../lib/types';

const mockProviderSignOut = vi.fn(() => Promise.resolve());
const mockSupabaseAuthSignOut = vi.fn(() => Promise.resolve());
const mockSingle = vi.fn(() => Promise.resolve({
  data: {
    id: 'area-1',
    name: 'Kathmandu',
    name_ne: 'काठमाडौं',
  },
}));
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

let currentProfile: Profile = {
  id: 'chw-123',
  email: 'chw1@demo.com',
  full_name: 'Test CHW',
  avatar_url: null,
  role: 'chw',
  area_id: 'area-1',
  created_at: '2024-01-01T00:00:00Z',
};

vi.mock('../providers/auth-provider', () => ({
  useAuth: () => ({
    user: { id: currentProfile.id, email: currentProfile.email },
    profile: currentProfile,
    role: currentProfile.role,
    session: null,
    loading: false,
    signInWithEmail: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: mockProviderSignOut,
    refreshProfile: vi.fn(),
  }),
}));

vi.mock('../providers/language-provider', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'settings.title': 'Settings',
        'settings.subtitle': 'Manage your account',
        'settings.language': 'Language',
        'settings.accountInfo': 'Account Information',
        'settings.name': 'Name',
        'settings.email': 'Email',
        'settings.role': 'Role',
        'settings.area': 'Area',
        'settings.logout': 'Logout',
        'settings.allAreas': 'All areas',
        'user.chw': 'CHW',
        'user.supervisor': 'Supervisor',
      };
      return translations[key] || key;
    },
    locale: 'en',
  }),
}));

vi.mock('../lib/supabase/client', () => ({
  getSupabaseBrowserClientIfConfigured: () => ({
    from: mockFrom,
    auth: {
      signOut: mockSupabaseAuthSignOut,
    },
  }),
}));

vi.mock('../components/shared/language-toggle', () => ({
  LanguageToggle: () => <div data-testid="language-toggle" />,
}));

vi.mock('../components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('lucide-react', () => ({
  LogOut: () => <span data-testid="logout-icon" />,
  User: () => <span data-testid="user-icon" />,
  MapPin: () => <span data-testid="map-pin-icon" />,
  Globe: () => <span data-testid="globe-icon" />,
  Shield: () => <span data-testid="shield-icon" />,
  Mail: () => <span data-testid="mail-icon" />,
  Briefcase: () => <span data-testid="briefcase-icon" />,
  ChevronRight: () => <span data-testid="chevron-right-icon" />,
}));

describe('settings logout flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the auth provider logout from the CHW settings page', async () => {
    currentProfile = {
      id: 'chw-123',
      email: 'chw1@demo.com',
      full_name: 'Test CHW',
      avatar_url: null,
      role: 'chw',
      area_id: 'area-1',
      created_at: '2024-01-01T00:00:00Z',
    };

    const user = userEvent.setup();
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(mockProviderSignOut).toHaveBeenCalledTimes(1);
    expect(mockSupabaseAuthSignOut).not.toHaveBeenCalled();
  });

  it('uses the auth provider logout from the supervisor settings page', async () => {
    currentProfile = {
      id: 'sup-123',
      email: 'supervisor@demo.com',
      full_name: 'Test Supervisor',
      avatar_url: null,
      role: 'supervisor',
      area_id: null,
      created_at: '2024-01-01T00:00:00Z',
    };

    const user = userEvent.setup();
    render(<SupervisorSettingsPage />);

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(mockProviderSignOut).toHaveBeenCalledTimes(1);
    expect(mockSupabaseAuthSignOut).not.toHaveBeenCalled();
  });
});
