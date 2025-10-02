"use client";

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const GlobalSearchModal = dynamic(
  () => import("./GlobalSearchModal").then(mod => ({ default: mod.GlobalSearchModal })),
  { ssr: false }
);

export function SearchFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const hiddenRoutes = ["/welcome", "/signin", "/signup", "/auth/request-magic-link", "/auth/reset-password"];
  const isHidden = pathname ? hiddenRoutes.some((route) => pathname.startsWith(route)) : false;

  useEffect(() => {
    if (isHidden) return;

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
  }, [isHidden, isOpen]);

  if (isHidden) {
    return null;
  }

  return (
    <>
      {/* Global Search FAB - Positioned to avoid overlap */}
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        className="fixed bottom-24 right-6 md:top-4 md:right-4 z-50 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-white/80 hover:bg-white/90 backdrop-blur-md border border-gray-200/50"
        aria-label="Open search"
      >
        <Search className="h-5 w-5 text-gray-600" />
      </Button>
      
      <GlobalSearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
