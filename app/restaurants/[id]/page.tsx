import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import RestaurantDetailClient from './restaurant-detail-client';
import type { Restaurant, Review } from '@/types';

// Revalidate this page every 5 minutes
export const revalidate = 300;

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: RestaurantDetailPageProps) {
  const { id } = await params;
  const { restaurant } = await fetchRestaurantData(id);

  if (!restaurant) {
    return {
      title: 'Restaurant Not Found',
      description: 'The restaurant you are looking for could not be found.',
    };
  }

  const reviewCount = restaurant.review_count ?? 0;
  const avgRating = restaurant.avg_rating ?? 0;

  return {
    title: `${restaurant.name} - DineCircle`,
    description: `${restaurant.name} in ${restaurant.city}. ${reviewCount} reviews with ${avgRating.toFixed(1)} average rating. ${restaurant.cuisine.slice(0, 3).join(', ')}`,
    openGraph: {
      title: restaurant.name,
      description: `Discover reviews for ${restaurant.name}`,
      type: 'website',
    },
  };
}

// Type for the optimized RPC function response
interface OptimizedReviewResponse {
  review_id: string;
  restaurant_id: string;
  author_id: string;
  rating_overall: number;
  dish: string;
  review_text: string;
  recommend: boolean;
  tips: string | null;
  tags: string[];
  visit_date: string;
  price_per_person: number | null;
  created_at: string;
  updated_at: string;
  like_count: number;
  group_id: string;
  author_name: string;
  author_full_name: string | null;
  author_email: string;
  author_avatar_url: string | null;
  restaurant_name: string;
  restaurant_city: string;
  restaurant_address: string;
  restaurant_price_level: number | null;
  restaurant_cuisine: string[];
  restaurant_google_place_id: string | null;
  restaurant_google_maps_url: string | null;
  restaurant_google_data: object | null;
  restaurant_lat: number | null;
  restaurant_lng: number | null;
  restaurant_avg_rating: number;
  restaurant_review_count: number;
  is_liked_by_user: boolean;
}

async function fetchRestaurantData(restaurantId: string): Promise<{
  restaurant: Restaurant | null;
  reviews: Review[];
}> {
  try {
    const supabase = await createClient();

    // Get current user for the optimized function
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch restaurant data
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (restaurantError) {
      console.error('Error fetching restaurant:', restaurantError);
    }

    // Use optimized SECURITY DEFINER function to fetch reviews
    // This bypasses RLS on the users table and ensures author data is always returned
    let reviews: Review[] = [];

    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: reviewsData, error: reviewsError } = await (supabase as any).rpc(
        'get_user_feed_optimized',
        {
          user_id_param: user.id,
          restaurant_id_filter: restaurantId,
          limit_param: 50,
        }
      );

      if (reviewsError) {
        console.error('Error fetching restaurant reviews:', reviewsError);
      } else if (reviewsData) {
        // Map the optimized response to the Review type format
        reviews = (reviewsData as OptimizedReviewResponse[]).map((r) => ({
          id: r.review_id,
          restaurant_id: r.restaurant_id,
          author_id: r.author_id,
          rating_overall: r.rating_overall,
          dish: r.dish,
          review: r.review_text,
          recommend: r.recommend,
          tips: r.tips ?? undefined,
          tags: r.tags || [],
          visit_date: r.visit_date,
          price_per_person: r.price_per_person ?? undefined,
          created_at: r.created_at,
          updated_at: r.updated_at,
          like_count: r.like_count,
          group_id: r.group_id,
          visibility: 'my_circles' as const,
          isLikedByUser: r.is_liked_by_user,
          author: {
            id: r.author_id,
            name: r.author_name,
            full_name: r.author_full_name ?? undefined,
            email: r.author_email,
            avatar_url: r.author_avatar_url ?? undefined,
            role: 'user' as const,
            created_at: r.created_at, // Use review created_at as fallback
          },
        }));
      }
    }

    return {
      restaurant: restaurant ?? null,
      reviews,
    };
  } catch (error) {
    console.error('Unexpected error fetching restaurant data:', error);
    return {
      restaurant: null,
      reviews: [],
    };
  }
}

interface RestaurantDetailPageProps {
  params: Promise<{ id: string }>;
}

// Note: generateStaticParams removed because it requires cookies in createClient()
// Restaurant pages will be dynamically generated with ISR (revalidate: 300)

export default async function RestaurantDetailPage({ params }: RestaurantDetailPageProps) {
  const { id } = await params;
  const { restaurant, reviews } = await fetchRestaurantData(id);

  if (!restaurant) {
    notFound();
  }

  return (
    <RestaurantDetailClient
      restaurant={restaurant}
      initialReviews={reviews}
    />
  );
}
