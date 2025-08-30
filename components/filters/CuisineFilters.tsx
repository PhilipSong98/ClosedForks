'use client'

import React from 'react';
import { CUISINES } from '@/constants';

interface CuisineFiltersProps {
  selectedCuisines: string[];
  onCuisineToggle: (cuisine: string) => void;
  sortBy: 'recent' | 'rating';
  onSortChange: (sortBy: 'recent' | 'rating') => void;
}

const CuisineFilters: React.FC<CuisineFiltersProps> = ({ 
  selectedCuisines, 
  onCuisineToggle, 
  sortBy, 
  onSortChange 
}) => {
  const handleClearAll = () => {
    selectedCuisines.forEach(cuisine => onCuisineToggle(cuisine));
  };

  return (
    <div className="bg-background/80 backdrop-blur-xl border-b border-border pb-4 mb-6">
      {/* Filters and Sort Controls */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Filters:</span>
          {selectedCuisines.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-primary hover:text-primary/80 underline"
            >
              Clear all ({selectedCuisines.length})
            </button>
          )}
        </div>
        
        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Sort:</span>
          <div className="flex bg-accent rounded-lg p-1">
            <button
              onClick={() => onSortChange('recent')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                sortBy === 'recent' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => onSortChange('rating')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                sortBy === 'rating' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Best Rated
            </button>
          </div>
        </div>
      </div>
      
      {/* Cuisine Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {CUISINES.map((cuisine) => {
          const isSelected = selectedCuisines.includes(cuisine);
          return (
            <button
              key={cuisine}
              onClick={() => onCuisineToggle(cuisine)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                isSelected 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {cuisine}
              {isSelected && (
                <span className="ml-1 text-xs">×</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CuisineFilters;