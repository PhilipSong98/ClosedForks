import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: targetUserId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Parse pagination params
    const cursorCreatedAt = searchParams.get('cursor_created_at');
    const cursorId = searchParams.get('cursor_id');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Call the database function (type assertion for new RPC function)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_user_following', {
      target_user_id: targetUserId,
      cursor_created_at: cursorCreatedAt || null,
      cursor_id: cursorId || null,
      limit_param: limit + 1 // Fetch one extra to check hasMore
    });

    if (error) {
      console.error('Get following error:', error);
      return NextResponse.json(
        { error: 'Failed to get following' },
        { status: 500 }
      );
    }

    const users = data || [];
    const hasMore = users.length > limit;
    const returnedUsers = hasMore ? users.slice(0, limit) : users;

    // Build next cursor from last item
    const lastUser = returnedUsers[returnedUsers.length - 1];
    const nextCursor = hasMore && lastUser ? {
      created_at: lastUser.followed_at,
      id: lastUser.follow_id
    } : undefined;

    return NextResponse.json({
      users: returnedUsers,
      hasMore,
      nextCursor
    });
  } catch (error) {
    console.error('Following error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
