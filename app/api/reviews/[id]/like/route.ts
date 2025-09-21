import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Define types for the database responses
interface ReviewLikeCount {
  like_count: number;
}

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

    // Check if review exists
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id')
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Toggle like atomically via RPC
    const { data: toggleResult, error: toggleError } = await (supabase as unknown as {
      rpc: (name: string, params: Record<string, unknown>) => Promise<{ data: { is_liked: boolean; like_count: number } | null; error: unknown }>
    }).rpc('toggle_review_like', {
      review_id_param: reviewId,
      user_id_param: user.id
    });

    if (toggleError || !toggleResult) {
      console.error('Error toggling like:', toggleError);
      return NextResponse.json(
        { error: 'Failed to toggle like' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      isLiked: toggleResult.is_liked,
      likeCount: toggleResult.like_count,
      message: toggleResult.is_liked ? 'Review liked' : 'Review unliked'
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

    // Get like count and user's like status

    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('like_count')
      .eq('id', reviewId)
      .single() as { data: ReviewLikeCount | null; error: Error | null };

    if (reviewError || !review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check if user has liked this review

    const { data: userLike, error: likeError } = await supabase
      .from('review_likes')
      .select('review_id')
      .eq('review_id', reviewId)
      .eq('user_id', user.id)
      .single() as { data: UserLike | null; error: Error | null };

    const isLiked = !!userLike && !likeError;

    return NextResponse.json({
      isLiked,
      likeCount: review.like_count || 0
    });

  } catch (error) {
    console.error('Unexpected error in get like status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
