import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../app/api/visits/route';

const mockGetAuthenticatedUser = vi.fn();
const mockAdminFrom = vi.fn();
const mockAdminSelect = vi.fn();
const mockAdminEq = vi.fn();
const mockAdminSingle = vi.fn();
const mockAdminOrder = vi.fn();
const mockVisitsSelect = vi.fn();
const mockVisitsEq = vi.fn();
const mockVisitsOrder = vi.fn();

const mockAdminClient = {
  from: mockAdminFrom,
};

vi.mock('../lib/supabase/server', () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}));

vi.mock('../lib/supabase/admin', () => ({
  getSupabaseAdminClient: () => mockAdminClient,
}));

describe('GET /api/visits', () => {
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
        select: mockVisitsSelect.mockReturnValue({
          eq: mockVisitsEq.mockReturnValue({
            order: mockVisitsOrder,
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
    expect(data.error).toBe('Only CHWs can access visits');
  });

  it('returns visits for the authenticated CHW', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 'chw-123' });
    mockAdminSingle.mockResolvedValue({
      data: { role: 'chw' },
      error: null,
    });
    mockVisitsOrder.mockResolvedValue({
      data: [
        {
          id: 'visit-1',
          chw_id: 'chw-123',
          households: { code: 'HH-001' },
        },
      ],
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.visits).toEqual([
      expect.objectContaining({
        id: 'visit-1',
        chw_id: 'chw-123',
        households: { code: 'HH-001' },
      }),
    ]);
    expect(mockAdminFrom).toHaveBeenCalledWith('profiles');
    expect(mockAdminFrom).toHaveBeenCalledWith('visits');
    expect(mockVisitsEq).toHaveBeenCalledWith('chw_id', 'chw-123');
    expect(mockVisitsOrder).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('falls back to the legacy visits query when optional columns are missing', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 'chw-123' });
    mockAdminSingle.mockResolvedValue({
      data: { role: 'chw' },
      error: null,
    });

    mockVisitsOrder
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'column visits.action_en does not exist' },
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'visit-legacy-1',
            chw_id: 'chw-123',
            household_id: 'household-1',
            visit_date: '2024-01-01',
            responses: {},
            total_score: 4,
            risk_level: 'low',
            explanation_en: 'Stable',
            explanation_ne: 'स्थिर',
            notes: null,
            created_at: '2024-01-01T00:00:00Z',
            households: { code: 'HH-001' },
          },
        ],
        error: null,
      });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockVisitsSelect).toHaveBeenCalledTimes(2);
    expect(data.visits).toHaveLength(1);
    expect(data.visits[0]).toMatchObject({
      id: 'visit-legacy-1',
      households: { code: 'HH-001' },
    });
    expect(data.visits[0]).not.toHaveProperty('action_en');
    expect(data.visits[0]).not.toHaveProperty('specialist_type');
    expect(data.visits[0]).not.toHaveProperty('patient_name');
  });
});
