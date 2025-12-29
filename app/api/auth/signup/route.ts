import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { signupSchema } from '@/lib/validations';
// import { InviteCodeUsageResult } from '@/types'; // Currently unused

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: validation.error.issues[0]?.message || 'Invalid input',
          field: validation.error.issues[0]?.path?.[0],
        },
        { status: 400 }
      );
    }

    const { fullName, email, password, inviteCode } = validation.data;
    const supabase = await createClient();

    // First, validate the invite code again
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: codeValidation, error: validationError } = await (supabase as any)
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

    // Create user profile first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: userError } = await (supabase as any)
      .from('users')
      .insert([{
        id: authData.user.id,
        email: email,
        name: fullName,
        full_name: fullName,
      }]);

    if (userError) {
      console.error('User profile creation failed:', userError);
      return NextResponse.json(
        { 
          error: 'Failed to create user profile. Please try again.',
          field: 'general'
        },
        { status: 500 }
      );
    }

    // Use the new group-aware invite code function
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
      request.headers.get('x-real-ip') || 
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: creationResult, error: creationError } = await (supabase as any)
      .rpc('use_invite_code_with_group', {
        code_to_use: inviteCode,
        user_id_param: authData.user.id,
        group_name: null, // Let the function determine group name
        ip_address_param: clientIP,
        user_agent_param: userAgent
      });

    if (creationError || !(creationResult as { success?: boolean })?.success) {
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

    // Return success - client will handle sign-in
    return NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
      },
      group_id: creationResult?.group_id
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