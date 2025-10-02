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
