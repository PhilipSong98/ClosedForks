import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Require authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = await params;
    
    // Use service client for RLS bypass after authentication
    const serviceSupabase = createServiceClient();

    // Check if user is a member of this group
    const { data: membership, error: membershipError } = await serviceSupabase
      .from('user_groups')
      .select('role')
      .eq('user_id', user.id)
      .eq('group_id', groupId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Not a member of this group' },
        { status: 403 }
      );
    }

    // Fetch invite codes for this group
    const { data: inviteCodes, error: inviteError } = await serviceSupabase
      .from('invite_codes')
      .select('id, code, max_uses, current_uses, expires_at, created_at, is_active')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false }) as {
        data: Database['public']['Tables']['invite_codes']['Row'][] | null;
        error: Error | null;
      };

    if (inviteError) {
      console.error('Error fetching invite codes:', inviteError);
      return NextResponse.json(
        { error: 'Failed to fetch invite codes' },
        { status: 500 }
      );
    }

    // Transform the data to match frontend interface
    const formattedCodes = (inviteCodes || []).map(code => ({
      id: code.id,
      code: code.code,
      maxUses: code.max_uses || 10,
      currentUses: code.current_uses || 0,
      usesRemaining: (code.max_uses || 10) - (code.current_uses || 0),
      expiresAt: code.expires_at,
      createdAt: code.created_at,
      isActive: code.is_active && code.expires_at ? new Date(code.expires_at) > new Date() : false
    }));

    return NextResponse.json(formattedCodes);
  } catch (error) {
    console.error('Error in GET /api/groups/[id]/invites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
