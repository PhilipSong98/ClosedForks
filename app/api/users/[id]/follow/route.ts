import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST - Send follow request
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: targetUserId } = await params;

    // Prevent self-following
    if (user.id === targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // Call the database function (type assertion for new RPC function)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('send_follow_request', {
      target_user_id: targetUserId
    });

    if (error) {
      console.error('Send follow request error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to send follow request' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Follow request error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Unfollow or cancel pending request
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: targetUserId } = await params;

    // First try to unfollow (if currently following)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: unfollowData, error: unfollowError } = await (supabase.rpc as any)('unfollow_user', {
      target_user_id: targetUserId
    });

    if (!unfollowError && unfollowData?.success) {
      return NextResponse.json({ success: true, message: 'Unfollowed successfully' });
    }

    // If not following, try to cancel pending request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cancelData, error: cancelError } = await (supabase.rpc as any)('cancel_follow_request', {
      target_user_id: targetUserId
    });

    if (cancelError) {
      console.error('Cancel follow request error:', cancelError);
      return NextResponse.json(
        { success: false, error: 'Failed to unfollow or cancel request' },
        { status: 500 }
      );
    }

    return NextResponse.json(cancelData);
  } catch (error) {
    console.error('Unfollow error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get follow status
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: targetUserId } = await params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_follow_status', {
      target_user_id: targetUserId
    });

    if (error) {
      console.error('Get follow status error:', error);
      return NextResponse.json(
        { error: 'Failed to get follow status' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Follow status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
