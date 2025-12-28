/**
 * Centralized React Query configuration.
 *
 * This file standardizes cache timing across all queries to ensure
 * consistent behavior and easier maintenance.
 *
 * Terminology:
 * - staleTime: How long data is considered fresh (no background refetch)
 * - gcTime: How long unused data stays in cache before garbage collection
 */

/**
 * Cache configurations by data volatility level.
 *
 * REAL_TIME: Data that changes frequently (likes, live counts)
 * - Short stale time, quick garbage collection
 *
 * DYNAMIC: User-generated content that updates regularly (reviews, feed)
 * - Moderate caching, good balance of freshness and performance
 *
 * STABLE: Data that changes occasionally (user profiles, groups)
 * - Longer cache times, fewer refetches
 *
 * STATIC: Reference data that rarely changes (restaurant info, tags)
 * - Maximum caching for best performance
 */
export const QUERY_CACHE_CONFIG = {
  /** For frequently changing data like likes, live counts */
  REAL_TIME: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  },

  /** For user-generated content that updates regularly */
  DYNAMIC: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },

  /** For data that changes occasionally */
  STABLE: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  },

  /** For reference data that rarely changes */
  STATIC: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  },
} as const;

/**
 * Query key factories for consistent key generation.
 *
 * Usage:
 *   queryKey: QUERY_KEYS.reviews.all()
 *   queryKey: QUERY_KEYS.reviews.byRestaurant(restaurantId)
 */
export const QUERY_KEYS = {
  reviews: {
    all: () => ['reviews'] as const,
    feed: () => ['reviews', 'feed'] as const,
    byRestaurant: (restaurantId: string) => ['reviews', 'restaurant', restaurantId] as const,
    byUser: (userId: string) => ['reviews', 'user', userId] as const,
    byGroup: (groupId: string) => ['reviews', 'group', groupId] as const,
  },

  restaurants: {
    all: () => ['restaurants'] as const,
    feed: () => ['restaurants', 'feed'] as const,
    detail: (id: string) => ['restaurants', 'detail', id] as const,
    search: (query: string) => ['restaurants', 'search', query] as const,
  },

  users: {
    profile: (userId?: string) => userId ? ['users', 'profile', userId] : ['users', 'profile'] as const,
    likedReviews: (userId: string) => ['users', 'likedReviews', userId] as const,
    toEatList: (userId: string) => ['users', 'toEatList', userId] as const,
    favorites: (userId: string) => ['users', 'favorites', userId] as const,
  },

  groups: {
    all: () => ['groups'] as const,
    detail: (groupId: string) => ['groups', 'detail', groupId] as const,
    members: (groupId: string) => ['groups', 'members', groupId] as const,
  },
} as const;

/**
 * Default options for the QueryClient.
 * These can be overridden per-query as needed.
 */
export const DEFAULT_QUERY_OPTIONS = {
  queries: {
    staleTime: QUERY_CACHE_CONFIG.DYNAMIC.staleTime,
    gcTime: QUERY_CACHE_CONFIG.DYNAMIC.gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  },
  mutations: {
    retry: 0,
  },
} as const;

export default QUERY_CACHE_CONFIG;
