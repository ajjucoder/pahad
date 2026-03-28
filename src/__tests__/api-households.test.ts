import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../app/api/households/route';

const mockGetAuthenticatedUser = vi.fn();
const mockAdminFrom = vi.fn();
const mockAdminSelect = vi.fn();
const mockAdminEq = vi.fn();
const mockAdminSingle = vi.fn();
const mockAdminOrder = vi.fn();

const mockAdminClient = {
  from: mockAdminFrom,
};

vi.mock('../lib/supabase/server', () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}));

vi.mock('../lib/supabase/admin', () => ({
  getSupabaseAdminClient: () => mockAdminClient,
}));

describe('GET /api/households', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAdminFrom.mockImplementation((tableName: string) => {
      if (tableName === 'profiles') {
        return {
          select: mockAdminSelect.mockReturnValue({
            eq: mockAdminEq.mockReturnValue({
              single: mockAdminSingle,
            }),
          }),
        };
      }

      return {
        select: mockAdminSelect.mockReturnValue({
          eq: mockAdminEq.mockReturnValue({
            order: mockAdminOrder,
          }),
        }),
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 401 when the user is not authenticated', async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 403 when the user is not a CHW', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 'supervisor-1' });
    mockAdminSingle.mockResolvedValue({
      data: { role: 'supervisor' },
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Only CHWs can access households');
  });

  it('returns households assigned to the authenticated CHW', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 'chw-123' });
    mockAdminSingle.mockResolvedValue({
      data: { role: 'chw' },
      error: null,
    });
    mockAdminOrder.mockResolvedValue({
      data: [{ id: 'household-1', code: 'HH-001', assigned_chw_id: 'chw-123' }],
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.households).toEqual([
      expect.objectContaining({ code: 'HH-001', assigned_chw_id: 'chw-123' }),
    ]);
    expect(mockAdminFrom).toHaveBeenCalledWith('profiles');
    expect(mockAdminFrom).toHaveBeenCalledWith('households');
    expect(mockAdminEq).toHaveBeenCalledWith('assigned_chw_id', 'chw-123');
    expect(mockAdminOrder).toHaveBeenCalledWith('code', { ascending: true });
  });
});
