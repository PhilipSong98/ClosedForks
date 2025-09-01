import { createClient } from '@/lib/supabase/server';
import HomeClient from './home-client';


// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRecentReviews(): Promise<any[]> {
  try {
    const supabase = await createClient();
    
    // First get the reviews
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50) as { data: { author_id: string; restaurant_id: string; [key: string]: unknown }[] | null; error: Error | null };

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
      .in('id', authorIds) as { data: { id: string; name: string; full_name: string; email: string; avatar_url?: string }[] | null; error: Error | null };

      // Fetch restaurants
      const restaurantIds = reviewsWithData.map(review => review.restaurant_id);
          const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('*')
      .in('id', restaurantIds) as { data: { id: string; [key: string]: unknown }[] | null; error: Error | null };

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
