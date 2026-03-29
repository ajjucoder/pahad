// Tests for VisitForm component - TDD for requiring explicit answers

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { VisitForm } from '../components/chw/visit-form';
import { LanguageProvider } from '../providers/language-provider';
import type { Household } from '../lib/types';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock scrollIntoView and pointer capture APIs
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
});

// Test households
const testHouseholds: Household[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    code: 'HH-001',
    head_name: 'Test Household',
    area_id: 'area-1',
    assigned_chw_id: 'chw-1',
    latest_risk_score: 0,
    latest_risk_level: 'low',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    area_name: 'Kathmandu',
    area_name_ne: 'काठमाडौं',
  },
];

// Helper to render with providers
function renderVisitForm() {
  return render(
    <LanguageProvider>
      <VisitForm households={testHouseholds} />
    </LanguageProvider>
  );
}

function getProgressSummary(expected: string) {
  return screen.getAllByText((_, element) => {
    const text = element?.textContent?.replace(/\s+/g, '') ?? '';
    return text === expected;
  })[0];
}

describe('VisitForm - Explicit Answer Requirement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        visit_id: 'visit-1',
        score: 0,
        risk_level: 'low',
        explanation_en: 'Test explanation',
        explanation_ne: 'Test explanation NE',
        scoring_method: 'fallback',
      }),
    });
  });

  it('should not allow submission when no signals have been explicitly answered (untouched form)', async () => {
    const user = userEvent.setup();
    renderVisitForm();

    // Select a household (required for submission)
    const householdSearch = screen.getByPlaceholderText('Search by code, name, or area...');
    await user.click(householdSearch);
    
    // Wait for dropdown and click the option
    const option = await screen.findByRole('button', { name: /HH-001/i });
    await user.click(option);

    // Find submit button
    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    // Regression check: submit must stay disabled until answers are explicitly selected.
    expect(submitButton).toBeDisabled();
  });

  it('should show progress as answers are completed', async () => {
    const user = userEvent.setup();
    renderVisitForm();

    // Select a household
    const householdSearch = screen.getByPlaceholderText('Search by code, name, or area...');
    await user.click(householdSearch);
    const option = await screen.findByRole('button', { name: /HH-001/i });
    await user.click(option);

    expect(getProgressSummary('0/12')).toBeInTheDocument();

    // Answer only the first signal (sleep) by clicking on the first "Mild / sometimes" button
    const mildButtons = screen.getAllByRole('button', { name: 'Mild / sometimes' });
    await user.click(mildButtons[0]);

    expect(getProgressSummary('1/12')).toBeInTheDocument();
  });

  it('should not allow submission when only some signals are answered', async () => {
    const user = userEvent.setup();
    renderVisitForm();

    // Select a household
    const householdSearch = screen.getByPlaceholderText('Search by code, name, or area...');
    await user.click(householdSearch);
    const option = await screen.findByRole('button', { name: /HH-001/i });
    await user.click(option);

    // Answer only the first signal (sleep) by clicking on the first "Mild / sometimes" button
    const mildButtons = screen.getAllByRole('button', { name: 'Mild / sometimes' });
    await user.click(mildButtons[0]);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    // Submit should still be disabled because only 1 of 12 signals answered
    expect(submitButton).toBeDisabled();
  });

  it('should allow submission only when all 12 signals are explicitly answered', async () => {
    const user = userEvent.setup();
    renderVisitForm();

    // Select a household
    const householdSearch = screen.getByPlaceholderText('Search by code, name, or area...');
    await user.click(householdSearch);
    const option = await screen.findByRole('button', { name: /HH-001/i });
    await user.click(option);

    // Answer all 12 signals - click "Not observed" for each
    const notObservedOptions = screen.getAllByRole('button', { name: 'Not observed' });
    
    // There should be 12 "Not observed" buttons (one for each signal)
    expect(notObservedOptions).toHaveLength(12);
    
    for (const radio of notObservedOptions) {
      await user.click(radio);
    }

    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    expect(getProgressSummary('12/12')).toBeInTheDocument();

    // Now submit should be enabled because all 12 signals are explicitly answered
    expect(submitButton).toBeEnabled();
  });

  it('should submit all zero responses when all signals answered as "Not observed"', async () => {
    const user = userEvent.setup();
    renderVisitForm();

    // Select a household
    const householdSearch = screen.getByPlaceholderText('Search by code, name, or area...');
    await user.click(householdSearch);
    const option = await screen.findByRole('button', { name: /HH-001/i });
    await user.click(option);

    // Answer all 12 signals as "Not observed"
    const notObservedOptions = screen.getAllByRole('button', { name: 'Not observed' });
    for (const button of notObservedOptions) {
      await user.click(button);
    }

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Verify fetch was called with all zeros (explicit "Not observed")
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/score', expect.objectContaining({
        method: 'POST',
        body: expect.any(String),
      }));
    });

    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    
    // All responses should be 0 (explicitly selected "Not observed")
    expect(body.responses).toEqual({
      sleep: 0,
      appetite: 0,
      activities: 0,
      hopelessness: 0,
      withdrawal: 0,
      trauma: 0,
      fear_flashbacks: 0,
      psychosis_signs: 0,
      substance: 0,
      substance_neglect: 0,
      self_harm: 0,
      wish_to_die: 0,
    });
  });
});
