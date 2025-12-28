import { Metadata } from 'next';
import { Suspense } from 'react';
import HomeClient from './home-client';
import { ReviewFeedSkeleton } from '@/components/ui/skeleton-loader';

export const metadata: Metadata = {
  title: 'Home - DineCircle',
  description: 'Latest restaurant reviews from your dining circles',
};

export default function Home() {
  return (
    <Suspense fallback={<ReviewFeedSkeleton count={3} />}>
      <HomeClient />
    </Suspense>
  );
}
