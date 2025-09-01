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

    // Check if user has already liked this review
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('review_likes')
      .select('review_id, user_id')
      .eq('review_id', reviewId)
      .eq('user_id', user.id)
      .single();

    if (likeCheckError && likeCheckError.code !== 'PGRST116') {
      console.error('Error checking existing like:', likeCheckError);
      return NextResponse.json(
        { error: 'Failed to check like status' },
        { status: 500 }
      );
    }

    let isLiked = false;
    let likeCount = 0;

    if (existingLike) {
      // Unlike the review
      const { error: deleteError } = await supabase
        .from('review_likes')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error unliking review:', deleteError);
        return NextResponse.json(
          { error: 'Failed to unlike review' },
          { status: 500 }
        );
      }
      isLiked = false;
    } else {
      // Like the review

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase.from('review_likes') as any)
        .insert({
          review_id: reviewId,
          user_id: user.id
        });

      if (insertError) {
        console.error('Error liking review:', insertError);
        return NextResponse.json(
          { error: 'Failed to like review' },
          { status: 500 }
        );
      }
      isLiked = true;
    }

    // Get updated like count
    const { data: reviewWithCount, error: countError } = await supabase
      .from('reviews')
      .select('like_count')
      .eq('id', reviewId)
      .single() as { data: ReviewLikeCount | null; error: Error | null };

    if (countError) {
      console.error('Error fetching like count:', countError);
    } else if (reviewWithCount) {
      likeCount = reviewWithCount.like_count || 0;
    }

    return NextResponse.json({
      success: true,
      isLiked,
      likeCount,
      message: isLiked ? 'Review liked' : 'Review unliked'
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