'use client';

import React from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import Header from '@/components/layout/Header';
import ToEatSection from '@/components/profile/ToEatSection';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

export default function ToEatPageClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  React.useEffect(() => {
    // Redirect to sign in if not authenticated
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);
  
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pb-24">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Page Header Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
            
            {/* Content Skeleton */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-28" />
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-24">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              To-Eat List
            </h1>
            <p className="text-muted-foreground">
              Restaurants you&apos;ve saved to try later
            </p>
          </div>
          
          {/* To-Eat Section */}
          <ToEatSection />
        </div>
      </main>
    </div>
  );
}