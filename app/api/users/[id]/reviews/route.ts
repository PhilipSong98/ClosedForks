import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// Define types for the database responses
interface Restaurant {
  id: string;
  name: string;
  address: string;
  city: string;
  cuisine: string | null;
  google_data: Record<string, unknown> | null;
  google_place_id: string | null;
  google_maps_url: string | null;
  lat: number | null;
  lng: number | null;
  price_level: number | null;
}

interface Review {
  id: string;
  author_id: string;
  restaurant_id: string;
  content: string;
  rating_overall: number;
  rating_food: number | null;
  rating_service: number | null;
  rating_atmosphere: number | null;
  rating_value: number | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  restaurants: Restaurant;
}

interface UserData {
  id: string;
  name: string | null;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

// GET /api/users/[id]/reviews - Get user's reviews
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    const cursorCreatedAt = searchParams.get('cursor_created_at');
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: userId } = await params;

    // Determine viewer's groups for visibility
    const { data: viewerGroups } = await supabase
      .from('user_groups')
      .select('group_id')
      .eq('user_id', user.id);
    const viewerGroupIds = (viewerGroups || []).map((g: { group_id: string }) => g.group_id);

    let reviews = null;
    let reviewsError = null;
    let hasVisibility = false; // Track if viewer can see profile user's reviews

    if (userId === user.id) {
      // Own profile: show all of the user's reviews regardless of group membership
      hasVisibility = true;
      let query = supabase
        .from('reviews')
        .select(`
          *,
          restaurants(
            id,
            name,
            address,
            city,
            cuisine,
            google_data,
            google_place_id,
            google_maps_url,
            lat,
            lng,
            price_level
          )
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false });
      if (cursorCreatedAt) {
        query = query.lt('created_at', cursorCreatedAt);
      } else {
        query = query.range(offset, offset + limit - 1);
      }
      const { data, error } = await query;
      reviews = data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reviewsError = error as any;
    } else if (viewerGroupIds.length > 0) {
      // AUTHOR-BASED VISIBILITY: Check if profile user shares any group with viewer
      // If they share a group, show ALL their reviews (not filtered by group_id)
      // Use service client to bypass RLS (users can only see their own group memberships)
      const serviceSupabaseForGroups = createServiceClient();
      const { data: profileUserGroups } = await serviceSupabaseForGroups
        .from('user_groups')
        .select('group_id')
        .eq('user_id', userId);
      const profileUserGroupIds = (profileUserGroups || []).map((g: { group_id: string }) => g.group_id);

      // Check if there's any overlap between viewer's groups and profile user's groups
      const sharedGroups = viewerGroupIds.filter(gid => profileUserGroupIds.includes(gid));

      if (sharedGroups.length === 0) {
        // No shared groups - can't see any reviews
        reviews = [];
      } else {
        // Shared groups exist - show ALL reviews from this user
        // Use service client to bypass RLS recursion (reviews RLS depends on user_groups RLS)
        hasVisibility = true;
        let query = serviceSupabaseForGroups
          .from('reviews')
          .select(`
            *,
            restaurants(
              id,
              name,
              address,
              city,
              cuisine,
              google_data,
              google_place_id,
              google_maps_url,
              lat,
              lng,
              price_level
            )
          `)
          .eq('author_id', userId)
          // REMOVED: .in('group_id', viewerGroupIds) - author-based visibility means ALL reviews
          .order('created_at', { ascending: false });
        if (cursorCreatedAt) {
          query = query.lt('created_at', cursorCreatedAt);
        } else {
          query = query.range(offset, offset + limit - 1);
        }
        const { data, error } = await query;
        reviews = data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        reviewsError = error as any;
      }
    } else {
      reviews = [];
    }

    if (reviewsError) {
      console.error('Error fetching user reviews:', reviewsError);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    // Get user data for the reviews - use service client to bypass RLS
    const serviceSupabase = createServiceClient();
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('id, name, full_name, email, avatar_url')
      .eq('id', userId)
      .single() as { data: UserData | null; error: unknown };

    if (userError) {
      console.error('Error fetching user data:', userError);
    }

    // Format reviews with author data
    const formattedReviews = (reviews || []).map((review: Review) => ({
      ...review,
      restaurant: review.restaurants,
      author: userData ? {
        id: userData.id,
        // Do not expose email as display name
        name: userData.full_name || userData.name || 'User',
        full_name: userData.full_name,
        // Keep raw email on the object but UI should not display it by default
        email: userData.email,
        avatar_url: userData.avatar_url,
      } : null,
    }));

    // Get total count for pagination
    // AUTHOR-BASED VISIBILITY: If viewer has visibility, count ALL reviews (not filtered by group_id)
    let totalCount = 0;
    let countError = null;
    if (hasVisibility) {
      const result = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId);
      totalCount = result.count || 0;
      countError = result.error;
    }

    if (countError) {
      console.error('Error fetching review count:', countError);
    }

    const hasMore = (formattedReviews || []).length === limit;
    const nextCursor = hasMore && formattedReviews.length > 0
      ? { created_at: formattedReviews[formattedReviews.length - 1].created_at, id: formattedReviews[formattedReviews.length - 1].id }
      : null;

    return NextResponse.json({
      reviews: formattedReviews,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
      nextCursor,
      hasMore
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
