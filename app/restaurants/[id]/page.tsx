import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import RestaurantDetailClient from './restaurant-detail-client';
import { Restaurant, Review } from '@/types';

async function getRestaurant(id: string): Promise<Restaurant | null> {
  try {
    const supabase = await createClient();
    
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !restaurant) {
      console.error('Error fetching restaurant:', error);
      return null;
    }

    return restaurant;
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return null;
  }
}

async function getRestaurantReviews(restaurantId: string): Promise<Review[]> {
  try {
    const supabase = await createClient();
    
    // Use the same approach as home page - start from reviews with joins
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        *,
        author:users!reviews_author_id_fkey(id, full_name, email, avatar_url),
        restaurant:restaurants!reviews_restaurant_id_fkey(*)
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching restaurant reviews:', error);
      return [];
    }

    console.log(`Found ${reviews?.length || 0} reviews for restaurant ${restaurantId}`);

    return reviews || [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

interface RestaurantDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RestaurantDetailPage({ params }: RestaurantDetailPageProps) {
  const resolvedParams = await params;
  console.log('Restaurant ID:', resolvedParams.id);
  
  const restaurant = await getRestaurant(resolvedParams.id);
  console.log('Fetched restaurant:', restaurant);

  // Temporarily remove notFound() to debug
  // if (!restaurant) {
  //   notFound();
  // }

  const reviews = await getRestaurantReviews(resolvedParams.id);
  console.log('Fetched reviews:', reviews.length);

  return (
    <RestaurantDetailClient 
      restaurant={restaurant}
      initialReviews={reviews}
    />
  );
}