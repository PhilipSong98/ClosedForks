import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GroupWithDetails, GroupRole } from '@/types';
import { permissionService, getRequestInfo } from '@/lib/auth/permissions';
import { auditService } from '@/lib/auth/audit';

export async function GET(
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
    
    // First, check if user is a member of this group
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
        { error: 'Group not found or access denied' },
        { status: 404 }
      );
    }

    // Get group details
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single() as { 
        data: {
          id: string;
          name: string;
          description: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        } | null; 
        error: unknown; 
      };

    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Get member count
    const { count: memberCount, error: countError } = await supabase
      .from('user_groups')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);

    if (countError) {
      console.error('Error getting member count:', countError);
    }

    // Get members (optional - include if requested)
    const { searchParams } = new URL(request.url);
    const includeMembers = searchParams.get('include_members') === 'true';
    let members = undefined;

    if (includeMembers) {
      const { data: membersData, error: membersError } = await supabase
        .from('user_groups')
        .select(`
          id,
          user_id,
          group_id,
          role,
          joined_at,
          users:user_id (
            id,
            name,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: false });

      if (!membersError && membersData) {
        members = membersData.map((m: {
          id: string;
          user_id: string;
          group_id: string;
          role: string;
          joined_at: string;
          users: {
            id: string;
            name: string;
            full_name: string | null;
            email: string;
            avatar_url: string | null;
          };
        }) => ({
          id: m.id,
          user_id: m.user_id,
          group_id: m.group_id,
          role: m.role as GroupRole,
          joined_at: m.joined_at,
          user: {
            id: m.users.id,
            name: m.users.name,
            full_name: m.users.full_name || undefined,
            email: m.users.email,
            avatar_url: m.users.avatar_url || undefined,
          }
        }));
      }
    }

    const groupDetails: GroupWithDetails = {
      id: group.id,
      name: group.name,
      description: group.description || undefined,
      created_by: group.created_by || undefined,
      created_at: group.created_at,
      updated_at: group.updated_at,
      member_count: memberCount || 0,
      user_role: membership.role,
      joined_at: membership.joined_at,
      members
    };

    return NextResponse.json(groupDetails);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const body = await request.json();
    
    // Check if user has permission to edit this group
    try {
      await permissionService.ensureCan(user.id, 'edit_group', { groupId });
    } catch {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions', 
          message: 'Group owner or admin role required to edit this group'
        },
        { status: 403 }
      );
    }

    // Validate input
    const updates: { name?: string; description?: string | null } = {};
    if (body.name !== undefined) {
      if (!body.name || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Group name cannot be empty' },
          { status: 400 }
        );
      }
      if (body.name.length > 100) {
        return NextResponse.json(
          { error: 'Group name must be 100 characters or less' },
          { status: 400 }
        );
      }
      updates.name = body.name.trim();
    }
    if (body.description !== undefined) {
      updates.description = body.description;
    }

    // Get current group info for audit logging
    const { data: currentGroup } = await supabase
      .from('groups')
      .select('name, description')
      .eq('id', groupId)
      .single() as { 
        data: { name: string; description: string | null } | null; 
        error: unknown 
      };

    if (!currentGroup) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Track changes for audit log
    const changes: Record<string, unknown> = {};
    if (updates.name !== undefined && updates.name !== currentGroup.name) {
      changes.name = {
        from: currentGroup.name,
        to: updates.name
      };
    }
    if (updates.description !== undefined && updates.description !== currentGroup.description) {
      changes.description = {
        from: currentGroup.description,
        to: updates.description
      };
    }

    // Only proceed if there are actual changes
    if (Object.keys(changes).length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No changes to apply'
      });
    }

    // Update group
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedGroup, error: updateError } = await (supabase as any)
      .from('groups')
      .update(updates)
      .eq('id', groupId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating group:', updateError);
      return NextResponse.json(
        { error: 'Failed to update group' },
        { status: 500 }
      );
    }

    // Log audit event
    const { ip, userAgent } = getRequestInfo(request);
    const auditId = await auditService.logGroupUpdated({
      actorId: user.id,
      groupId,
      changes,
      ipAddress: ip,
      userAgent
    });

    return NextResponse.json({
      success: true,
      group: updatedGroup,
      audit_id: auditId,
      message: 'Group updated successfully'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}