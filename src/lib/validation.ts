// Zod validation schemas for Saveika API requests

import { z } from 'zod';

// Signal value schema (0-3)
const signalValueSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

// Visit responses schema
export const visitResponsesSchema = z.object({
  sleep: signalValueSchema,
  appetite: signalValueSchema,
  activities: signalValueSchema,
  hopelessness: signalValueSchema,
  withdrawal: signalValueSchema,
  trauma: signalValueSchema,
  fear_flashbacks: signalValueSchema,
  psychosis_signs: signalValueSchema,
  substance: signalValueSchema,
  substance_neglect: signalValueSchema,
  self_harm: signalValueSchema,
  wish_to_die: signalValueSchema,
});

// Score request schema
export const scoreRequestSchema = z.object({
  household_id: z.string().uuid(),
  responses: visitResponsesSchema,
  notes: z.string().max(1000).optional(),
  patient_name: z.string().optional(),
  patient_age: z.coerce.number().optional(),
  patient_gender: z.string().optional(),
});

// Login request schema
export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Household status update schema (for supervisor)
export const householdStatusSchema = z.enum(['active', 'reviewed', 'referred']);

// Household status update request schema
export const householdStatusRequestSchema = z.object({
  household_id: z.string().uuid(),
  status: householdStatusSchema,
});

// Risk level schema
export const riskLevelSchema = z.enum(['low', 'moderate', 'high', 'critical']);

// UUID schema
export const uuidSchema = z.string().uuid();

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// CHW Application status schema
export const applicationStatusSchema = z.enum(['pending', 'approved', 'rejected']);
export const applicationRoleSchema = z.enum(['chw', 'supervisor']);

// CHW Application create schema (for applicants submitting their profile)
export const chwApplicationCreateSchema = z.object({
  phone: z.string().min(7).max(20),
  address: z.string().min(5).max(500),
  area_id: z.string().uuid(),
});

// CHW Application update schema (for applicants updating pending application)
export const chwApplicationUpdateSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
  address: z.string().max(500).optional(),
  area_id: z.string().uuid().optional().nullable(),
});

// CHW Application approval schema (for supervisors)
export const chwApplicationApprovalSchema = z.object({
  application_id: z.string().uuid(),
  approved_role: applicationRoleSchema,
});

// CHW Application rejection schema (for supervisors)
export const chwApplicationRejectionSchema = z.object({
  application_id: z.string().uuid(),
  rejection_reason: z.string().min(5).max(500),
});

// Types inferred from schemas
export type ScoreRequestInput = z.infer<typeof scoreRequestSchema>;
export type LoginRequestInput = z.infer<typeof loginRequestSchema>;
export type VisitResponsesInput = z.infer<typeof visitResponsesSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type HouseholdStatusRequestInput = z.infer<typeof householdStatusRequestSchema>;
export type ChwApplicationCreateInput = z.infer<typeof chwApplicationCreateSchema>;
export type ChwApplicationUpdateInput = z.infer<typeof chwApplicationUpdateSchema>;
export type ChwApplicationApprovalInput = z.infer<typeof chwApplicationApprovalSchema>;
export type ChwApplicationRejectionInput = z.infer<typeof chwApplicationRejectionSchema>;

// Validation helper
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    // Zod v4 uses 'issues'
    const issues = result.error.issues;
    const errors = issues.map((issue) => ({
      path: issue.path.map(String).join('.'),
      message: issue.message,
    }));
    throw new ValidationError('Validation failed', errors);
  }
  return result.data;
}

// Custom validation error
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly details: Array<{ path: string; message: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
