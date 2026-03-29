// Tests for /api/applications routes
// Covers: list, create, update applications

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
const mockGetApplications = vi.fn();
const mockCreateApplication = vi.fn();
const mockUpdateApplication = vi.fn();

vi.mock('../lib/chw-applications', () => ({
  getApplications: () => mockGetApplications(),
  getPendingApplications: () => mockGetApplications(),
  createApplication: (...args: unknown[]) => mockCreateApplication(...args),
  updateApplication: (...args: unknown[]) => mockUpdateApplication(...args),
}));

// Import after mocks
import { GET, POST, PATCH } from '../app/api/applications/route';

describe('GET /api/applications', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockSupervisorProfile = {
    id: 'user-123',
    role: 'supervisor',
  };

  const mockChwProfile = {
    id: 'user-456',
    role: 'chw',
  };

  const mockApplication = {
    id: 'app-123',
    user_id: 'user-789',
    email: 'applicant@example.com',
    full_name: 'Test Applicant',
    requested_role: 'chw',
    phone: '1234567890',
    address: 'Test Address',
    area_id: null,
    avatar_url: null,
    status: 'pending',
    rejection_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
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

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns all applications for supervisor', async () => {
    mockSingle.mockResolvedValueOnce({
      data: mockSupervisorProfile,
      error: null,
    });
    mockGetApplications.mockResolvedValueOnce([mockApplication]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.applications).toHaveLength(1);
    expect(data.total).toBe(1);
    expect(mockGetApplications).toHaveBeenCalled();
  });

  it('returns only own application for non-supervisor', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-789', email: 'applicant@example.com' } },
      error: null,
    });
    mockSingle.mockResolvedValueOnce({
      data: mockChwProfile,
      error: null,
    });
    mockSingle.mockResolvedValueOnce({
      data: mockApplication,
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.applications).toHaveLength(1);
  });

  it('returns empty array when non-supervisor has no application', async () => {
    mockSingle.mockResolvedValueOnce({
      data: mockChwProfile,
      error: null,
    });
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.applications).toHaveLength(0);
    expect(data.total).toBe(0);
  });
});

describe('POST /api/applications', () => {
  const mockUser = {
    id: 'user-123',
    email: 'applicant@example.com',
    user_metadata: {
      full_name: 'Test Applicant',
    },
  };

  const mockCreatedApplication = {
    id: 'app-123',
    user_id: 'user-123',
    email: 'applicant@example.com',
    full_name: 'Test Applicant',
    requested_role: 'chw',
    phone: '1234567890',
    address: 'Test Address',
    area_id: null,
    avatar_url: null,
    status: 'pending',
    rejection_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    // Default: no profile exists
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'Not found' },
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

    const response = await POST(new Request('http://localhost/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '1234567890',
        address: 'Test Address',
        area_id: '550e8400-e29b-41d4-a716-446655440111',
      }),
    }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 when user already has approved profile', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'user-123' },
      error: null,
    });

    const response = await POST(new Request('http://localhost/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '1234567890',
        address: 'Test Address',
        area_id: '550e8400-e29b-41d4-a716-446655440111',
      }),
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('User already has an approved profile');
  });

  it('creates new application when none exists', async () => {
    mockCreateApplication.mockResolvedValueOnce(mockCreatedApplication);

    const response = await POST(new Request('http://localhost/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '1234567890',
        address: 'Test Address',
        area_id: '550e8400-e29b-41d4-a716-446655440111',
      }),
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.application).toEqual(mockCreatedApplication);
    expect(mockCreateApplication).toHaveBeenCalledWith({
      userId: 'user-123',
      email: 'applicant@example.com',
      fullName: 'Test Applicant',
      requestedRole: 'chw',
      phone: '1234567890',
      address: 'Test Address',
      areaId: '550e8400-e29b-41d4-a716-446655440111',
    });
  });

  it('creates new application without a requested role field', async () => {
    mockCreateApplication.mockResolvedValueOnce(mockCreatedApplication);

    const response = await POST(new Request('http://localhost/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '1234567890',
        address: 'Test Address',
        area_id: '550e8400-e29b-41d4-a716-446655440111',
      }),
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns 422 when phone is missing', async () => {
    const response = await POST(new Request('http://localhost/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: 'Test Address',
        area_id: '550e8400-e29b-41d4-a716-446655440111',
      }),
    }));
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toBe('Validation failed');
  });

  it('returns 400 when application already processed', async () => {
    // Second mockSingle call returns existing rejected application
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    mockSingle.mockResolvedValueOnce({
      data: { ...mockCreatedApplication, status: 'rejected' },
      error: null,
    });

    const response = await POST(new Request('http://localhost/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '1234567890',
        address: 'Test Address',
        area_id: '550e8400-e29b-41d4-a716-446655440111',
      }),
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Application already processed');
  });

  it('updates existing pending application', async () => {
    const existingApp = { ...mockCreatedApplication, status: 'pending' };
    const updatedApp = { ...existingApp, phone: '9876543210' };

    mockSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });
    mockSingle.mockResolvedValueOnce({
      data: existingApp,
      error: null,
    });
    mockUpdateApplication.mockResolvedValueOnce(updatedApp);

    const response = await POST(new Request('http://localhost/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '9876543210',
        address: 'Test Address',
        area_id: '550e8400-e29b-41d4-a716-446655440111',
      }),
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockUpdateApplication).toHaveBeenCalled();
  });

  it('returns 422 for invalid input', async () => {
    const response = await POST(new Request('http://localhost/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '123' }), // too short
    }));
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toBe('Validation failed');
  });

  it('returns 500 when create fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCreateApplication.mockResolvedValueOnce(null);

    const response = await POST(new Request('http://localhost/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '1234567890',
        address: 'Test Address',
        area_id: '550e8400-e29b-41d4-a716-446655440111',
      }),
    }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create application');
  });
});

describe('PATCH /api/applications', () => {
  const mockUser = {
    id: 'user-123',
    email: 'applicant@example.com',
  };

  const mockUpdatedApplication = {
    id: 'app-123',
    user_id: 'user-123',
    email: 'applicant@example.com',
    full_name: 'Updated Name',
    phone: '9876543210',
    address: 'Updated Address',
    area_id: null,
    avatar_url: null,
    status: 'pending',
    rejection_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
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

    const response = await PATCH(new Request('http://localhost/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Updated Name' }),
    }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('updates pending application', async () => {
    mockUpdateApplication.mockResolvedValueOnce(mockUpdatedApplication);

    const response = await PATCH(new Request('http://localhost/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Updated Name', phone: '9876543210' }),
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.application).toEqual(mockUpdatedApplication);
    expect(mockUpdateApplication).toHaveBeenCalledWith('user-123', {
      full_name: 'Updated Name',
      phone: '9876543210',
    });
  });

  it('returns 400 when update fails (no pending application)', async () => {
    mockUpdateApplication.mockResolvedValueOnce(null);

    const response = await PATCH(new Request('http://localhost/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Updated Name' }),
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Failed to update application');
  });

  it('returns 422 for invalid input', async () => {
    const response = await PATCH(new Request('http://localhost/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'A' }), // too short
    }));
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toBe('Validation failed');
  });
});
