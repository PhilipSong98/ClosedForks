import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

export async function DELETE(
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

    const { id: inviteId } = await params;
    
    // Use service client for RLS bypass after authentication
    const serviceSupabase = createServiceClient();

    // First, get the invite code to check permissions
    const { data: inviteCode, error: fetchError } = await serviceSupabase
      .from('invite_codes')
      .select('*, group_id')
      .eq('id', inviteId)
      .single() as {
        data: Database['public']['Tables']['invite_codes']['Row'] | null;
        error: Error | null;
      };

    if (fetchError || !inviteCode) {
      return NextResponse.json(
        { error: 'Invite code not found' },
        { status: 404 }
      );
    }

    // Check if user is a member of the group this invite belongs to
    if (!inviteCode.group_id) {
      return NextResponse.json(
        { error: 'Invalid invite code: no group associated' },
        { status: 400 }
      );
    }

    const { data: membership, error: membershipError } = await serviceSupabase
      .from('user_groups')
      .select('role')
      .eq('user_id', user.id)
      .eq('group_id', inviteCode.group_id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Not authorized to revoke this invite' },
        { status: 403 }
      );
    }

    // Revoke the invite code by setting is_active to false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (serviceSupabase as any)
      .from('invite_codes')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', inviteId);

    if (updateError) {
      console.error('Error revoking invite code:', updateError);
      return NextResponse.json(
        { error: 'Failed to revoke invite code' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/invites/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}