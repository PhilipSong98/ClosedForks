"use client";

import { useState, useEffect } from "react";
import { Search, Star, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { REVIEW_TAGS, TAG_CATEGORY_CONFIG } from "@/constants";
import Link from "next/link";

interface SearchResult {
  type: "review" | "restaurant";
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  avatar?: string;
  rating?: number;
  tags?: string[];
  createdAt?: string;
  restaurantId?: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const debouncedQuery = useDebounce(query, 250);

  // Reset query when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      console.log("Performing search for:", debouncedQuery);
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        console.log("Search response status:", response.status);
        if (response.ok) {
          const data = await response.json();
          console.log("Search response data:", data);
          setResults(data.results || []);
        } else {
          console.error("Search response not ok:", response.status, response.statusText);
          const errorText = await response.text().catch(() => "Unknown error");
          console.error("Error details:", errorText);
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const searchContent = (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search reviews and restaurants..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-12 text-base"
            autoFocus
          />
        </div>
        <div className="text-xs text-muted-foreground mt-2 text-center">
          Press / or Cmd+K to search, Esc to close
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {!query.trim() ? (
          <div className="p-8 text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Start typing to search</p>
            <p className="text-sm mt-1">Find reviews and restaurants in your network</p>
          </div>
        ) : isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p>Searching...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No results found</p>
            <p className="text-sm mt-1">Try different keywords</p>
          </div>
        ) : (
          <div className="p-4">
            {results.map((result) => (
              <SearchResultItem
                key={`${result.type}-${result.id}`}
                result={result}
                onSelect={onClose}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="top" className="h-full p-0">
          <SheetTitle className="sr-only">Search</SheetTitle>
          <SheetDescription className="sr-only">
            Search through reviews and restaurants in your network
          </SheetDescription>
          {searchContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <DialogDescription className="sr-only">
          Search through reviews and restaurants in your network
        </DialogDescription>
        {searchContent}
      </DialogContent>
    </Dialog>
  );
}

function SearchResultItem({ 
  result, 
  onSelect 
}: { 
  result: SearchResult;
  onSelect: () => void;
}) {
  const href = result.type === "review" 
    ? `/?highlight=${result.id}` 
    : `/restaurants?highlight=${result.id}`;

  // Helper function to get tag category for styling
  const getTagCategory = (tag: string) => {
    for (const [category, tags] of Object.entries(REVIEW_TAGS)) {
      if ((tags as readonly string[]).includes(tag)) {
        return category as keyof typeof REVIEW_TAGS;
      }
    }
    return 'DISHES'; // fallback
  };

  return (
    <Link
      href={href}
      onClick={onSelect}
      className="block p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-muted"
    >
      <div className="flex items-start gap-3">
        {result.avatar && (
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={result.avatar} alt="" />
            <AvatarFallback>
              {result.type === "review" ? "👤" : "🍽️"}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-foreground truncate">
              {result.title}
            </h3>
            {result.type === "review" && (
              <Badge variant="secondary" className="text-xs">
                Review
              </Badge>
            )}
            {result.type === "restaurant" && (
              <Badge variant="outline" className="text-xs">
                Restaurant
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-1 truncate">
            {result.subtitle}
          </p>
          
          {result.description && (
            <p className="text-sm text-foreground line-clamp-2 mb-2">
              {result.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {result.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-current text-yellow-500" />
                <span>{result.rating.toFixed(1)}</span>
              </div>
            )}
            
            {result.createdAt && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(result.createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          
          {result.tags && result.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {result.tags.slice(0, 3).map((tag) => {
                const category = getTagCategory(tag);
                const config = TAG_CATEGORY_CONFIG[category];
                return (
                  <Badge 
                    key={tag} 
                    className={`text-xs px-2 py-0.5 font-medium border ${config.color}`}
                  >
                    <span className="text-xs mr-1">{config.icon}</span>
                    {tag}
                  </Badge>
                );
              })}
              {result.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{result.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}