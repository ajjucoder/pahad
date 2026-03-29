import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signInWithEmail } from '../lib/auth';

const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockSingle = vi.fn();

const mockSupabaseClient = {
  auth: {
    signInWithPassword: mockSignInWithPassword,
    signOut: mockSignOut,
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: mockSingle,
      })),
    })),
  })),
};

vi.mock('../lib/supabase/server', () => ({
  getSupabaseServerClient: vi.fn(async () => mockSupabaseClient),
}));

describe('email sign in auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSignInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'chw1@demo.com',
        },
      },
      error: null,
    });

    mockSingle.mockResolvedValue({
      data: {
        id: 'user-123',
        email: 'chw1@demo.com',
        full_name: 'CHW User',
        avatar_url: null,
        role: 'chw',
        area_id: null,
        created_at: '2024-01-01T00:00:00Z',
      },
      error: null,
    });

    mockSignOut.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the signed-in profile when it exists', async () => {
    const result = await signInWithEmail('chw1@demo.com', 'demo1234');

    expect(mockSignOut).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.profile?.role).toBe('chw');
  });

  it('signs out and returns an error when no profile exists', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'No rows found' },
    });

    const result = await signInWithEmail('chw1@demo.com', 'demo1234');

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Profile not found. Contact your administrator.');
  });
});
