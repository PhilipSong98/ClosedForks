import { createClient } from '@/lib/supabase/server';
import RestaurantsClient from './restaurants-client';
import { Restaurant } from '@/types';

async function getAllRestaurants(): Promise<Restaurant[]> {
  try {
    const supabase = await createClient();
    
    // Server-side: Only fetch restaurants (no auth needed)
    // Client-side will handle review aggregation with proper auth
    const { data: allRestaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });

    if (restaurantsError) {
      console.error('Error fetching restaurants:', restaurantsError);
      return [];
    }

    // Return restaurants with placeholder values
    // The client will populate review data with proper authentication
    return (allRestaurants || []).map(restaurant => ({
      ...restaurant,
      avg_rating: 0,
      review_count: 0,
      aggregated_tags: []
    }));
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return [];
  }
}


export default async function RestaurantsPage() {
  // Fetch data server-side
  const allRestaurants = await getAllRestaurants();

  console.log(`Server-side: Found ${allRestaurants.length} restaurants (review data will be loaded client-side)`);

  return (
    <RestaurantsClient 
      initialRestaurants={allRestaurants}
    />
  );
}