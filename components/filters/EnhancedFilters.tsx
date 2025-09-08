'use client'

import React, { useState } from 'react';
import { Filter, X, SlidersHorizontal, Star, Clock, DollarSign, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { REVIEW_TAGS, TAG_CATEGORY_CONFIG, PRICE_LEVELS } from '@/constants';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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

const EnhancedFilters: React.FC<EnhancedFiltersProps> = ({ 
  filters, 
  onFiltersChange, 
  showAllFilters = false,
  defaultExpanded = false,
  defaultSortBy = 'recent'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const isMobile = useMediaQuery("(max-width: 768px)");


  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
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
      sortBy: defaultSortBy
    });
  };

  const activeFilterCount = 
    filters.tags.length + 
    (filters.minRating > 0 ? 1 : 0) + 
    (filters.priceLevels.length > 0 ? 1 : 0) +
    (filters.dateRange !== 'all' ? 1 : 0) + 
    (filters.recommendedOnly ? 1 : 0);

  return (
    <div
      className={`bg-card border border-border rounded-xl p-4 mb-6 shadow-sm ${
        // Show pointer when collapsed in compact mode to suggest expand
        ((!isMobile && showAllFilters) || isExpanded) ? '' : 'cursor-pointer'
      }`}
      // In compact mode, clicking the card toggles open/close.
      // When full filters are always shown (desktop + showAllFilters), ignore clicks.
      onClick={() => {
        if (!isMobile && showAllFilters) return;
        setIsExpanded((prev) => !prev);
      }}
      role="region"
      aria-label="Filters"
    >
      {/* Header - Mobile vs Desktop Layouts */}
      {isMobile ? (
        /* Mobile: Compact Header with Filter Toggle and Sort Controls */
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="text-xs flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleClearAll(); }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear ({activeFilterCount})
              </Button>
            )}
          </div>
          
          {/* Sort Toggle Controls - Mobile */}
          <div 
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-sm font-medium text-foreground mr-2">Sort:</span>
            <ToggleGroup 
              type="single" 
              value={filters.sortBy === 'recent' ? 'recent' : 'rating'} 
              onValueChange={(value) => {
                if (value) {
                  onFiltersChange({ ...filters, sortBy: value as FilterState['sortBy'] });
                }
              }}
              className="bg-muted rounded-lg p-0.5"
            >
              <ToggleGroupItem 
                value="recent" 
                className="px-3 py-1.5 text-xs rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                Recent
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="rating" 
                className="px-3 py-1.5 text-xs rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                Best Rated
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      ) : (
        /* Desktop: Professional Header with Enhanced Layout */
        <div className="space-y-4 mb-6">
          {/* Top Row: Main Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                  className="text-sm flex items-center gap-2 font-medium px-3 py-2"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleClearAll(); }}
                    className="text-sm text-muted-foreground hover:text-foreground px-3 py-2"
                  >
                    Clear all ({activeFilterCount})
                  </Button>
                )}
              </div>
            </div>
            
            {/* Sort Controls - Desktop */}
            <div 
              className="flex items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-sm font-semibold text-foreground">Sort by:</span>
              <ToggleGroup 
                type="single" 
                value={filters.sortBy === 'recent' ? 'recent' : 'rating'} 
                onValueChange={(value) => {
                  if (value) {
                    onFiltersChange({ ...filters, sortBy: value as FilterState['sortBy'] });
                  }
                }}
                className="bg-muted/50 rounded-xl p-1 border border-border/50"
              >
                <ToggleGroupItem 
                  value="recent" 
                  className="px-4 py-2 text-sm font-medium rounded-lg data-[state=on]:bg-background data-[state=on]:shadow-md data-[state=on]:border data-[state=on]:border-border/20 transition-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  Recent
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="rating" 
                  className="px-4 py-2 text-sm font-medium rounded-lg data-[state=on]:bg-background data-[state=on]:shadow-md data-[state=on]:border data-[state=on]:border-border/20 transition-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  Best Rated
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
          
          {/* Separator Line */}
          {(isExpanded || showAllFilters) && <Separator className="opacity-50" />}
        </div>
      )}


      {/* Quick Tag Filters */}
      {((!isMobile && showAllFilters) || isExpanded) && (
      <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
        {Object.entries(REVIEW_TAGS).map(([categoryKey, tags]) => {
          const category = categoryKey as keyof typeof REVIEW_TAGS;
          const config = TAG_CATEGORY_CONFIG[category];
          const activeTags = tags.filter(tag => filters.tags.includes(tag));
          
          return (
            <div key={categoryKey} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">{config.icon}</span>
                <span className="text-sm font-medium text-muted-foreground">
                  {config.label}
                </span>
                {activeTags.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({activeTags.length} selected)
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tags.slice(0, 8).map((tag) => {
                  const isSelected = filters.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:scale-105 ${
                        isSelected 
                          ? `${config.color}` 
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent'
                      }`}
                    >
                      {tag}
                      {isSelected && (
                        <X className="w-3 h-3 ml-1 inline" />
                      )}
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
                                {isSelected && (
                                  <X className="w-3 h-3 ml-1 inline" />
                                )}
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
      )}

      {/* Advanced Filters */}
      {((!isMobile && showAllFilters) || isExpanded) && (
      <div className="mt-4" onClick={(e) => e.stopPropagation()}>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <Filter className="w-3 h-3 mr-2" />
              Advanced Filters
              {(filters.minRating > 0 || filters.priceLevels.length > 0 || filters.dateRange !== 'all' || filters.recommendedOnly) && (
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
              {/* Rating Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <label className="text-sm font-medium">Minimum Rating</label>
                </div>
                <div className="px-2">
                  <Slider
                    value={[filters.minRating]}
                    onValueChange={([value]) => onFiltersChange({ ...filters, minRating: value })}
                    min={0}
                    max={5}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Any</span>
                    <span>{filters.minRating > 0 ? `${filters.minRating}+ stars` : 'Any rating'}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Price Level Filter ($ - $$$$) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <label className="text-sm font-medium">Price Level</label>
                </div>
                <div className="px-1">
                  <ToggleGroup 
                    type="multiple" 
                    value={(filters.priceLevels || []).map(String)}
                    onValueChange={(values) => onFiltersChange({ ...filters, priceLevels: values.map(v => parseInt(v)) })}
                    className="flex flex-wrap gap-1"
                  >
                    {[1,2,3,4].map((level) => (
                      <ToggleGroupItem key={level} value={String(level)} className="px-3 py-1 text-xs" aria-label={`Price level ${PRICE_LEVELS[level as 1|2|3|4]}`}>
                        {PRICE_LEVELS[level as 1|2|3|4]}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <div className="text-xs text-muted-foreground mt-1">
                    {filters.priceLevels.length > 0 ? `${filters.priceLevels.length} selected` : 'Any price'}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Date Range Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
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

              {/* Advanced Sort Options */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-500" />
                  <label className="text-sm font-medium">Advanced Sorting</label>
                </div>
                <ToggleGroup 
                  type="single" 
                  value={filters.sortBy} 
                  onValueChange={(value) => {
                    if (value) {
                      onFiltersChange({ ...filters, sortBy: value as FilterState['sortBy'] });
                    }
                  }}
                  className="grid grid-cols-2 gap-1"
                >
                  <ToggleGroupItem 
                    value="price_low" 
                    className="px-3 py-2 text-xs border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    Price: Low
                  </ToggleGroupItem>
                  <ToggleGroupItem 
                    value="price_high" 
                    className="px-3 py-2 text-xs border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    Price: High
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <Separator />

              {/* Recommended Only Filter */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <label className="text-sm font-medium">Recommended only</label>
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
      )}
    </div>
  );
};

export default EnhancedFilters;
