'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import ProfileHeader from '@/components/profile/ProfileHeader';
import RecentReviews from '@/components/profile/RecentReviews';
import FavoritesSection from '@/components/profile/FavoritesSection';
import { useAuth } from '@/lib/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PublicProfile } from '@/types';

interface PublicProfileClientProps {
  userId: string;
}

export default function PublicProfileClient({ userId }: PublicProfileClientProps) {
  const { user, loading: authLoading } = useAuth();

  // Use React Query so optimistic updates work for follow actions
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['public-profile', userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/public-profile`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`Failed to load profile: ${res.status}`);
      }
      return res.json();
    },
    enabled: !!userId && !authLoading && !!user,
  });

  const profile = data?.profile as PublicProfile | undefined;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pb-24">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <Skeleton className="w-32 h-32 rounded-full mx-auto" />
              <Skeleton className="h-8 w-48 mx-auto" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const errorMessage = error instanceof Error ? error.message : error ? String(error) : null;
  if (errorMessage || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pb-24">
          <div className="max-w-4xl mx-auto text-center py-12">
            <p className="text-destructive mb-2">{errorMessage || 'Profile not found'}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pb-24">
        <div className="max-w-4xl mx-auto space-y-8">
          <ProfileHeader user={profile} isOwnProfile={user.id === userId} currentUserId={user.id} />

          {/* Content: Tabs for Favorites (default) and Recent Reviews (read-only) */}
          <Tabs defaultValue="favorites" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="reviews">Recent Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="favorites" className="mt-6">
              <FavoritesSection 
                favorites={profile.favoriteRestaurants || []}
                isLoading={false}
                error={null}
                readOnly={true}
                title="Favorites"
              />
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <RecentReviews userId={userId} title="Recent Reviews" />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
