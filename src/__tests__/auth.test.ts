import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signInWithEmail, isAdminEmail } from '../lib/auth';

const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockSingle = vi.fn();
const mockAdminSingle = vi.fn();
const mockAdminUpdateEq = vi.fn(() => ({
  select: vi.fn(() => ({
    single: mockAdminSingle,
  })),
}));
const mockAdminUpdate = vi.fn(() => ({
  eq: mockAdminUpdateEq,
}));
const mockAdminInsert = vi.fn(() => ({
  select: vi.fn(() => ({
    single: mockAdminSingle,
  })),
}));

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

const mockAdminClient = {
  from: vi.fn(() => ({
    update: mockAdminUpdate,
    insert: mockAdminInsert,
  })),
};

vi.mock('../lib/supabase/server', () => ({
  getSupabaseServerClient: vi.fn(async () => mockSupabaseClient),
}));

vi.mock('../lib/supabase/admin', () => ({
  getSupabaseAdminClient: vi.fn(() => mockAdminClient),
}));

describe('auth admin handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSignInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'aeeju15@gmail.com',
          user_metadata: {
            full_name: 'Admin User',
          },
        },
      },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'No rows found' },
    });
    mockAdminSingle.mockResolvedValue({
      data: {
        id: 'user-123',
        email: 'aeeju15@gmail.com',
        full_name: 'Admin User',
        avatar_url: null,
        role: 'supervisor',
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

  it('creates a supervisor profile for the admin email when none exists', async () => {
    const result = await signInWithEmail('aeeju15@gmail.com', 'demo1234');

    expect(mockAdminInsert).toHaveBeenCalledWith({
      id: 'user-123',
      email: 'aeeju15@gmail.com',
      full_name: 'Admin User',
      avatar_url: null,
      role: 'supervisor',
      area_id: null,
    });
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.profile?.role).toBe('supervisor');
  });

  it('elevates an existing admin profile to supervisor', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'user-123',
        email: 'aeeju15@gmail.com',
        full_name: 'Admin User',
        avatar_url: null,
        role: 'chw',
        area_id: 'area-1',
        created_at: '2024-01-01T00:00:00Z',
      },
      error: null,
    });

    const result = await signInWithEmail('aeeju15@gmail.com', 'demo1234');

    expect(mockAdminUpdate).toHaveBeenCalledWith({
      role: 'supervisor',
    });
    expect(mockAdminUpdateEq).toHaveBeenCalledWith('id', 'user-123');
    expect(result.success).toBe(true);
    expect(result.profile?.role).toBe('supervisor');
  });

  it('treats the configured admin email case-insensitively', () => {
    expect(isAdminEmail('AEEJU15@GMAIL.COM')).toBe(true);
  });
});
