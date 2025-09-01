import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateGroupRequest, GroupsResponse, GroupRole } from '@/types';
import { permissionService, getRequestInfo } from '@/lib/auth/permissions';
import '@/lib/auth/audit';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Use our custom function to get user's groups with member counts
    const { data: groups, error } = await (supabase as unknown as {
      rpc: (name: string, params: Record<string, unknown>) => Promise<{
        data: {
          group_id: string;
          group_name: string;
          group_description: string;
          user_role: string;
          member_count: string | number;
          joined_at: string;
          created_at: string;
        }[] | null;
        error: unknown;
      }>
    }).rpc('get_user_groups', { user_id_param: user.id });

    if (error) {
      console.error('Error fetching user groups:', error);
      return NextResponse.json(
        { error: 'Failed to fetch groups' },
        { status: 500 }
      );
    }

    // Format the response to match our GroupsResponse interface
    const formattedGroups = (groups || []).slice(offset, offset + limit).map((g) => ({
      id: g.group_id,
      name: g.group_name,
      description: g.group_description,
      created_at: g.created_at,
      updated_at: g.created_at, // Database doesn't track updated_at separately for now
      member_count: typeof g.member_count === 'string' ? parseInt(g.member_count) : g.member_count,
      user_role: g.user_role as GroupRole,
      joined_at: g.joined_at,
    }));

    const response: GroupsResponse = {
      groups: formattedGroups,
      count: (groups || []).length
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

export async function POST(request: NextRequest) {
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

    // Check if user has permission to create groups (Admin only)
    try {
      await permissionService.ensureCan(user.id, 'create_group');
    } catch (permissionError) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions', 
          message: 'Only administrators can create new groups'
        },
        { status: 403 }
      );
    }

    const body: CreateGroupRequest = await request.json();
    
    // Validate input
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    if (body.name.length > 100) {
      return NextResponse.json(
        { error: 'Group name must be 100 characters or less' },
        { status: 400 }
      );
    }

    // Get request info for audit logging
    const { ip, userAgent } = getRequestInfo(request);

    // Use enhanced function to create group with audit logging
    const { data: result, error: creationError } = await (supabase as unknown as {
      rpc: (name: string, params: Record<string, unknown>) => Promise<{
        data: {
          success: boolean;
          group_id?: string;
          audit_id?: string;
          message: string;
        } | null;
        error: unknown;
      }>
    }).rpc('create_group_with_audit', {
        group_name: body.name.trim(),
        group_description: body.description?.trim() || null,
        owner_user_id: user.id,
        ip_address_param: ip,
        user_agent_param: userAgent
      });

    if (creationError || !result?.success) {
      console.error('Error creating group:', creationError);
      return NextResponse.json(
        { error: result?.message || 'Failed to create group' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      group_id: result.group_id,
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