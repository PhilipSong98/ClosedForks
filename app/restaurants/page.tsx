import { createClient } from '@/lib/supabase/server';
import RestaurantsClient from './restaurants-client';
import { Restaurant } from '@/types';

async function getAllRestaurants(): Promise<Restaurant[]> {
  try {
    const supabase = await createClient();
    
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select(`
        *,
        reviews (
          rating_overall,
          tags
        )
      `)
      .order('created_at', { ascending: false });

    // Process aggregated data for each restaurant
    const processedRestaurants = restaurants?.map(restaurant => {
      const reviews = restaurant.reviews || [];
      
      // Calculate actual average rating
      const ratings = reviews
        .map(r => r.rating_overall)
        .filter(r => r != null);
      const avg_rating = ratings.length > 0 
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0;
      
      // Aggregate unique tags from all reviews
      const allTags = reviews
        .flatMap(r => r.tags || [])
        .filter((tag, index, arr) => arr.indexOf(tag) === index); // Remove duplicates
      
      return {
        ...restaurant,
        reviews: undefined, // Remove reviews from final object
        avg_rating,
        review_count: reviews.length,
        aggregated_tags: allTags
      };
    }) || [];

    return processedRestaurants;
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return [];
  }
}


export default async function RestaurantsPage() {
  // Fetch data server-side
  const allRestaurants = await getAllRestaurants();

  return (
    <RestaurantsClient 
      initialRestaurants={allRestaurants}
    />
  );
}