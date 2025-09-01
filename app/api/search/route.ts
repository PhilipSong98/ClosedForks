import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  // Add Cache-Control headers
  const headers = {
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
  };

  // Return empty results if no query
  if (!query) {
    return NextResponse.json({ results: [] }, { headers });
  }

  try {
    const supabase = await createClient();
    const searchTerm = `%${query}%`;
    
    console.log("Search query:", query);

    // Search reviews - let RLS handle visibility
    const { data: reviewResults, error: reviewError } = await supabase
      .from("reviews")
      .select(`
        id,
        rating_overall,
        dish,
        review,
        text,
        tips,
        created_at,
        restaurant_id,
        restaurant:restaurants!restaurant_id (
          id,
          name,
          city,
          address
        )
      `)
      .or(
        `text.ilike.${searchTerm},review.ilike.${searchTerm},dish.ilike.${searchTerm},tips.ilike.${searchTerm}`
      )
      .order("created_at", { ascending: false })
      .limit(10) as { data: { id: string; rating_overall: number; dish: string; review: string; text: string; tips: string; created_at: string; restaurant_id: string; restaurant?: { id: string; name: string; city: string; address: string } }[] | null; error: Error | null };

    // Search restaurants - let RLS handle visibility
    const { data: restaurantResults, error: restaurantError } = await supabase
      .from("restaurants")
      .select(`
        id,
        name,
        city,
        address,
        cuisine,
        created_at
      `)
      .or(
        `name.ilike.${searchTerm},city.ilike.${searchTerm},address.ilike.${searchTerm}`
      )
      .order("created_at", { ascending: false })
      .limit(10) as { data: { id: string; name: string; city: string; address: string; cuisine: string | string[]; created_at: string }[] | null; error: Error | null };

    // Log errors but don't fail the request
    if (reviewError) {
      console.error("Review search error:", reviewError);
    }
    if (restaurantError) {
      console.error("Restaurant search error:", restaurantError);
    }

    // Transform review results
    const reviews = (reviewResults || []).map((review) => ({
      type: "review" as const,
      id: review.id,
      title: review.dish || "Review",
      subtitle: review.restaurant?.name || "Restaurant",
      description: review.review || review.text || review.tips || "",
      rating: review.rating_overall || undefined,
      createdAt: review.created_at,
      restaurantId: review.restaurant_id,
      tags: [],
    }));

    // Transform restaurant results
    const restaurants = (restaurantResults || []).map((restaurant) => {
      const cuisineText = Array.isArray(restaurant.cuisine) 
        ? restaurant.cuisine.join(", ") 
        : restaurant.cuisine || "Restaurant";

      return {
        type: "restaurant" as const,
        id: restaurant.id,
        name: restaurant.name, // Add name field for SearchBar
        title: restaurant.name,
        subtitle: `${restaurant.city || ""}, ${restaurant.address || ""}`.replace(/^,\s*/, ''), // Clean up leading comma
        address: `${restaurant.city || ""}, ${restaurant.address || ""}`.replace(/^,\s*/, ''),
        description: `${cuisineText} cuisine`,
        cuisine: cuisineText,
        rating: undefined,
        createdAt: restaurant.created_at,
        restaurantId: restaurant.id,
        tags: Array.isArray(restaurant.cuisine) ? restaurant.cuisine : [],
      };
    });

    // Combine results
    const results = [...reviews, ...restaurants];
    
    console.log("Search completed:", results.length, "results");
    
    return NextResponse.json({ results }, { headers });
    
  } catch (error) {
    console.error("Search API error:", error);
    // Always return valid JSON, never 500
    return NextResponse.json({ results: [] }, { headers });
  }
}