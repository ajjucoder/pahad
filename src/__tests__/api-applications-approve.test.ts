// Tests for /api/applications/approve route
// Covers: supervisor authorization, approval flow

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
const mockApproveApplication = vi.fn();

vi.mock('../lib/chw-applications', () => ({
  approveApplication: (...args: unknown[]) => mockApproveApplication(...args),
}));

// Import after mocks
import { POST } from '../app/api/applications/approve/route';

describe('POST /api/applications/approve', () => {
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

  const mockApprovedApplication = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    user_id: 'applicant-123',
    email: 'applicant@example.com',
    full_name: 'Test Applicant',
    requested_role: 'supervisor',
    phone: '1234567890',
    address: 'Test Address',
    area_id: null,
    avatar_url: null,
    status: 'approved',
    rejection_reason: null,
    reviewed_by: 'supervisor-123',
    reviewed_at: '2024-01-02T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  };

  const mockCreatedProfile = {
    id: 'applicant-123',
    email: 'applicant@example.com',
    full_name: 'Test Applicant',
    avatar_url: null,
    role: 'supervisor',
    area_id: null,
    created_at: '2024-01-02T00:00:00Z',
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

    const response = await POST(new Request('http://localhost/api/applications/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: 'app-123', approved_role: 'chw' }),
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

    const response = await POST(new Request('http://localhost/api/applications/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: 'app-123', approved_role: 'chw' }),
    }));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Supervisor access required');
  });

  it('returns 403 when profile not found', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    });

    const response = await POST(new Request('http://localhost/api/applications/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: 'app-123', approved_role: 'chw' }),
    }));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Supervisor access required');
  });

  it('approves application successfully', async () => {
    mockApproveApplication.mockResolvedValueOnce({
      success: true,
      application: mockApprovedApplication,
      profile: mockCreatedProfile,
    });

    const response = await POST(new Request('http://localhost/api/applications/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: '550e8400-e29b-41d4-a716-446655440000', approved_role: 'supervisor' }),
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.application).toEqual(mockApprovedApplication);
    expect(data.profile).toEqual(mockCreatedProfile);
    expect(data.profile.role).toBe('supervisor');
    expect(mockApproveApplication).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000', 'supervisor-123', 'supervisor');
  });

  it('returns 400 when approval fails (application not found)', async () => {
    mockApproveApplication.mockResolvedValueOnce({
      success: false,
      error: 'Application not found',
    });

    const response = await POST(new Request('http://localhost/api/applications/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: '550e8400-e29b-41d4-a716-446655440001', approved_role: 'chw' }),
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Application not found');
  });

  it('returns 400 when application not pending', async () => {
    mockApproveApplication.mockResolvedValueOnce({
      success: false,
      error: 'Application is not pending',
    });

    const response = await POST(new Request('http://localhost/api/applications/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: '550e8400-e29b-41d4-a716-446655440002', approved_role: 'chw' }),
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Application is not pending');
  });

  it('returns 422 for invalid application_id', async () => {
    const response = await POST(new Request('http://localhost/api/applications/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: 'not-a-uuid', approved_role: 'chw' }),
    }));
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toBe('Validation failed');
  });

  it('returns 422 when application_id missing', async () => {
    const response = await POST(new Request('http://localhost/api/applications/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved_role: 'chw' }),
    }));
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toBe('Validation failed');
  });

  it('returns 422 when approved_role is missing', async () => {
    const response = await POST(new Request('http://localhost/api/applications/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: '550e8400-e29b-41d4-a716-446655440003' }),
    }));
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toBe('Validation failed');
  });

  it('returns 500 on unexpected error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockApproveApplication.mockRejectedValueOnce(new Error('Database error'));

    const response = await POST(new Request('http://localhost/api/applications/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: '550e8400-e29b-41d4-a716-446655440003', approved_role: 'chw' }),
    }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('An unexpected error occurred');
  });
});
