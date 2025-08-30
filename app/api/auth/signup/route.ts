import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { signupSchema } from '@/lib/validations';
import { InviteCodeUsageResult } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: validation.error.errors[0]?.message || 'Invalid input',
          field: validation.error.errors[0]?.path?.[0],
        },
        { status: 400 }
      );
    }

    const { fullName, email, password, inviteCode } = validation.data;
    const supabase = await createClient();

    // First, validate the invite code again
    const { data: codeValidation, error: validationError } = await supabase
      .rpc('validate_invite_code', { code_to_check: inviteCode });

    if (validationError || !codeValidation?.valid) {
      return NextResponse.json(
        { 
          error: 'Invalid or expired invite code',
          field: 'inviteCode'
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { 
          error: 'An account with this email already exists',
          field: 'email'
        },
        { status: 400 }
      );
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (authError) {
      console.error('Supabase auth signup error:', authError);
      
      // Handle specific error cases
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { 
            error: 'An account with this email already exists',
            field: 'email'
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create account. Please try again.',
          field: 'general'
        },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { 
          error: 'Failed to create account. Please try again.',
          field: 'general'
        },
        { status: 500 }
      );
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name: fullName, // Keep for compatibility
        full_name: fullName,
        role: 'user',
        password_set: true,
        first_login_completed: true,
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // User was created in auth, but profile failed
      // In production, you'd want to handle this more gracefully
    }

    // Record invite code usage
    const clientIP = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0] || 
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const { data: usageResult, error: usageError } = await supabase
      .rpc('use_invite_code', {
        code_to_use: inviteCode,
        user_id_param: authData.user.id,
        ip_address_param: clientIP,
        user_agent_param: userAgent
      });

    if (usageError || !(usageResult as InviteCodeUsageResult)?.success) {
      console.warn('Failed to record invite code usage:', usageError);
      // Don't fail the signup, just log the warning
    }

    // Sign in the user automatically
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('Auto sign-in failed:', signInError);
      // User is created but not signed in
      return NextResponse.json({
        success: true,
        message: 'Account created successfully. Please sign in.',
        autoSignIn: false
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      autoSignIn: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
      }
    });

  } catch (error) {
    console.error('Unexpected error during signup:', error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred. Please try again.',
        field: 'general'
      },
      { status: 500 }
    );
  }
}