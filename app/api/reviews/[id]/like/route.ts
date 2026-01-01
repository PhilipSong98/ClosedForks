import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Define types for the database responses
interface UserLike {
  review_id: string;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const reviewId = resolvedParams.id;

    // Toggle like atomically via RPC
    // Note: Review visibility/existence is validated by toggle_review_like RPC function
    // which is SECURITY DEFINER and handles group membership checks
    // Note: RPC functions returning TABLE return an array of rows
    const { data: toggleResult, error: toggleError } = await (supabase as unknown as {
      rpc: (name: string, params: Record<string, unknown>) => Promise<{ data: Array<{ is_liked: boolean; like_count: number }> | null; error: unknown }>
    }).rpc('toggle_review_like', {
      review_id_param: reviewId,
      user_id_param: user.id
    });

    if (toggleError || !toggleResult || toggleResult.length === 0) {
      console.error('Error toggling like:', toggleError);
      const errorMessage = typeof toggleError === 'object' && toggleError !== null && 'message' in toggleError
        ? String((toggleError as { message: string }).message)
        : '';
      if (errorMessage.includes('not found') || errorMessage.includes('permission') || !toggleResult || toggleResult.length === 0) {
        return NextResponse.json(
          { error: 'Review not found or not accessible' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to toggle like' },
        { status: 500 }
      );
    }

    // Extract the first (and only) row from the result
    const result = toggleResult[0];

    return NextResponse.json({
      success: true,
      isLiked: result.is_liked,
      likeCount: result.like_count,
      message: result.is_liked ? 'Review liked' : 'Review unliked'
    });

  } catch (error) {
    console.error('Unexpected error in like endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const reviewId = resolvedParams.id;

    // Get like status and count using review_likes table (avoids RLS issues with reviews table)
    // Check if user has liked this review
    const { data: userLike } = await supabase
      .from('review_likes')
      .select('review_id')
      .eq('review_id', reviewId)
      .eq('user_id', user.id)
      .maybeSingle() as { data: UserLike | null; error: Error | null };

    const isLiked = !!userLike;

    // Get like count by counting review_likes for this review
    const { count: likeCount } = await supabase
      .from('review_likes')
      .select('*', { count: 'exact', head: true })
      .eq('review_id', reviewId);

    return NextResponse.json({
      isLiked,
      likeCount: likeCount || 0
    });

  } catch (error) {
    console.error('Unexpected error in get like status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
