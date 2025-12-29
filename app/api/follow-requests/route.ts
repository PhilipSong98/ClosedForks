import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - List pending follow requests for current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Call the database function (type assertion for new RPC function)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_pending_follow_requests', {
      limit_param: limit
    });

    if (error) {
      console.error('Get follow requests error:', error);
      return NextResponse.json(
        { error: 'Failed to get follow requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      requests: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Follow requests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
