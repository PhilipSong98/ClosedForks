import { createClient } from '@/lib/supabase/server';
// import { notFound } from 'next/navigation'; // Currently unused
import RestaurantDetailClient from './restaurant-detail-client';
import type { Restaurant, Review } from '@/types';

async function fetchRestaurantData(restaurantId: string): Promise<{
  restaurant: Restaurant | null;
  reviews: Review[];
}> {
  try {
    const supabase = await createClient();

    const [restaurantResponse, reviewsResponse] = await Promise.all([
      supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single(),
      supabase
        .from('reviews')
        .select('*, author:users(id, name, full_name, email, avatar_url)')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false }),
    ]);

    const { data: restaurant, error: restaurantError } = restaurantResponse;
    if (restaurantError) {
      console.error('Error fetching restaurant:', restaurantError);
    }

    const { data: reviewsData, error: reviewsError } = reviewsResponse as {
      data: Review[] | null;
      error: Error | null;
    };

    if (reviewsError) {
      console.error('Error fetching restaurant reviews:', reviewsError);
    }

    return {
      restaurant: restaurant ?? null,
      reviews: reviewsData ?? [],
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

export default async function RestaurantDetailPage({ params }: RestaurantDetailPageProps) {
  const { id } = await params;
  const { restaurant, reviews } = await fetchRestaurantData(id);

  // Temporarily remove notFound() to debug
  // if (!restaurant) {
  //   notFound();
  // }

  return (
    <RestaurantDetailClient 
      restaurant={restaurant}
      initialReviews={reviews}
    />
  );
}
