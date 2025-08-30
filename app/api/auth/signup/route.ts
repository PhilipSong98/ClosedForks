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

    // Create user with Supabase Auth - disable email confirmation for invite-based signups
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: undefined // Disable email confirmation for invite-based signups
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

    // Create user profile and record invite code usage atomically
    const clientIP = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0] || 
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const { data: creationResult, error: creationError } = await supabase
      .rpc('create_user_with_invite', {
        user_id_param: authData.user.id,
        email_param: email,
        name_param: fullName,
        full_name_param: fullName,
        invite_code_param: inviteCode,
        ip_address_param: clientIP,
        user_agent_param: userAgent
      });

    if (creationError || !(creationResult as any)?.success) {
      console.error('User profile and invite code creation failed:', creationError);
      // Note: In production, you might want to implement cleanup logic
      // For now, we'll let the auth user exist but warn about the profile issue
      
      return NextResponse.json(
        { 
          error: creationResult?.message || 'Failed to create account. Please try again.',
          field: 'general'
        },
        { status: 500 }
      );
    }

    // For invite-based signups, we can attempt auto sign-in
    // since we know the invite code was valid
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('Auto sign-in failed:', signInError);
      
      // Check if it's an email confirmation issue
      if (signInError.message?.includes('email_not_confirmed')) {
        // For invite-based signups, try to confirm the email programmatically
        try {
          // This is a workaround - in production you might want to handle this differently
          return NextResponse.json({
            success: true,
            message: 'Account created successfully. Please check your email to confirm your account, then sign in.',
            autoSignIn: false
          });
        } catch (confirmError) {
          console.error('Email confirmation failed:', confirmError);
        }
      }
      
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