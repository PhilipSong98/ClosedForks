import { createClient } from '@/lib/supabase/server';
import HomeClient from './home-client';
import { Review, Restaurant } from '@/types';

async function getRecentReviews(): Promise<Review[]> {
  try {
    const supabase = await createClient();
    
    const { data: reviews } = await supabase
      .from('reviews')
      .select(`
        *,
        author:users!reviews_author_id_fkey(id, name, email, avatar_url),
        restaurant:restaurants!reviews_restaurant_id_fkey(*)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    return reviews || [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

async function getTopRestaurants(): Promise<Restaurant[]> {
  try {
    const supabase = await createClient();
    
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('*')
      .not('avg_rating', 'is', null)
      .order('avg_rating', { ascending: false })
      .limit(8);

    return restaurants || [];
  } catch (error) {
    console.error('Error fetching top restaurants:', error);
    return [];
  }
}

export default async function Home() {
  // Fetch data server-side
  const [reviews, topRestaurants] = await Promise.all([
    getRecentReviews(),
    getTopRestaurants(),
  ]);

  return (
    <HomeClient 
      initialReviews={reviews}
      initialTopRestaurants={topRestaurants}
    />
  );
}
