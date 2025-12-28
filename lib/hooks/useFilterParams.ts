'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import type { FilterState } from '@/components/filters/SearchFilterBar';

/**
 * Default filter state used when no URL params are present
 */
const DEFAULT_FILTERS: FilterState = {
  tags: [],
  minRating: 0,
  priceLevels: [],
  dateRange: 'all',
  recommendedOnly: false,
  sortBy: 'recent',
};

/**
 * Hook to sync filter state with URL query parameters.
 *
 * Benefits:
 * - Shareable filtered views (users can share URLs with filters)
 * - Browser back/forward button support
 * - Filter persistence on page refresh
 * - SEO-friendly URLs
 *
 * @param defaultSortBy - Override the default sort order (e.g., 'rating' for restaurants)
 * @returns { filters, setFilters, clearFilters }
 */
export function useFilterParams(defaultSortBy: FilterState['sortBy'] = 'recent') {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse filters from URL query parameters
  const filters = useMemo<FilterState>(() => {
    const tags = searchParams.get('tags');
    const minRating = searchParams.get('minRating');
    const priceLevels = searchParams.get('price');
    const dateRange = searchParams.get('date');
    const recommendedOnly = searchParams.get('recommended');
    const sortBy = searchParams.get('sort');

    return {
      tags: tags ? tags.split(',').filter(Boolean) : [],
      minRating: minRating ? parseFloat(minRating) : 0,
      priceLevels: priceLevels ? priceLevels.split(',').map(Number).filter(n => !isNaN(n)) : [],
      dateRange: (dateRange as FilterState['dateRange']) || 'all',
      recommendedOnly: recommendedOnly === 'true',
      sortBy: (sortBy as FilterState['sortBy']) || defaultSortBy,
    };
  }, [searchParams, defaultSortBy]);

  // Update URL with new filter state
  const setFilters = useCallback((newFilters: FilterState) => {
    const params = new URLSearchParams();

    // Only add non-default values to keep URLs clean
    if (newFilters.tags.length > 0) {
      params.set('tags', newFilters.tags.join(','));
    }
    if (newFilters.minRating > 0) {
      params.set('minRating', newFilters.minRating.toString());
    }
    if (newFilters.priceLevels.length > 0) {
      params.set('price', newFilters.priceLevels.join(','));
    }
    if (newFilters.dateRange !== 'all') {
      params.set('date', newFilters.dateRange);
    }
    if (newFilters.recommendedOnly) {
      params.set('recommended', 'true');
    }
    if (newFilters.sortBy !== defaultSortBy) {
      params.set('sort', newFilters.sortBy);
    }

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

    // Use replace to avoid polluting browser history with every filter change
    router.replace(newUrl, { scroll: false });
  }, [pathname, router, defaultSortBy]);

  // Clear all filters and reset URL
  const clearFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS, sortBy: defaultSortBy });
  }, [setFilters, defaultSortBy]);

  return {
    filters,
    setFilters,
    clearFilters,
  };
}

export default useFilterParams;
