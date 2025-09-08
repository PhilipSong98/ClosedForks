import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inviteCodeValidationSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validation = inviteCodeValidationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: validation.error.issues[0]?.message || 'Invalid invite code format'
        },
        { status: 400 }
      );
    }

    const { code } = validation.data;

    // Call the database function to join group with invite code
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: result, error } = await (supabase as any)
      .rpc('join_group_with_invite_code', { 
        code_param: code,
        user_id_param: user.id
      });

    if (error) {
      console.error('Error joining group:', error);
      return NextResponse.json(
        { error: 'Error joining group. Please try again.' },
        { status: 500 }
      );
    }

    // Return the result from the database function
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        groupId: result.group_id,
        groupName: result.group_name
      });
    } else {
      // Return business logic errors as 200 OK with success: false
      // This prevents browser console errors for expected validation failures
      return NextResponse.json({
        success: false,
        error: result.message
      });
    }

  } catch (error) {
    console.error('Unexpected error joining group:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}