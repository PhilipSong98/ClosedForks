'use client'

import React, { memo } from 'react';
import { SlidersHorizontal, Star, DollarSign, Calendar, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { REVIEW_TAGS, TAG_CATEGORY_CONFIG, PRICE_LEVELS } from '@/constants';
import { Separator } from '@/components/ui/separator';

export interface FilterState {
  tags: string[];
  minRating: number;
  priceLevels: number[];
  dateRange: 'all' | 'week' | 'month' | 'year';
  recommendedOnly: boolean;
  sortBy: 'recent' | 'rating' | 'price_low' | 'price_high';
}

interface FilterPillsProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  filteredCount?: number;
}

const FilterPills: React.FC<FilterPillsProps> = ({
  filters,
  onFiltersChange,
  filteredCount,
}) => {
  const [ratingOpen, setRatingOpen] = React.useState(false);
  const [priceOpen, setPriceOpen] = React.useState(false);
  const [tagsOpen, setTagsOpen] = React.useState(false);
  const [sortOpen, setSortOpen] = React.useState(false);

  const hasActiveFilters =
    filters.tags.length > 0 ||
    filters.minRating > 0 ||
    filters.priceLevels.length > 0 ||
    filters.dateRange !== 'all' ||
    filters.recommendedOnly;

  const clearAllFilters = () => {
    onFiltersChange({
      tags: [],
      minRating: 0,
      priceLevels: [],
      dateRange: 'all',
      recommendedOnly: false,
      sortBy: filters.sortBy,
    });
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  const togglePriceLevel = (level: string) => {
    const levelNum = parseInt(level);
    const newLevels = filters.priceLevels.includes(levelNum)
      ? filters.priceLevels.filter(l => l !== levelNum)
      : [...filters.priceLevels, levelNum];
    onFiltersChange({ ...filters, priceLevels: newLevels });
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {/* Rating Filter Pill */}
      <Popover open={ratingOpen} onOpenChange={setRatingOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={filters.minRating > 0 ? "default" : "outline"}
            className="rounded-full px-4 h-10 whitespace-nowrap"
          >
            <Star className="w-4 h-4 mr-2" />
            Rating
            {filters.minRating > 0 && (
              <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                {filters.minRating}+
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Minimum Rating</h4>
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
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onFiltersChange({ ...filters, minRating: 0 });
                  setRatingOpen(false);
                }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setRatingOpen(false)}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Price Filter Pill */}
      <Popover open={priceOpen} onOpenChange={setPriceOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={filters.priceLevels.length > 0 ? "default" : "outline"}
            className="rounded-full px-4 h-10 whitespace-nowrap"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Price
            {filters.priceLevels.length > 0 && (
              <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                {filters.priceLevels.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <h4 className="font-medium">Price Range</h4>
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
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onFiltersChange({ ...filters, priceLevels: [] });
                  setPriceOpen(false);
                }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setPriceOpen(false)}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Tags Filter Pill */}
      <Popover open={tagsOpen} onOpenChange={setTagsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={filters.tags.length > 0 ? "default" : "outline"}
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
        <PopoverContent className="w-96 max-h-[500px] overflow-y-auto">
          <div className="space-y-4">
            <h4 className="font-medium">Filter by Tags</h4>
            {Object.entries(REVIEW_TAGS).map(([category, tags]) => {
              const config = TAG_CATEGORY_CONFIG[category as keyof typeof REVIEW_TAGS];
              return (
                <div key={category}>
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <span>{config.icon}</span>
                    {category.replace('_', ' ')}
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {(tags as readonly string[]).map((tag) => (
                      <Badge
                        key={tag}
                        variant={filters.tags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer transition-colors"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Separator className="mt-3" />
                </div>
              );
            })}
            <div className="flex justify-end gap-2 sticky bottom-0 bg-background pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onFiltersChange({ ...filters, tags: [] });
                  setTagsOpen(false);
                }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setTagsOpen(false)}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Sort Pill */}
      <Popover open={sortOpen} onOpenChange={setSortOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="rounded-full px-4 h-10 whitespace-nowrap"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Sort: {filters.sortBy === 'recent' ? 'Recent' : filters.sortBy === 'rating' ? 'Top Rated' : filters.sortBy === 'price_low' ? '$→$$$$' : '$$$$→$'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60">
          <div className="space-y-2">
            <h4 className="font-medium mb-3">Sort By</h4>
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

      {/* Clear All Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full px-3 h-10"
          onClick={clearAllFilters}
        >
          <X className="w-4 h-4 mr-1" />
          Clear all
        </Button>
      )}

      {/* Results count */}
      {filteredCount !== undefined && (
        <span className="text-sm text-muted-foreground ml-2 whitespace-nowrap">
          {filteredCount} {filteredCount === 1 ? 'review' : 'reviews'}
        </span>
      )}
    </div>
  );
};

export default memo(FilterPills);
