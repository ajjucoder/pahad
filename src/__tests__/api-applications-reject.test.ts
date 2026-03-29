// Tests for /api/applications/reject route
// Covers: supervisor authorization, rejection flow

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock supabase server client
const mockGetUser = vi.fn();
const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({
  eq: vi.fn(() => ({
    single: mockSingle,
  })),
}));
const mockFrom = vi.fn(() => ({
  select: mockSelect,
}));

const mockSupabaseServerClient = vi.fn(() => ({
  auth: {
    getUser: mockGetUser,
  },
  from: mockFrom,
}));

vi.mock('../lib/supabase/server', () => ({
  getSupabaseServerClient: () => mockSupabaseServerClient(),
}));

// Mock CHW application helpers
const mockRejectApplication = vi.fn();

vi.mock('../lib/chw-applications', () => ({
  rejectApplication: (...args: unknown[]) => mockRejectApplication(...args),
}));

// Import after mocks
import { POST } from '../app/api/applications/reject/route';

describe('POST /api/applications/reject', () => {
  const mockSupervisorUser = {
    id: 'supervisor-123',
    email: 'supervisor@example.com',
  };

  const mockSupervisorProfile = {
    id: 'supervisor-123',
    role: 'supervisor',
  };

  const mockChwProfile = {
    id: 'chw-123',
    role: 'chw',
  };

  const mockRejectedApplication = {
    id: '550e8400-e29b-41d4-a716-446655440010',
    user_id: 'applicant-123',
    email: 'applicant@example.com',
    full_name: 'Test Applicant',
    phone: '1234567890',
    address: 'Test Address',
    area_id: null,
    avatar_url: null,
    status: 'rejected',
    rejection_reason: 'Insufficient qualifications',
    reviewed_by: 'supervisor-123',
    reviewed_at: '2024-01-02T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: mockSupervisorUser },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: mockSupervisorProfile,
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const response = await POST(new Request('http://localhost/api/applications/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: 'app-123', rejection_reason: 'Not qualified' }),
    }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 403 for non-supervisor', async () => {
    mockSingle.mockResolvedValueOnce({
      data: mockChwProfile,
      error: null,
    });

    const response = await POST(new Request('http://localhost/api/applications/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: 'app-123', rejection_reason: 'Not qualified' }),
    }));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Supervisor access required');
  });

  it('rejects application successfully', async () => {
    mockRejectApplication.mockResolvedValueOnce({
      success: true,
      application: mockRejectedApplication,
    });

    const response = await POST(new Request('http://localhost/api/applications/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        application_id: '550e8400-e29b-41d4-a716-446655440010',
        rejection_reason: 'Insufficient qualifications',
      }),
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.application).toEqual(mockRejectedApplication);
    expect(mockRejectApplication).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440010',
      'supervisor-123',
      'Insufficient qualifications'
    );
  });

  it('returns 400 when rejection fails (application not found)', async () => {
    mockRejectApplication.mockResolvedValueOnce({
      success: false,
      error: 'Application not found',
    });

    const response = await POST(new Request('http://localhost/api/applications/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: '550e8400-e29b-41d4-a716-446655440011', rejection_reason: 'Not qualified' }),
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Application not found');
  });

  it('returns 400 when application not pending', async () => {
    mockRejectApplication.mockResolvedValueOnce({
      success: false,
      error: 'Application is not pending',
    });

    const response = await POST(new Request('http://localhost/api/applications/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: '550e8400-e29b-41d4-a716-446655440012', rejection_reason: 'Not qualified' }),
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Application is not pending');
  });

  it('returns 422 for missing rejection_reason', async () => {
    const response = await POST(new Request('http://localhost/api/applications/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: 'app-123' }),
    }));
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toBe('Validation failed');
  });

  it('returns 422 for short rejection_reason', async () => {
    const response = await POST(new Request('http://localhost/api/applications/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: '550e8400-e29b-41d4-a716-446655440013', rejection_reason: 'No' }),
    }));
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toBe('Validation failed');
  });

  it('returns 422 for invalid application_id', async () => {
    const response = await POST(new Request('http://localhost/api/applications/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: 'not-a-uuid', rejection_reason: 'Valid reason' }),
    }));
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toBe('Validation failed');
  });

  it('returns 500 on unexpected error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockRejectApplication.mockRejectedValueOnce(new Error('Database error'));

    const response = await POST(new Request('http://localhost/api/applications/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: '550e8400-e29b-41d4-a716-446655440014', rejection_reason: 'Not qualified' }),
    }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('An unexpected error occurred');
  });
});
