import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FormEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApplicationsClient, type ApplicationData } from '@/components/supervisor/applications-client';

vi.mock('@/providers/language-provider', () => ({
  useLanguage: () => ({
    locale: 'en',
    t: (key: string) => {
      const translations: Record<string, string> = {
        'applications.empty': 'No applications pending',
        'applications.errors.approve': 'Failed to approve application',
        'applications.errors.reject': 'Failed to reject application',
        'applications.errors.reasonRequired': 'Please provide a rejection reason',
        'applications.errors.generic': 'Something went wrong',
        'applications.success.approved': 'Application approved',
        'applications.success.rejected': 'Application rejected',
        'applications.actions.approve': 'Approve',
        'applications.actions.reject': 'Reject',
        'applications.rejectModal.title': 'Reject application',
        'applications.rejectModal.description': 'Please provide a reason for rejection.',
        'applications.rejectModal.reason': 'Reason',
        'applications.rejectModal.reasonPlaceholder': 'Enter rejection reason',
        'applications.status.pending': 'Pending',
        'apply.form.roleChw': 'CHW',
        'apply.form.roleSupervisor': 'Supervisor',
        'common.cancel': 'Cancel',
      };

      return translations[key] ?? key;
    },
  }),
}));

const applications: ApplicationData[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    user_id: 'user-1',
    email: 'applicant@example.com',
    full_name: 'Test Applicant',
    requested_role: 'chw',
    phone: '1234567890',
    address: 'Kathmandu',
    area_id: '550e8400-e29b-41d4-a716-446655440001',
    avatar_url: null,
    status: 'pending',
    rejection_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2024-01-01T10:00:00.000Z',
    area_name: 'Kathmandu',
    area_name_ne: 'काठमाडौं',
  },
];

describe('ApplicationsClient rejection flow', () => {
  const fetchSpy = vi.fn();
  const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());

  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = fetchSpy as unknown as typeof fetch;
  });

  it('uses explicit button actions for rejection and submits the trimmed reason', async () => {
    const user = userEvent.setup();

    render(
      <form onSubmit={onSubmit}>
        <ApplicationsClient applications={applications} />
      </form>
    );

    await user.click(screen.getAllByRole('button', { name: 'Reject' })[0]);
    await user.type(screen.getByLabelText('Reason'), '  Insufficient qualifications  ');
    await user.click(screen.getAllByRole('button', { name: 'Reject' })[1]);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/applications/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: '550e8400-e29b-41d4-a716-446655440000',
          rejection_reason: 'Insufficient qualifications',
        }),
      });
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.queryByText('Reject application')).not.toBeInTheDocument();
  });
});
