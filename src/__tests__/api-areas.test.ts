import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetUser = vi.fn();
const mockSelect = vi.fn(() => ({
  order: vi.fn(() => Promise.resolve({
    data: [{ id: 'area-1', name: 'Ward 1', name_ne: 'वडा १' }],
    error: null,
  })),
}));
const mockAdminFrom = vi.fn(() => ({
  select: mockSelect,
}));

vi.mock('../lib/supabase/server', () => ({
  getSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

vi.mock('../lib/supabase/admin', () => ({
  getSupabaseAdminClient: vi.fn(() => ({
    from: mockAdminFrom,
  })),
}));

import { GET } from '../app/api/areas/route';

describe('GET /api/areas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when the user is not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Unauthorized' },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns areas for authenticated users', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.areas).toEqual([{ id: 'area-1', name: 'Ward 1', name_ne: 'वडा १' }]);
  });
});
