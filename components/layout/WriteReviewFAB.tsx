'use client'

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { haptic } from '@/lib/utils/haptics';

const ReviewComposer = dynamic(
  () => import('@/components/review/ReviewComposer'),
  { ssr: false }
);

export function WriteReviewFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = () => {
    // Review submission is handled by ReviewComposer
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      haptic.light();
    }
    setIsOpen(open);
  };

  const fabButton = (
    <Button
      size="icon"
      className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-white/80 hover:bg-white/90 backdrop-blur-md border border-gray-200/50"
      aria-label="Write a review"
    >
      <Plus className="w-6 h-6 text-gray-600" />
    </Button>
  );

  if (isMobile) {
    return (
      <div className="fixed bottom-6 right-6 z-40 fab-safe-area">
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
          <SheetTrigger asChild>
            {fabButton}
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
            <SheetTitle className="sr-only">Write a Review</SheetTitle>
            <SheetDescription className="sr-only">
              Share your dining experience and help others discover great food.
            </SheetDescription>
            <ReviewComposer 
              onClose={handleClose}
              onSubmit={handleSubmit}
            />
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 fab-safe-area">
      <Button
        onClick={() => handleOpenChange(true)}
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-white/80 hover:bg-white/90 backdrop-blur-md border border-gray-200/50"
        aria-label="Write a review"
      >
        <Plus className="w-6 h-6 text-gray-600" />
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Write a Review</DialogTitle>
          <DialogDescription className="sr-only">
            Share your dining experience and help others discover great food.
          </DialogDescription>
          <ReviewComposer 
            onClose={handleClose}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}