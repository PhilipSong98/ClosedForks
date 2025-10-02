'use client'

import React, { useMemo, useState, memo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  DollarSign,
  Filter,
  SlidersHorizontal,
  Star,
  Clock,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { REVIEW_TAGS, TAG_CATEGORY_CONFIG, PRICE_LEVELS } from '@/constants';

export interface FilterState {
  tags: string[];
  minRating: number;
  priceLevels: number[]; // 1-4 corresponding to $, $$, $$$, $$$$
  dateRange: 'all' | 'week' | 'month' | 'year';
  recommendedOnly: boolean;
  sortBy: 'recent' | 'rating' | 'price_low' | 'price_high';
}

interface EnhancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  reviewCount?: number;
  filteredCount?: number;
  showAllFilters?: boolean;
  defaultExpanded?: boolean;
  defaultSortBy?: FilterState['sortBy'];
}

const sortOptions: Array<{ value: FilterState['sortBy']; label: string }> = [
  { value: 'recent', label: 'Recent' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price_low', label: '$→$$$$' },
  { value: 'price_high', label: '$$$$→$' },
];

const EnhancedFilters: React.FC<EnhancedFiltersProps> = ({
  filters,
  onFiltersChange,
  reviewCount,
  filteredCount,
  showAllFilters = false,
  defaultExpanded = false,
  defaultSortBy = 'recent',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || showAllFilters);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const activeFilterCount = useMemo(
    () =>
      filters.tags.length +
      (filters.minRating > 0 ? 1 : 0) +
      (filters.priceLevels.length > 0 ? 1 : 0) +
      (filters.dateRange !== 'all' ? 1 : 0) +
      (filters.recommendedOnly ? 1 : 0),
    [filters],
  );

  const allowToggle = !showAllFilters;
  const shouldRenderDetails = showAllFilters || isExpanded;

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];

    onFiltersChange({ ...filters, tags: newTags });
  };

  const handleClearAll = () => {
    onFiltersChange({
      tags: [],
      minRating: 0,
      priceLevels: [],
      dateRange: 'all',
      recommendedOnly: false,
      sortBy: defaultSortBy,
    });
  };

  return (
    <div className="mb-6 space-y-4" role="region" aria-label="Filters">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/40 bg-card/70 px-4 py-3 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full px-4 py-2 text-sm font-medium shadow-none"
            onClick={() => {
              if (!allowToggle) return;
              setIsExpanded((prev) => !prev);
            }}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
            {allowToggle && (isExpanded ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4" />
            ))}
          </Button>

          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
              {activeFilterCount} active
            </Badge>
          )}

          {activeFilterCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={handleClearAll}
            >
              Clear all
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sort</span>
          <ToggleGroup
            type="single"
            value={filters.sortBy}
            onValueChange={(value) => {
              if (value) {
                onFiltersChange({ ...filters, sortBy: value as FilterState['sortBy'] });
              }
            }}
            className="flex items-center gap-1 rounded-full bg-muted/60 p-1 backdrop-blur"
          >
            {sortOptions.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                className="rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors data-[state=on]:bg-background data-[state=on]:shadow-sm"
                aria-label={`Sort by ${option.label}`}
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      {shouldRenderDetails && (
        <div className="space-y-6 rounded-2xl border border-border/40 bg-card/60 p-5 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-foreground">Refine results</h3>
              {(typeof filteredCount === 'number' || typeof reviewCount === 'number') && (
                <p className="text-xs text-muted-foreground">
                  Showing {filteredCount ?? reviewCount ?? 0} of {reviewCount ?? filteredCount ?? 0}
                </p>
              )}
            </div>
            {allowToggle && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setIsExpanded(false)}
                aria-label="Collapse filters"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Separator className="opacity-60" />

          <div className="space-y-5">
            {Object.entries(REVIEW_TAGS).map(([categoryKey, tags]) => {
              const category = categoryKey as keyof typeof REVIEW_TAGS;
              const config = TAG_CATEGORY_CONFIG[category];
              const activeTags = tags.filter((tag) => filters.tags.includes(tag));

              return (
                <div key={categoryKey} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{config.icon}</span>
                    <span className="text-sm font-medium text-muted-foreground">{config.label}</span>
                    {activeTags.length > 0 && (
                      <span className="text-xs text-muted-foreground">{activeTags.length} selected</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.slice(0, 8).map((tag) => {
                      const isSelected = filters.tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => handleTagToggle(tag)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:shadow-sm ${
                            isSelected
                              ? `${config.color}`
                              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent'
                          }`}
                        >
                          {tag}
                          {isSelected && <X className="ml-1 inline h-3 w-3" />}
                        </button>
                      );
                    })}
                    {tags.length > 8 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 border border-dashed">
                            +{tags.length - 8} more
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">{config.label}</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {tags.slice(8).map((tag) => {
                                const isSelected = filters.tags.includes(tag);
                                return (
                                  <button
                                    key={tag}
                                    onClick={() => handleTagToggle(tag)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                      isSelected
                                        ? `${config.color}`
                                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent'
                                    }`}
                                  >
                                    {tag}
                                    {isSelected && <X className="ml-1 inline h-3 w-3" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Separator className="opacity-60" />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full px-4 text-xs font-medium"
                >
                  <Filter className="mr-2 h-3 w-3" />
                  Advanced Filters
                  {(filters.minRating > 0 ||
                    filters.priceLevels.length > 0 ||
                    filters.dateRange !== 'all' ||
                    filters.recommendedOnly) && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {(filters.minRating > 0 ? 1 : 0) +
                        (filters.priceLevels.length > 0 ? 1 : 0) +
                        (filters.dateRange !== 'all' ? 1 : 0) +
                        (filters.recommendedOnly ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <label className="text-sm font-medium">Minimum Rating</label>
                    </div>
                    <div className="px-2">
                      <Slider
                        value={[filters.minRating]}
                        onValueChange={([value]) => onFiltersChange({ ...filters, minRating: value })}
                        min={0}
                        max={5}
                        step={0.5}
                      />
                      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                        <span>Any</span>
                        <span>{filters.minRating > 0 ? `${filters.minRating}+ stars` : 'Any rating'}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <label className="text-sm font-medium">Price Level</label>
                    </div>
                    <div className="px-1">
                      <ToggleGroup
                        type="multiple"
                        value={(filters.priceLevels || []).map(String)}
                        onValueChange={(values) => onFiltersChange({ ...filters, priceLevels: values.map((v) => parseInt(v)) })}
                        className="flex flex-wrap gap-1"
                      >
                        {[1, 2, 3, 4].map((level) => (
                          <ToggleGroupItem
                            key={level}
                            value={String(level)}
                            className="px-3 py-1 text-xs"
                            aria-label={`Price level ${PRICE_LEVELS[level as 1 | 2 | 3 | 4]}`}
                          >
                            {PRICE_LEVELS[level as 1 | 2 | 3 | 4]}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {filters.priceLevels.length > 0 ? `${filters.priceLevels.length} selected` : 'Any price'}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <label className="text-sm font-medium">Time Period</label>
                    </div>
                    <Select
                      value={filters.dateRange}
                      onValueChange={(value) => onFiltersChange({ ...filters, dateRange: value as FilterState['dateRange'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All time</SelectItem>
                        <SelectItem value="week">Past week</SelectItem>
                        <SelectItem value="month">Past month</SelectItem>
                        <SelectItem value="year">Past year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Only recommendations</p>
                      <p className="text-xs text-muted-foreground">Hide reviews that were not recommended</p>
                    </div>
                    <Switch
                      checked={filters.recommendedOnly}
                      onCheckedChange={(checked) => onFiltersChange({ ...filters, recommendedOnly: checked })}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(EnhancedFilters);
