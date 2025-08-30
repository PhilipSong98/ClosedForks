import { createClient } from '@/lib/supabase/server';
import HomeClient from './home-client';
import { Review } from '@/types';

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
      .limit(50);

    return reviews || [];
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
