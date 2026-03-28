import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../app/auth/callback/route';

const mockCookieStore = {
  getAll: vi.fn(() => []),
  set: vi.fn(),
};

const mockExchangeCodeForSession = vi.fn();
const mockGetUser = vi.fn();
const mockSignOut = vi.fn();
const mockSingle = vi.fn();
const mockAdminSingle = vi.fn();
const mockAdminUpdate = vi.fn(() => ({
  eq: vi.fn(() => ({
    select: vi.fn(() => ({
      single: mockAdminSingle,
    })),
  })),
}));
const mockAdminInsert = vi.fn(() => ({
  select: vi.fn(() => ({
    single: mockAdminSingle,
  })),
}));
const mockGetSupabaseAdminClient = vi.fn(() => ({
  from: vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        insert: mockAdminInsert,
        update: mockAdminUpdate,
      };
    }
    return {
      insert: mockAdminInsert,
    };
  }),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => mockCookieStore),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
      getUser: mockGetUser,
      signOut: mockSignOut,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSingle,
        })),
      })),
    })),
  })),
}));

vi.mock('../lib/supabase/admin', () => ({
  getSupabaseAdminClient: () => mockGetSupabaseAdminClient(),
}));

describe('GET /auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'production');

    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'chw@demo.com',
          user_metadata: {
            full_name: 'Test CHW',
            avatar_url: 'https://example.com/avatar.png',
          },
        },
      },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'No rows found' },
    });
    mockSignOut.mockResolvedValue({ error: null });
    mockAdminSingle.mockResolvedValue({
      data: {
        id: 'user-123',
        email: 'chw@demo.com',
        full_name: 'Test CHW',
        avatar_url: 'https://example.com/avatar.png',
        role: 'chw',
        area_id: null,
        created_at: '2024-01-01T00:00:00Z',
      },
      error: null,
    });

    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('signs out the OAuth session before redirecting when no profile exists', async () => {
    const response = await GET(new Request('http://localhost/auth/callback?code=test-code'));

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('test-code');
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockSingle).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/login?error=no_account');
  });

  it('provisions a development profile for localhost Google sign-ins', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    const response = await GET(new Request('http://localhost/auth/callback?code=test-code'));

    expect(mockAdminInsert).toHaveBeenCalledWith({
      id: 'user-123',
      email: 'chw@demo.com',
      full_name: 'Test CHW',
      avatar_url: 'https://example.com/avatar.png',
      role: 'chw',
      area_id: null,
    });
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/app');
  });

  describe('admin email handling', () => {
    it('creates supervisor profile for admin email when no profile exists in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'admin-123',
            email: 'aeeju15@gmail.com',
            user_metadata: {
              full_name: 'Admin User',
              avatar_url: 'https://example.com/admin-avatar.png',
            },
          },
        },
        error: null,
      });

      mockAdminSingle.mockResolvedValueOnce({
        data: {
          id: 'admin-123',
          email: 'aeeju15@gmail.com',
          full_name: 'Admin User',
          avatar_url: 'https://example.com/admin-avatar.png',
          role: 'supervisor',
          area_id: null,
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const response = await GET(new Request('http://production.com/auth/callback?code=test-code'));

      expect(mockAdminInsert).toHaveBeenCalledWith({
        id: 'admin-123',
        email: 'aeeju15@gmail.com',
        full_name: 'Admin User',
        avatar_url: 'https://example.com/admin-avatar.png',
        role: 'supervisor',
        area_id: null,
      });
      expect(mockSignOut).not.toHaveBeenCalled();
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://production.com/supervisor');
    });

    it('creates supervisor profile for admin email when no profile exists in development', async () => {
      vi.stubEnv('NODE_ENV', 'development');

      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'admin-123',
            email: 'aeeju15@gmail.com',
            user_metadata: {
              full_name: 'Admin User',
              avatar_url: 'https://example.com/admin-avatar.png',
            },
          },
        },
        error: null,
      });

      // Mock the admin insert to return supervisor role
      mockAdminSingle.mockResolvedValueOnce({
        data: {
          id: 'admin-123',
          email: 'aeeju15@gmail.com',
          full_name: 'Admin User',
          avatar_url: 'https://example.com/admin-avatar.png',
          role: 'supervisor',
          area_id: null,
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const response = await GET(new Request('http://localhost/auth/callback?code=test-code'));

      expect(mockAdminInsert).toHaveBeenCalledWith({
        id: 'admin-123',
        email: 'aeeju15@gmail.com',
        full_name: 'Admin User',
        avatar_url: 'https://example.com/admin-avatar.png',
        role: 'supervisor',
        area_id: null,
      });
      expect(mockSignOut).not.toHaveBeenCalled();
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost/supervisor');
    });

    it('elevates existing chw profile to supervisor for admin email in development', async () => {
      vi.stubEnv('NODE_ENV', 'development');

      // Reset mock admin single to resolve with updated profile
      mockAdminSingle.mockResolvedValueOnce({
        data: {
          id: 'admin-123',
          email: 'aeeju15@gmail.com',
          full_name: 'Admin User',
          avatar_url: 'https://example.com/admin-avatar.png',
          role: 'supervisor',
          area_id: null,
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'admin-123',
            email: 'aeeju15@gmail.com',
            user_metadata: {
              full_name: 'Admin User',
              avatar_url: 'https://example.com/admin-avatar.png',
            },
          },
        },
        error: null,
      });

      // Simulate existing chw profile
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'admin-123',
          email: 'aeeju15@gmail.com',
          full_name: 'Admin User',
          avatar_url: 'https://example.com/admin-avatar.png',
          role: 'chw',
          area_id: null,
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const response = await GET(new Request('http://localhost/auth/callback?code=test-code'));

      // Should update profile to supervisor
      expect(mockAdminUpdate).toHaveBeenCalledWith({
        role: 'supervisor',
      });
      expect(mockSignOut).not.toHaveBeenCalled();
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost/supervisor');
    });

    it('elevates existing chw profile to supervisor for admin email in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      mockAdminSingle.mockResolvedValueOnce({
        data: {
          id: 'admin-123',
          email: 'aeeju15@gmail.com',
          full_name: 'Admin User',
          avatar_url: 'https://example.com/admin-avatar.png',
          role: 'supervisor',
          area_id: null,
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'admin-123',
            email: 'aeeju15@gmail.com',
            user_metadata: {
              full_name: 'Admin User',
              avatar_url: 'https://example.com/admin-avatar.png',
            },
          },
        },
        error: null,
      });

      // Simulate existing chw profile
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'admin-123',
          email: 'aeeju15@gmail.com',
          full_name: 'Admin User',
          avatar_url: 'https://example.com/admin-avatar.png',
          role: 'chw',
          area_id: null,
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const response = await GET(new Request('http://production.com/auth/callback?code=test-code'));

      // Should update profile to supervisor
      expect(mockAdminUpdate).toHaveBeenCalledWith({
        role: 'supervisor',
      });
      expect(mockSignOut).not.toHaveBeenCalled();
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://production.com/supervisor');
    });

    it('signs out the admin user when supervisor elevation fails', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'admin-123',
            email: 'aeeju15@gmail.com',
            user_metadata: {
              full_name: 'Admin User',
            },
          },
        },
        error: null,
      });

      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'admin-123',
          email: 'aeeju15@gmail.com',
          full_name: 'Admin User',
          avatar_url: null,
          role: 'chw',
          area_id: null,
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      mockAdminSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' },
      });

      const response = await GET(new Request('http://production.com/auth/callback?code=test-code'));

      expect(mockAdminUpdate).toHaveBeenCalledWith({
        role: 'supervisor',
      });
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://production.com/login?error=no_account');
    });

    it('keeps non-admin users behavior unchanged', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'chw-123',
            email: 'regular.chw@example.com',
            user_metadata: {
              full_name: 'Regular CHW',
            },
          },
        },
        error: null,
      });

      // Simulate existing chw profile
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'chw-123',
          email: 'regular.chw@example.com',
          full_name: 'Regular CHW',
          avatar_url: null,
          role: 'chw',
          area_id: 'area-1',
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const response = await GET(new Request('http://production.com/auth/callback?code=test-code'));

      // Should NOT update profile
      expect(mockAdminUpdate).not.toHaveBeenCalled();
      expect(mockSignOut).not.toHaveBeenCalled();
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://production.com/app');
    });

    it('redirects existing supervisor profile to supervisor dashboard', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'supervisor-123',
            email: 'supervisor@example.com',
            user_metadata: {
              full_name: 'Existing Supervisor',
            },
          },
        },
        error: null,
      });

      // Simulate existing supervisor profile
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'supervisor-123',
          email: 'supervisor@example.com',
          full_name: 'Existing Supervisor',
          avatar_url: null,
          role: 'supervisor',
          area_id: null,
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const response = await GET(new Request('http://production.com/auth/callback?code=test-code'));

      // Should NOT update profile (already supervisor)
      expect(mockAdminUpdate).not.toHaveBeenCalled();
      expect(mockSignOut).not.toHaveBeenCalled();
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://production.com/supervisor');
    });
  });
});
