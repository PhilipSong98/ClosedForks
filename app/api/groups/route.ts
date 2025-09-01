import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateGroupRequest, GroupsResponse, GroupRole } from '@/types';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: groups, error } = await (supabase as any)
      .rpc('get_user_groups', { user_id_param: user.id }) as { data: {
        group_id: string;
        group_name: string;
        group_description: string;
        user_role: string;
        member_count: string | number;
        joined_at: string;
        created_at: string;
      }[] | null; error: unknown; };

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

    // Use our custom function to create group and make user owner
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: result, error: creationError } = await (supabase as any)
      .rpc('create_group_and_add_owner', {
        group_name: body.name.trim(),
        group_description: body.description?.trim() || null,
        owner_user_id: user.id
      }) as { data: {
        success: boolean;
        group_id?: string;
        message: string;
      } | null; error: unknown; };

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