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
    
    // Simplified query - first get just the reviews
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }

    // If we have reviews, let's get the user data separately for now
    if (reviews && reviews.length > 0) {
      const reviewsWithUsers = await Promise.all(
        reviews.map(async (review) => {
          const { data: user } = await supabase
            .from('users')
            .select('id, full_name, email, avatar_url')
            .eq('id', review.author_id)
            .single();
          
          return {
            ...review,
            author: user
          };
        })
      );
      
      return reviewsWithUsers;
    }

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