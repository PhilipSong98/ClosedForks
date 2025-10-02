'use client'

import React, { memo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Search, SlidersHorizontal, Tag, Star, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { REVIEW_TAGS, TAG_CATEGORY_CONFIG, PRICE_LEVELS } from '@/constants';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const GlobalSearchModal = dynamic(
  () => import("@/components/search/GlobalSearchModal").then(mod => ({ default: mod.GlobalSearchModal })),
  { ssr: false }
);

export interface FilterState {
  tags: string[];
  minRating: number;
  priceLevels: number[];
  dateRange: 'all' | 'week' | 'month' | 'year';
  recommendedOnly: boolean;
  sortBy: 'recent' | 'rating' | 'price_low' | 'price_high';
}

interface SearchFilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  filteredCount?: number;
}

const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  filters,
  onFiltersChange,
  filteredCount,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

  const hasActiveFilters =
    filters.tags.length > 0 ||
    filters.minRating > 0 ||
    filters.priceLevels.length > 0 ||
    filters.dateRange !== 'all' ||
    filters.recommendedOnly;

  const activeFilterCount =
    filters.tags.length +
    (filters.minRating > 0 ? 1 : 0) +
    filters.priceLevels.length +
    (filters.dateRange !== 'all' ? 1 : 0) +
    (filters.recommendedOnly ? 1 : 0);

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      tags: [],
      minRating: 0,
      priceLevels: [],
      dateRange: 'all',
      recommendedOnly: false,
      sortBy: filters.sortBy,
    });
    setMoreFiltersOpen(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-center gap-3 w-full">
        {/* Search Bar */}
        <div
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center flex-1 max-w-sm px-4 py-2.5 rounded-full border border-border bg-background hover:shadow-md transition-shadow cursor-pointer"
        >
          <Search className="w-4 h-4 text-muted-foreground mr-3 flex-shrink-0" />
          <span className="text-sm text-muted-foreground truncate">Search restaurants...</span>
        </div>

        {/* Filter Pills Container */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {/* Search Icon Button */}
          <Button
            size="sm"
            className="rounded-full h-10 w-10 p-0 bg-primary flex-shrink-0"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="w-4 h-4" />
          </Button>

          {/* Sort */}
          <Popover open={sortOpen} onOpenChange={setSortOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full px-4 h-10 whitespace-nowrap border-border hover:border-foreground transition-colors"
              >
                Sort
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52" align="start">
              <div className="space-y-2">
                <Select
                  value={filters.sortBy}
                  onValueChange={(value: FilterState['sortBy']) => {
                    onFiltersChange({ ...filters, sortBy: value });
                    setSortOpen(false);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recent</SelectItem>
                    <SelectItem value="rating">Top Rated</SelectItem>
                    <SelectItem value="price_low">$ → $$$$</SelectItem>
                    <SelectItem value="price_high">$$$$ → $</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>

          {/* Tags */}
          <Popover open={tagsOpen} onOpenChange={setTagsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={filters.tags.length > 0 ? "default" : "outline"}
                size="sm"
                className="rounded-full px-4 h-10 whitespace-nowrap"
              >
                <Tag className="w-4 h-4 mr-2" />
                Tags
                {filters.tags.length > 0 && (
                  <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                    {filters.tags.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 max-h-96 overflow-y-auto" align="start">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Filter by Tags</h4>
                {Object.entries(REVIEW_TAGS).slice(0, 2).map(([category, tags]) => {
                  const config = TAG_CATEGORY_CONFIG[category as keyof typeof REVIEW_TAGS];
                  return (
                    <div key={category}>
                      <h5 className="text-xs font-medium mb-2 flex items-center gap-1.5 text-muted-foreground">
                        <span>{config.icon}</span>
                        {category.replace('_', ' ')}
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {(tags as readonly string[]).slice(0, 8).map((tag) => (
                          <Badge
                            key={tag}
                            variant={filters.tags.includes(tag) ? "default" : "outline"}
                            className="cursor-pointer text-xs"
                            onClick={() => toggleTag(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <Button
                  variant="link"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    setTagsOpen(false);
                    setMoreFiltersOpen(true);
                  }}
                >
                  View all tags
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* More Filters Button */}
          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            size="sm"
            className="rounded-full px-4 h-10 whitespace-nowrap"
            onClick={() => setMoreFiltersOpen(true)}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            More filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>


      {/* Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* More Filters Dialog */}
      <Dialog open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Filters</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Rating Filter */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Minimum Rating
              </h4>
              <Slider
                value={[filters.minRating]}
                onValueChange={([value]) => onFiltersChange({ ...filters, minRating: value })}
                min={0}
                max={5}
                step={0.5}
                className="mb-2"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Any</span>
                <span className="font-medium text-foreground">{filters.minRating || 'Any'}</span>
                <span>5 stars</span>
              </div>
            </div>

            <Separator />

            {/* Price Levels */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Price Range
              </h4>
              <ToggleGroup
                type="multiple"
                value={filters.priceLevels.map(String)}
                onValueChange={(value) => {
                  onFiltersChange({
                    ...filters,
                    priceLevels: value.map(Number),
                  });
                }}
                className="grid grid-cols-4 gap-2"
              >
                {[1, 2, 3, 4].map((level) => (
                  <ToggleGroupItem
                    key={level}
                    value={String(level)}
                    className="rounded-lg"
                  >
                    {PRICE_LEVELS[level as keyof typeof PRICE_LEVELS]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <Separator />

            {/* All Tags */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </h4>
              {Object.entries(REVIEW_TAGS).map(([category, tags]) => {
                const config = TAG_CATEGORY_CONFIG[category as keyof typeof REVIEW_TAGS];
                return (
                  <div key={category} className="mb-4">
                    <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <span>{config.icon}</span>
                      {category.replace('_', ' ')}
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {(tags as readonly string[]).map((tag) => (
                        <Badge
                          key={tag}
                          variant={filters.tags.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleTag(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="ghost"
              onClick={clearAllFilters}
            >
              Clear all
            </Button>
            <Button
              onClick={() => setMoreFiltersOpen(false)}
            >
              Show {filteredCount} results
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(SearchFilterBar);
