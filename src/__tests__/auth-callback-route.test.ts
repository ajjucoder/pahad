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
const mockAdminInsert = vi.fn(() => ({
  select: vi.fn(() => ({
    single: mockAdminSingle,
  })),
}));
const mockAdminUpdate = vi.fn(() => ({
  eq: vi.fn(() => Promise.resolve({ error: null })),
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
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              single: mockAdminSingle,
            })),
          })),
        })),
      })),
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
        id: 'app-123',
        user_id: 'user-123',
        email: 'chw@demo.com',
        full_name: 'Test CHW',
        requested_role: 'chw',
        status: 'pending',
      },
      error: null,
    });

    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('creates application and redirects to create-account when no profile exists in production', async () => {
    mockAdminSingle
      .mockResolvedValueOnce({ data: null, error: { message: 'No rows found' } })
      .mockResolvedValueOnce({
        data: {
          id: 'app-123',
          user_id: 'user-123',
          email: 'chw@demo.com',
          full_name: 'Test CHW',
          requested_role: 'chw',
          status: 'pending',
        },
        error: null,
      });

    const response = await GET(new Request('http://localhost/auth/callback?code=test-code'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/create-account');
  });

  it('provisions a development profile for localhost Google sign-ins when enabled', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('ENABLE_DEV_GOOGLE_AUTO_PROVISION', 'true');

    mockAdminSingle
      .mockResolvedValueOnce({ data: null, error: { message: 'No rows found' } })
      .mockResolvedValueOnce({
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

    const response = await GET(new Request('http://localhost/auth/callback?code=test-code'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/app');
  });

  it('keeps existing approved chw users on the chw app', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'chw-123',
          email: 'regular.chw@example.com',
          user_metadata: { full_name: 'Regular CHW' },
        },
      },
      error: null,
    });
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

    expect(response.headers.get('location')).toBe('http://production.com/app');
  });

  it('redirects existing supervisor profiles to the supervisor dashboard', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'supervisor-123',
          email: 'supervisor@example.com',
          user_metadata: { full_name: 'Supervisor User' },
        },
      },
      error: null,
    });
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'supervisor-123',
        email: 'supervisor@example.com',
        full_name: 'Supervisor User',
        avatar_url: null,
        role: 'supervisor',
        area_id: null,
        created_at: '2024-01-01T00:00:00Z',
      },
      error: null,
    });

    const response = await GET(new Request('http://production.com/auth/callback?code=test-code'));

    expect(response.headers.get('location')).toBe('http://production.com/supervisor');
  });

  it('redirects pending applications to create-account', async () => {
    mockAdminSingle.mockResolvedValueOnce({
      data: {
        id: 'app-123',
        user_id: 'user-123',
        email: 'chw@demo.com',
        full_name: 'Test CHW',
        requested_role: 'chw',
        status: 'pending',
      },
      error: null,
    });

    const response = await GET(new Request('http://production.com/auth/callback?code=test-code'));

    expect(response.headers.get('location')).toBe('http://production.com/create-account');
  });

  it('signs out rejected applications and redirects to login', async () => {
    mockAdminSingle.mockResolvedValueOnce({
      data: {
        id: 'app-123',
        user_id: 'user-123',
        email: 'chw@demo.com',
        full_name: 'Test CHW',
        requested_role: 'chw',
        status: 'rejected',
      },
      error: null,
    });

    const response = await GET(new Request('http://production.com/auth/callback?code=test-code'));

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(response.headers.get('location')).toBe('http://production.com/login?error=application_rejected');
  });

  it('treats approved applications without a profile as chw access', async () => {
    mockAdminSingle.mockResolvedValueOnce({
      data: {
        id: 'app-123',
        user_id: 'user-123',
        email: 'chw@demo.com',
        full_name: 'Test CHW',
        requested_role: 'chw',
        status: 'approved',
      },
      error: null,
    });

    const response = await GET(new Request('http://production.com/auth/callback?code=test-code'));

    expect(response.headers.get('location')).toBe('http://production.com/app');
  });
});
