import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UpdateRoleRequest, UpdateRoleResponse, GroupRole } from '@/types';
import { permissionService, getRequestInfo } from '@/lib/auth/permissions';

/**
 * PATCH /api/groups/[id]/members/[userId]/role
 * Update a member's role within a group
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
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

    const { id: groupId, userId: targetUserId } = await params;
    const body: { new_role: GroupRole; reason?: string } = await request.json();
    
    // Validate input
    if (!body.new_role || !['member', 'admin', 'owner'].includes(body.new_role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: member, admin, owner' },
        { status: 400 }
      );
    }

    // Check if user has permission to manage roles in this group
    try {
      await permissionService.ensureCan(user.id, 'manage_roles', { groupId });
    } catch (permissionError: any) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions', 
          message: 'Group owner or admin role required to manage roles'
        },
        { status: 403 }
      );
    }

    // Validate target user is a member of the group
    const { data: targetMembership } = await supabase
      .from('user_groups')
      .select('role')
      .eq('user_id', targetUserId)
      .eq('group_id', groupId)
      .single();

    if (!targetMembership) {
      return NextResponse.json(
        { error: 'User is not a member of this group' },
        { status: 404 }
      );
    }

    // Additional validation for ownership transfer
    if (body.new_role === 'owner') {
      // Only current owners can transfer ownership
      const isCurrentOwner = await permissionService.isGroupOwner(user.id, groupId);
      if (!isCurrentOwner) {
        return NextResponse.json(
          { 
            error: 'Insufficient permissions', 
            message: 'Only group owners can transfer ownership'
          },
          { status: 403 }
        );
      }
    }

    // Get request info for audit logging
    const { ip, userAgent } = getRequestInfo(request);

    // Use database function to update role with audit logging
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: result, error: updateError } = await (supabase as any)
      .rpc('update_group_role', {
        target_user_id: targetUserId,
        group_id_param: groupId,
        new_role_param: body.new_role,
        actor_id_param: user.id,
        reason_param: body.reason || null,
        ip_address_param: ip,
        user_agent_param: userAgent
      }) as { data: {
        success: boolean;
        old_role: GroupRole;
        new_role: GroupRole;
        audit_id: string;
        message: string;
      } | null; error: unknown; };

    if (updateError || !result?.success) {
      console.error('Error updating role:', updateError);
      return NextResponse.json(
        { error: result?.message || 'Failed to update role' },
        { status: 500 }
      );
    }

    const response: UpdateRoleResponse = {
      success: true,
      old_role: result.old_role,
      new_role: result.new_role,
      audit_id: result.audit_id,
      message: result.message
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/groups/[id]/members/[userId]/role
 * Remove a member from a group
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
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

    const { id: groupId, userId: targetUserId } = await params;
    const body = await request.json();
    const reason = body.reason || undefined;
    
    // Check if user has permission to remove members from this group
    try {
      await permissionService.ensureCan(user.id, 'remove_member', { groupId });
    } catch (permissionError: any) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions', 
          message: 'Group owner or admin role required to remove members'
        },
        { status: 403 }
      );
    }

    // Validate target user is a member of the group
    const { data: targetMembership } = await supabase
      .from('user_groups')
      .select('role')
      .eq('user_id', targetUserId)
      .eq('group_id', groupId)
      .single();

    if (!targetMembership) {
      return NextResponse.json(
        { error: 'User is not a member of this group' },
        { status: 404 }
      );
    }

    // Get request info for audit logging
    const { ip, userAgent } = getRequestInfo(request);

    // Use database function to remove member with audit logging
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: result, error: removeError } = await (supabase as any)
      .rpc('remove_group_member', {
        target_user_id: targetUserId,
        group_id_param: groupId,
        actor_id_param: user.id,
        reason_param: reason,
        ip_address_param: ip,
        user_agent_param: userAgent
      }) as { data: {
        success: boolean;
        removed_role: GroupRole;
        audit_id: string;
        message: string;
      } | null; error: unknown; };

    if (removeError || !result?.success) {
      console.error('Error removing member:', removeError);
      return NextResponse.json(
        { error: result?.message || 'Failed to remove member' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      removed_role: result.removed_role,
      audit_id: result.audit_id,
      message: result.message
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}