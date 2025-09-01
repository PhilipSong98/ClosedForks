import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GroupRole } from '@/types';

// Generate a 6-digit numeric invite code
function generate6DigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: groupId } = await params;
    
    // Check if user is a member of this group (any member can generate codes)
    const { data: membership, error: membershipError } = await supabase
      .from('user_groups')
      .select('role, joined_at')
      .eq('user_id', user.id)
      .eq('group_id', groupId)
      .single() as { 
        data: { role: GroupRole; joined_at: string } | null; 
        error: unknown; 
      };

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Group not found or access denied. You must be a member of this group to generate invite codes.' },
        { status: 404 }
      );
    }

    // Generate unique 6-digit code
    let code: string;
    let codeExists = true;
    let attempts = 0;
    const maxAttempts = 10;

    while (codeExists && attempts < maxAttempts) {
      code = generate6DigitCode();
      const { data: existing } = await supabase
        .from('invite_codes')
        .select('id')
        .eq('code', code)
        .single();
      
      codeExists = !!existing;
      attempts++;
    }

    if (codeExists) {
      return NextResponse.json(
        { error: 'Failed to generate unique invite code. Please try again.' },
        { status: 500 }
      );
    }

    // Set default expiry to 7 days and max uses to 10
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const maxUses = 10;

    // Create the invite code linked to this group
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inviteCode, error: createError } = await (supabase.from('invite_codes') as any)
      .insert({
        code: code!,
        group_id: groupId,
        max_uses: maxUses,
        current_uses: 0,
        is_active: true,
        expires_at: expiresAt,
        created_by: user.id,
      })
      .select(`
        id,
        code,
        max_uses,
        current_uses,
        expires_at,
        created_at
      `)
      .single();

    if (createError) {
      console.error('Error creating invite code:', createError);
      return NextResponse.json(
        { error: 'Failed to create invite code' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inviteCode: {
        id: inviteCode.id,
        code: inviteCode.code,
        maxUses: inviteCode.max_uses,
        currentUses: inviteCode.current_uses,
        expiresAt: inviteCode.expires_at,
        createdAt: inviteCode.created_at,
        usesRemaining: inviteCode.max_uses - inviteCode.current_uses,
      },
      message: 'Invite code generated successfully'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}