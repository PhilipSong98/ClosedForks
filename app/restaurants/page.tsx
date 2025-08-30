import { createClient } from '@/lib/supabase/server';
import RestaurantsClient from './restaurants-client';
import { Restaurant } from '@/types';

async function getAllRestaurants(): Promise<Restaurant[]> {
  try {
    const supabase = await createClient();
    
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });

    return restaurants || [];
  } catch (error) {
    console.error('Error fetching restaurants:', error);
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

export default async function RestaurantsPage() {
  // Fetch data server-side
  const [allRestaurants, topRestaurants] = await Promise.all([
    getAllRestaurants(),
    getTopRestaurants(),
  ]);

  return (
    <RestaurantsClient 
      initialRestaurants={allRestaurants}
      initialTopRestaurants={topRestaurants}
    />
  );
}