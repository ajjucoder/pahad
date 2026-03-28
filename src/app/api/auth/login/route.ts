// Login API route handler
// Handles email/password authentication

import { NextResponse } from 'next/server';
import { signInWithEmail, getRedirectPathForRole } from '@/lib/auth';
import { loginRequestSchema, validateOrThrow } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const { email, password } = validateOrThrow(loginRequestSchema, body);

    // Sign in with Supabase
    const result = await signInWithEmail(email, password);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    // Return success with redirect path
    return NextResponse.json({
      success: true,
      user: result.user,
      profile: result.profile,
      redirectPath: result.profile ? getRedirectPathForRole(result.profile.role) : '/app',
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      const validationError = error as unknown as { message: string; details: unknown };
      return NextResponse.json(
        { success: false, error: validationError.message, details: validationError.details },
        { status: 422 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
