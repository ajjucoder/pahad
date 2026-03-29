// Tests for /api/score route
// Covers: 401 unauthorized, 422 validation failure, 404 household not found,
// 403 unassigned household, 403 non-CHW, and 200 success with expected response shape

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../app/api/score/route';

// Mock the server client
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser,
  },
  from: mockFrom,
};

// Mock the admin client
const mockAdminFrom = vi.fn();
const mockAdminSelect = vi.fn();
const mockAdminEq = vi.fn();
const mockAdminSingle = vi.fn();
const mockAdminInsert = vi.fn();

const mockAdminClient = {
  from: mockAdminFrom,
};

// Mock visit insert
const mockInsertVisitWithRiskUpdate = vi.fn();

// Mock scoring
const mockCalculateScore = vi.fn();

// Setup mocks before each test
beforeEach(() => {
  vi.clearAllMocks();

  // Reset mock implementations
  mockFrom.mockReturnValue({
    select: mockSelect.mockReturnThis(),
    eq: mockEq.mockReturnThis(),
    single: mockSingle,
  });

  mockAdminFrom.mockReturnValue({
    select: mockAdminSelect.mockReturnThis(),
    eq: mockAdminEq.mockReturnThis(),
    single: mockAdminSingle,
    insert: mockAdminInsert,
  });

  mockAdminInsert.mockReturnValue({
    select: mockAdminSelect.mockReturnThis(),
    single: mockAdminSingle,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Mock modules
vi.mock('../lib/supabase/server', () => ({
  getSupabaseServerClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
  getAuthenticatedUser: vi.fn(async () => {
    const user = await mockGetUser();
    return user?.data?.user || null;
  }),
}));

vi.mock('../lib/supabase/admin', () => ({
  getSupabaseAdminClient: vi.fn(() => mockAdminClient),
  insertVisitWithRiskUpdate: (...args: unknown[]) => mockInsertVisitWithRiskUpdate(...args),
}));

vi.mock('../lib/scoring', () => ({
  calculateScore: () => mockCalculateScore(),
}));

describe('POST /api/score', () => {
  const validRequest = {
    household_id: '123e4567-e89b-12d3-a456-426614174000',
    responses: {
      sleep: 1,
      appetite: 1,
      activities: 1,
      hopelessness: 1,
      withdrawal: 2,
      trauma: 0,
      fear_flashbacks: 0,
      psychosis_signs: 0,
      substance: 0,
      substance_neglect: 0,
      self_harm: 0,
      wish_to_die: 0,
    },
    notes: 'Test notes',
  };

  const mockUser = {
    id: 'user-123',
    email: 'chw@test.com',
  };

  const mockHousehold = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    assigned_chw_id: 'user-123',
  };

  const mockProfile = {
    id: 'user-123',
    role: 'chw',
  };

  const mockScoreResult = {
    score: 35,
    risk_level: 'moderate' as const,
    explanation_en: 'Test explanation',
    explanation_ne: 'नेपाली व्याख्या',
    scoring_method: 'fallback' as const,
    action_en: 'Return visit within 1 week. Inform supervisor.',
    action_ne: '१ हप्ता भित्र फिर्ता भ्रमण गर्नुहोस्। सुपरिवेक्षकलाई सूचित गर्नुहोस्।',
  };

  const mockVisit = {
    id: 'visit-123',
    household_id: '123e4567-e89b-12d3-a456-426614174000',
    chw_id: 'user-123',
  };

  describe('401 Unauthorized', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when auth returns no user', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('422 Validation Failure', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should return 422 when household_id is missing', async () => {
      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses: validRequest.responses,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 422 when household_id is not a valid UUID', async () => {
      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validRequest,
          household_id: 'not-a-uuid',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 422 when responses are missing', async () => {
      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          household_id: validRequest.household_id,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 422 when response values are outside 0-3 range', async () => {
      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validRequest,
          responses: {
            ...validRequest.responses,
            sleep: 5, // Invalid value
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 422 when a required signal is missing', async () => {
      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validRequest,
          responses: {
            sleep: 1,
            appetite: 1,
            activities: 1,
            hopelessness: 1,
            withdrawal: 1,
            trauma: 0,
            fear_flashbacks: 0,
            psychosis_signs: 0,
            substance: 0,
            substance_neglect: 0,
            self_harm: 0,
            // missing wish_to_die
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 422 when request body is not valid JSON', async () => {
      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('404 Household Not Found', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should return 404 when household does not exist', async () => {
      mockAdminSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Household not found');
    });
  });

  describe('403 Forbidden - Unassigned Household', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should return 403 when household is assigned to different CHW', async () => {
      mockAdminSingle.mockResolvedValue({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          assigned_chw_id: 'different-user-id', // Different CHW
        },
        error: null,
      });

      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Household not assigned to you');
    });
  });

  describe('403 Forbidden - Non-CHW User', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockAdminSingle.mockResolvedValue({
        data: mockHousehold,
        error: null,
      });
    });

    it('should return 403 when user is a supervisor (not CHW)', async () => {
      mockSingle.mockResolvedValue({
        data: { id: mockUser.id, role: 'supervisor' },
        error: null,
      });

      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only CHWs can submit visits');
    });

    it('should return 403 when user has no profile', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' },
      });

      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only CHWs can submit visits');
    });
  });

  describe('200 Success', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockAdminSingle.mockResolvedValue({
        data: mockHousehold,
        error: null,
      });

      mockSingle.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      mockCalculateScore.mockResolvedValue(mockScoreResult);
      mockInsertVisitWithRiskUpdate.mockResolvedValue(mockVisit);
    });

    it('should return 200 with expected response shape on success', async () => {
      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('visit_id');
      expect(data).toHaveProperty('score');
      expect(data).toHaveProperty('risk_level');
      expect(data).toHaveProperty('explanation_en');
      expect(data).toHaveProperty('explanation_ne');
      expect(data).toHaveProperty('scoring_method');
    });

    it('should persist all 12 responses on success', async () => {
      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      await POST(request);

      expect(mockInsertVisitWithRiskUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          responses: {
            sleep: 1,
            appetite: 1,
            activities: 1,
            hopelessness: 1,
            withdrawal: 2,
            trauma: 0,
            fear_flashbacks: 0,
            psychosis_signs: 0,
            substance: 0,
            substance_neglect: 0,
            self_harm: 0,
            wish_to_die: 0,
          },
        })
      );
    });

    it('should return correct values from scoring', async () => {
      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.visit_id).toBe('visit-123');
      expect(data.score).toBe(35);
      expect(data.risk_level).toBe('moderate');
      expect(data.explanation_en).toBe('Test explanation');
      expect(data.explanation_ne).toBe('नेपाली व्याख्या');
      expect(data.scoring_method).toBe('fallback');
    });

    it('should accept request without notes', async () => {
      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          household_id: validRequest.household_id,
          responses: validRequest.responses,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('visit_id');
    });

    it('should handle valid risk levels', async () => {
      const riskLevels = ['low', 'moderate', 'high', 'critical'] as const;

      for (const risk_level of riskLevels) {
        mockCalculateScore.mockResolvedValue({
          ...mockScoreResult,
          risk_level,
        });

        const request = new Request('http://localhost/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validRequest),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.risk_level).toBe(risk_level);
      }
    });
  });

  describe('Recommendation Fields', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockAdminSingle.mockResolvedValue({
        data: mockHousehold,
        error: null,
      });

      mockSingle.mockResolvedValue({
        data: mockProfile,
        error: null,
      });
    });

    it('should include action_en and action_ne in response for low risk', async () => {
      mockCalculateScore.mockResolvedValue({
        ...mockScoreResult,
        score: 15,
        risk_level: 'low',
        action_en: 'Log and monitor. Continue routine monthly visits.',
        action_ne: 'लग गर्नुहोस् र निगरानी राख्नुहोस्। नियमित मासिक भ्रमण जारी राख्नुहोस्।',
      });
      mockInsertVisitWithRiskUpdate.mockResolvedValue(mockVisit);

      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('action_en');
      expect(data).toHaveProperty('action_ne');
      expect(data.action_en).toContain('Log and monitor');
      expect(data.action_ne).toContain('लग गर्नुहोस्');
    });

    it('should include action_en and action_ne in response for moderate risk', async () => {
      mockCalculateScore.mockResolvedValue({
        ...mockScoreResult,
        score: 35,
        risk_level: 'moderate',
        action_en: 'Return visit within 1 week. Inform supervisor.',
        action_ne: '१ हप्ता भित्र फिर्ता भ्रमण गर्नुहोस्। सुपरिवेक्षकलाई सूचित गर्नुहोस्।',
      });
      mockInsertVisitWithRiskUpdate.mockResolvedValue(mockVisit);

      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.action_en).toContain('1 week');
      expect(data.action_ne).toContain('१ हप्ता');
    });

    it('should include action_en and action_ne in response for high risk', async () => {
      mockCalculateScore.mockResolvedValue({
        ...mockScoreResult,
        score: 65,
        risk_level: 'high',
        action_en: 'Refer to the health post. Flag in dashboard. Supervisor review required.',
        action_ne: 'स्वास्थ्य चौकीमा रेफर गर्नुहोस्। ड्यासबोर्डमा झण्डा लगाउनुहोस्। सुपरिवेक्षक समीक्षा आवश्यक छ।',
      });
      mockInsertVisitWithRiskUpdate.mockResolvedValue(mockVisit);

      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.action_en).toContain('health post');
      expect(data.action_ne).toContain('स्वास्थ्य चौकी');
    });

    it('should include action_en and action_ne in response for critical risk', async () => {
      mockCalculateScore.mockResolvedValue({
        ...mockScoreResult,
        score: 90,
        risk_level: 'critical',
        action_en: 'Immediate escalation. Contact supervisor + doctor. Emergency protocol.',
        action_ne: 'तत्काल वृद्धि। सुपरिवेक्षक र डाक्टरसँग सम्पर्क गर्नुहोस्। आपतकालीन प्रोटोकल।',
      });
      mockInsertVisitWithRiskUpdate.mockResolvedValue(mockVisit);

      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.action_en).toContain('Immediate');
      expect(data.action_ne).toContain('तत्काल');
    });

    it('should persist action fields in visit record', async () => {
      mockCalculateScore.mockResolvedValue({
        ...mockScoreResult,
        score: 65,
        risk_level: 'high',
        action_en: 'Refer to the health post. Flag in dashboard. Supervisor review required.',
        action_ne: 'स्वास्थ्य चौकीमा रेफर गर्नुहोस्। ड्यासबोर्डमा झण्डा लगाउनुहोस्। सुपरिवेक्षक समीक्षा आवश्यक छ।',
      });
      mockInsertVisitWithRiskUpdate.mockResolvedValue(mockVisit);

      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      await POST(request);

      expect(mockInsertVisitWithRiskUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          action_en: expect.stringContaining('health post'),
          action_ne: expect.stringContaining('स्वास्थ्य'),
        })
      );
    });

    it('should show critical recommendation when self_harm override triggers', async () => {
      // Even with low score, self_harm >= 1 triggers critical
      mockCalculateScore.mockResolvedValue({
        ...mockScoreResult,
        score: 10,
        risk_level: 'critical', // Override applied by scoring
        action_en: 'Immediate escalation. Contact supervisor + doctor. Emergency protocol.',
        action_ne: 'तत्काल वृद्धि। सुपरिवेक्षक र डाक्टरसँग सम्पर्क गर्नुहोस्। आपतकालीन प्रोटोकल।',
      });
      mockInsertVisitWithRiskUpdate.mockResolvedValue(mockVisit);

      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validRequest,
          responses: {
            ...validRequest.responses,
            self_harm: 2,
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.risk_level).toBe('critical');
      expect(data.action_en).toContain('Immediate');
      expect(data.action_en).toContain('Emergency');
    });

    it('should show critical recommendation when wish_to_die override triggers', async () => {
      mockCalculateScore.mockResolvedValue({
        ...mockScoreResult,
        score: 8,
        risk_level: 'critical', // Override applied by scoring
      });
      mockInsertVisitWithRiskUpdate.mockResolvedValue(mockVisit);

      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validRequest,
          responses: {
            ...validRequest.responses,
            wish_to_die: 1,
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.risk_level).toBe('critical');
      expect(data.action_en).toContain('supervisor');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on unexpected error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      mockGetUser.mockRejectedValue(new Error('Unexpected error'));

      const request = new Request('http://localhost/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to process visit');
    });
  });
});
