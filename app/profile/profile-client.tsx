'use client';

import React from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUserProfile } from '@/lib/queries/profile';
import Header from '@/components/layout/Header';
import ProfileHeader from '@/components/profile/ProfileHeader';
import RecentReviews from '@/components/profile/RecentReviews';
import LikedReviews from '@/components/profile/LikedReviews';
import FavoritesSection from '@/components/profile/FavoritesSection';
import ToEatSection from '@/components/profile/ToEatSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileClient() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading, error } = useUserProfile();
  
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 pb-24">
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            {/* Profile Header Skeleton */}
            <div className="text-center space-y-3 sm:space-y-4">
              <Skeleton className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full mx-auto" />
              <Skeleton className="h-6 sm:h-8 w-40 sm:w-48 mx-auto" />
              <div className="flex justify-center gap-6 sm:gap-8">
                <Skeleton className="h-10 sm:h-12 w-20 sm:w-24" />
                <Skeleton className="h-10 sm:h-12 w-20 sm:w-24" />
              </div>
            </div>
            
            {/* Content Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-12 w-64" />
              <div className="grid gap-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 pb-24">
          <div className="max-w-4xl mx-auto text-center py-12">
            <p className="text-destructive mb-4">Failed to load profile</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 pb-24">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Profile Header */}
          <ProfileHeader user={profile} />
          
          {/* Profile Content */}
          <Tabs defaultValue="favorites" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-0 h-auto sm:h-10 p-1">
              <TabsTrigger value="favorites" className="text-xs sm:text-sm">Favorites</TabsTrigger>
              <TabsTrigger value="reviews" className="text-xs sm:text-sm">Recent Reviews</TabsTrigger>
              <TabsTrigger value="liked" className="text-xs sm:text-sm">Liked Posts</TabsTrigger>
              <TabsTrigger value="to-eat" className="text-xs sm:text-sm">To-Eat List</TabsTrigger>
            </TabsList>

            <TabsContent value="favorites" className="mt-6">
              <FavoritesSection 
                favorites={profile.favoriteRestaurants || []}
                onUpdateFavorites={() => {
                  // This will be handled by the mutation in FavoritesSection
                }}
              />
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <RecentReviews userId={user.id} />
            </TabsContent>

            <TabsContent value="liked" className="mt-6">
              <LikedReviews />
            </TabsContent>

            <TabsContent value="to-eat" className="mt-6">
              <ToEatSection showHeader={true} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
