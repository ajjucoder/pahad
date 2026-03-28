// Tests for /api/household/status route (PATCH)
// Covers: 401 unauthorized, 403 non-supervisor, 400 invalid status, 200 success

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PATCH } from '../app/api/household/status/route';

// Mock Supabase server client
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

// Profile query chain
const mockProfileSelect = vi.fn();
const mockProfileEq = vi.fn();
const mockProfileSingle = vi.fn();

// Household update chain
const mockHouseholdUpdate = vi.fn();
const mockHouseholdEq = vi.fn();

const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser,
  },
  from: mockFrom,
};

// Setup mocks
beforeEach(() => {
  vi.clearAllMocks();

  // Reset all mock implementations
  mockProfileSelect.mockReturnValue({ eq: mockProfileEq });
  mockProfileEq.mockReturnValue({ single: mockProfileSingle });
  mockHouseholdUpdate.mockReturnValue({ eq: mockHouseholdEq });
  // Default: eq resolves to success
  mockHouseholdEq.mockResolvedValue({ error: null });
  mockProfileSingle.mockResolvedValue({ data: null, error: null });

  // Mock from() to return different chains based on table name
  mockFrom.mockImplementation((tableName: string) => {
    if (tableName === 'profiles') {
      return {
        select: mockProfileSelect,
        eq: mockProfileEq,
        single: mockProfileSingle,
      };
    }
    if (tableName === 'households') {
      return {
        update: mockHouseholdUpdate,
        eq: mockHouseholdEq,
      };
    }
    return {
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn() }) }),
      update: vi.fn().mockReturnValue({ eq: vi.fn() }),
    };
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

vi.mock('../lib/supabase/server', () => ({
  getSupabaseServerClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

describe('PATCH /api/household/status', () => {
  const validRequest = {
    household_id: '123e4567-e89b-12d3-a456-426614174000',
    status: 'reviewed',
  };

  const mockUser = {
    id: 'user-123',
    email: 'supervisor@demo.com',
  };

  const mockSupervisorProfile = {
    id: 'user-123',
    email: 'supervisor@demo.com',
    role: 'supervisor',
  };

  const mockCHWProfile = {
    id: 'user-456',
    email: 'chw@demo.com',
    role: 'chw',
  };

  describe('401 Unauthorized', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new Request('http://localhost/api/household/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when auth returns no user', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new Request('http://localhost/api/household/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when auth error occurs', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'JWT expired' },
      });

      const request = new Request('http://localhost/api/household/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('403 Forbidden - Non-Supervisor', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should return 403 when user is a CHW (not supervisor)', async () => {
      mockProfileSingle.mockResolvedValue({
        data: mockCHWProfile,
        error: null,
      });

      const request = new Request('http://localhost/api/household/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only supervisors can update household status');
    });

    it('should return 403 when user has no profile', async () => {
      mockProfileSingle.mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' },
      });

      const request = new Request('http://localhost/api/household/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only supervisors can update household status');
    });

    it('should return 403 when profile query fails', async () => {
      mockProfileSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const request = new Request('http://localhost/api/household/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only supervisors can update household status');
    });
  });

  describe('422 Validation Error - Invalid Status or Household ID', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockProfileSingle.mockResolvedValue({
        data: mockSupervisorProfile,
        error: null,
      });
    });

    it('should return 422 when status is missing', async () => {
      const request = new Request('http://localhost/api/household/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          household_id: validRequest.household_id,
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 422 when household_id is missing', async () => {
      const request = new Request('http://localhost/api/household/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'reviewed',
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 422 when both fields are missing', async () => {
      const request = new Request('http://localhost/api/household/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 422 when status is invalid string', async () => {
      const request = new Request('http://localhost/api/household/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          household_id: validRequest.household_id,
          status: 'invalid-status',
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 422 for status that is not in allowed list', async () => {
      const invalidStatuses = ['pending', 'completed', 'done', 'closed'];

      for (const status of invalidStatuses) {
        const request = new Request('http://localhost/api/household/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            household_id: validRequest.household_id,
            status,
          }),
        });

        const response = await PATCH(request);
        const data = await response.json();

        expect(response.status).toBe(422);
        expect(data.error).toBe('Validation failed');
      }
    });

    it('should return 422 when status is null', async () => {
      const request = new Request('http://localhost/api/household/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          household_id: validRequest.household_id,
          status: null,
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 422 when household_id is not a valid UUID', async () => {
      const request = new Request('http://localhost/api/household/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          household_id: 'not-a-uuid',
          status: 'reviewed',
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('200 Success', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockProfileSingle.mockResolvedValue({
        data: mockSupervisorProfile,
        error: null,
      });

      // eq resolves to success (already set in global beforeEach, but explicit here)
      mockHouseholdEq.mockResolvedValue({ error: null });
    });

    it('should return 200 with updated status for valid "active" status', async () => {
      const request = new Request('http://localhost/api/household/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          household_id: validRequest.household_id,
          status: 'active',
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.status).toBe('active');
    });

    it('should return 200 with updated status for valid "reviewed" status', async () => {
      const request = new Request('http://localhost/api/household/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          household_id: validRequest.household_id,
          status: 'reviewed',
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.status).toBe('reviewed');
    });

    it('should return 200 with updated status for valid "referred" status', async () => {
      const request = new Request('http://localhost/api/household/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          household_id: validRequest.household_id,
          status: 'referred',
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.status).toBe('referred');
    });

    it('should call update with correct parameters', async () => {
      const request = new Request('http://localhost/api/household/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      await PATCH(request);

      expect(mockHouseholdUpdate).toHaveBeenCalledWith({ status: 'reviewed' });
      expect(mockHouseholdEq).toHaveBeenCalledWith('id', validRequest.household_id);
    });

    it('should return expected response shape on success', async () => {
      const request = new Request('http://localhost/api/household/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('status');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockProfileSingle.mockResolvedValue({
        data: mockSupervisorProfile,
        error: null,
      });
    });

    it('should return 500 when database update fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      // Clear previous calls and set up error response
      mockHouseholdEq.mockReset();
      mockHouseholdEq.mockResolvedValue({
        error: { message: 'Database connection failed' },
      });

      const request = new Request('http://localhost/api/household/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update status');
    });

    it('should return 500 on unexpected error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      mockGetUser.mockRejectedValue(new Error('Unexpected error'));

      const request = new Request('http://localhost/api/household/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should return 500 when request body is not valid JSON', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const request = new Request('http://localhost/api/household/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json',
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
