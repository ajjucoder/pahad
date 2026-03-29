// Helper functions for CHW applications

import { getSupabaseAdminClient } from './supabase/admin';
import type { ApplicationStatus, ChwApplication, Profile, Role } from './types';

interface CreateApplicationParams {
  userId: string;
  email: string;
  fullName: string;
  requestedRole: Role;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  areaId?: string;
}

/**
 * Get an application by user ID (most recent)
 */
export async function getApplicationByUserId(userId: string): Promise<ChwApplication | null> {
  const admin = getSupabaseAdminClient();

  const { data, error } = await admin
    .from('chw_applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data as ChwApplication;
}

/**
 * Get application by ID
 */
export async function getApplicationById(id: string): Promise<ChwApplication | null> {
  const admin = getSupabaseAdminClient();

  const { data, error } = await admin
    .from('chw_applications')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as ChwApplication;
}

/**
 * Create a new application
 */
export async function createApplication(params: CreateApplicationParams): Promise<ChwApplication | null> {
  const admin = getSupabaseAdminClient();

  const { data, error } = await admin
    .from('chw_applications')
    .insert({
      user_id: params.userId,
      email: params.email,
      full_name: params.fullName,
      requested_role: params.requestedRole,
      avatar_url: params.avatarUrl ?? null,
      phone: params.phone ?? null,
      address: params.address ?? null,
      area_id: params.areaId ?? null,
      status: 'pending',
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Failed to create application:', error);
    return null;
  }

  return data as ChwApplication;
}

/**
 * Update application status (approve or reject)
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  reviewedBy?: string,
  rejectionReason?: string
): Promise<boolean> {
  const admin = getSupabaseAdminClient();

  const updateData: Record<string, unknown> = {
    status,
    reviewed_by: reviewedBy ?? null,
    reviewed_at: new Date().toISOString(),
  };

  if (rejectionReason) {
    updateData.rejection_reason = rejectionReason;
  }

  const { error } = await admin
    .from('chw_applications')
    .update(updateData)
    .eq('id', applicationId);

  if (error) {
    console.error('Failed to update application status:', error);
    return false;
  }

  return true;
}

/**
 * Check if user has a pending or approved application
 */
export async function hasPendingOrApprovedApplication(userId: string): Promise<boolean> {
  const admin = getSupabaseAdminClient();

  const { count, error } = await admin
    .from('chw_applications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['pending', 'approved']);

  if (error) {
    return false;
  }

  return (count ?? 0) > 0;
}

/**
 * Get all applications (for supervisors)
 */
export async function getApplications(): Promise<ChwApplication[]> {
  const admin = getSupabaseAdminClient();

  const { data, error } = await admin
    .from('chw_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as ChwApplication[];
}

interface UpdateApplicationParams {
  full_name?: string;
  requested_role?: Role;
  phone?: string;
  address?: string;
  areaId?: string;
}

/**
 * Update a pending application by user ID
 */
export async function updateApplication(
  userId: string,
  params: UpdateApplicationParams
): Promise<ChwApplication | null> {
  const admin = getSupabaseAdminClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (params.full_name !== undefined) updateData.full_name = params.full_name;
  if (params.requested_role !== undefined) updateData.requested_role = params.requested_role;
  if (params.phone !== undefined) updateData.phone = params.phone;
  if (params.address !== undefined) updateData.address = params.address;
  if (params.areaId !== undefined) updateData.area_id = params.areaId;

  const { data, error } = await admin
    .from('chw_applications')
    .update(updateData)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) {
    console.error('Failed to update application:', error);
    return null;
  }

  return data as ChwApplication;
}

/**
 * Approve a pending application and return the provisioned profile
 */
export async function approveApplication(
  applicationId: string,
  reviewerId: string,
  approvedRole: Role
): Promise<{
  success: boolean;
  error?: string;
  application?: ChwApplication;
  profile?: Profile;
}> {
  const admin = getSupabaseAdminClient();

  // Get the application
  const application = await getApplicationById(applicationId);
  if (!application) {
    return { success: false, error: 'Application not found' };
  }

  if (application.status !== 'pending') {
    return { success: false, error: 'Application is not pending' };
  }

  const { data: existingProfile } = await admin
    .from('profiles')
    .select()
    .eq('id', application.user_id)
    .single();

  if (existingProfile) {
    return { success: false, error: 'User already has a profile' };
  }

  const { error: roleError } = await admin
    .from('chw_applications')
    .update({ requested_role: approvedRole })
    .eq('id', applicationId);

  if (roleError) {
    console.error('Failed to set approved role on application');
    return { success: false, error: 'Failed to set approved role' };
  }

  const updated = await updateApplicationStatus(applicationId, 'approved', reviewerId);
  if (!updated) {
    return { success: false, error: 'Failed to approve application' };
  }

  const updatedApplication = await getApplicationById(applicationId);
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', application.user_id)
    .single();

  if (profileError || !profile) {
    console.error('Failed to load provisioned profile after approval');
    return { success: false, error: 'Approved application, but failed to load user profile' };
  }

  return {
    success: true,
    application: updatedApplication ?? undefined,
    profile: profile as Profile,
  };
}

/**
 * Reject a pending CHW application
 */
export async function rejectApplication(
  applicationId: string,
  reviewerId: string,
  rejectionReason: string
): Promise<{
  success: boolean;
  error?: string;
  application?: ChwApplication;
}> {
  const application = await getApplicationById(applicationId);
  if (!application) {
    return { success: false, error: 'Application not found' };
  }

  if (application.status !== 'pending') {
    return { success: false, error: 'Application is not pending' };
  }

  const admin = getSupabaseAdminClient();

  // Update application status
  const { error } = await admin
    .from('chw_applications')
    .update({
      status: 'rejected',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: rejectionReason,
    })
    .eq('id', applicationId);

  if (error) {
    console.error('Failed to reject application:', error);
    return { success: false, error: 'Failed to reject application' };
  }

  const updatedApplication = await getApplicationById(applicationId);

  return {
    success: true,
    application: updatedApplication ?? undefined,
  };
}
