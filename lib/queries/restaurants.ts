import { useQuery } from '@tanstack/react-query';
import { Restaurant, Review } from '@/types';

export function useRestaurants(options?: {
  city?: string;
  cuisine?: string[];
  limit?: number;
  sortBy?: 'rating' | 'created_at';
}) {
  return useQuery({
    queryKey: ['restaurants', options],
    queryFn: async (): Promise<Restaurant[]> => {
      const params = new URLSearchParams();
      if (options?.city) params.append('city', options.city);
      if (options?.cuisine?.length) {
        options.cuisine.forEach(c => params.append('cuisine', c));
      }
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.sortBy) params.append('sort', options.sortBy);

      const response = await fetch(`/api/restaurants?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch restaurants');
      }
      const data = await response.json();
      return data.restaurants || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useTopRestaurants(limit: number = 10) {
  return useQuery({
    queryKey: ['restaurants', 'top', limit],
    queryFn: async (): Promise<Restaurant[]> => {
      const response = await fetch(`/api/restaurants?sort=rating&limit=${limit}&has_reviews=true`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch top restaurants');
      }
      const data = await response.json();
      return data.restaurants || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useRestaurant(restaurantId: string) {
  return useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: async (): Promise<Restaurant> => {
      const response = await fetch(`/api/restaurants/${restaurantId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch restaurant');
      }
      const data = await response.json();
      return data.restaurant;
    },
    enabled: !!restaurantId,
  });
}

export function useRestaurantsWithReviews(options?: { enabled?: boolean }) {
  const restaurantsQuery = useRestaurants();
  const reviewsQuery = useQuery({
    queryKey: ['reviews'],
    queryFn: async (): Promise<Review[]> => {
      const response = await fetch('/api/reviews', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      const data = await response.json();
      return data.reviews || [];
    },
    enabled: options?.enabled !== false, // Default to enabled unless explicitly disabled
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const combinedData = {
    data: undefined as Restaurant[] | undefined,
    isLoading: restaurantsQuery.isLoading || reviewsQuery.isLoading,
    error: restaurantsQuery.error || reviewsQuery.error,
    isSuccess: restaurantsQuery.isSuccess && reviewsQuery.isSuccess,
    isError: restaurantsQuery.isError || reviewsQuery.isError,
  };

  // Combine restaurants with review data when both queries are successful
  if (restaurantsQuery.data && reviewsQuery.data) {
    const restaurants = restaurantsQuery.data;
    const reviews = reviewsQuery.data;

    // Group reviews by restaurant_id
    const reviewsByRestaurant = reviews.reduce((acc: Record<string, Review[]>, review: Review) => {
      const restaurantId = review.restaurant_id;
      if (!acc[restaurantId]) {
        acc[restaurantId] = [];
      }
      acc[restaurantId].push(review);
      return acc;
    }, {} as Record<string, Review[]>);

    // Update restaurants with review data
    const updatedRestaurants = restaurants.map(restaurant => {
      const restaurantReviews = reviewsByRestaurant[restaurant.id] || [];
      
      // Calculate actual average rating from individual review.rating_overall values
      const ratings = restaurantReviews
        .map((r: Review) => r.rating_overall)
        .filter((r: number | undefined) => r != null) as number[];
      const avg_rating = ratings.length > 0 
        ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10
        : 0;
      
      // Aggregate unique tags from all reviews
      const allTags = restaurantReviews
        .flatMap((r: Review) => r.tags || [])
        .filter((tag: string, index: number, arr: string[]) => arr.indexOf(tag) === index);
      
      return {
        ...restaurant,
        avg_rating,
        review_count: restaurantReviews.length,
        aggregated_tags: allTags
      };
    });

    combinedData.data = updatedRestaurants;
  }

  return combinedData;
}