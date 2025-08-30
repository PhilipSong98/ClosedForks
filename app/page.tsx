import { createClient } from '@/lib/supabase/server';
import HomeClient from './home-client';
import { Review } from '@/types';

async function getRecentReviews(): Promise<Review[]> {
  try {
    const supabase = await createClient();
    
    // First get the reviews
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }

    // If we have reviews, fetch the user and restaurant data
    let reviewsWithData = reviews || [];
    if (reviewsWithData.length > 0) {
      // Fetch users
      const authorIds = reviewsWithData.map(review => review.author_id);
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, full_name, email, avatar_url')
        .in('id', authorIds);

      // Fetch restaurants
      const restaurantIds = reviewsWithData.map(review => review.restaurant_id);
      const { data: restaurants, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .in('id', restaurantIds);

      if (!usersError && users && !restaurantsError && restaurants) {
        // Map user and restaurant data to reviews
        reviewsWithData = reviewsWithData.map(review => ({
          ...review,
          author: users.find(user => user.id === review.author_id),
          restaurant: restaurants.find(restaurant => restaurant.id === review.restaurant_id)
        }));
      }
    }

    return reviewsWithData || [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

export default async function Home() {
  // Fetch recent reviews server-side
  const reviews = await getRecentReviews();

  return (
    <HomeClient 
      initialReviews={reviews}
    />
  );
}
