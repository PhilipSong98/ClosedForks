"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlobalSearchModal } from "./GlobalSearchModal";

export function SearchFAB() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with "/" or "Cmd/Ctrl+K"
      if (e.key === "/" && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "k" && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
      // Close with "Escape"
      else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Global Search FAB - Top Right */}
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        className="fixed top-3 right-3 md:top-4 md:right-4 z-50 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
        aria-label="Open search"
      >
        <Search className="h-5 w-5" />
      </Button>
      
      <GlobalSearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}