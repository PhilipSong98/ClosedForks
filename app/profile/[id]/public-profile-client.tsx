'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import ProfileHeader from '@/components/profile/ProfileHeader';
import RecentReviews from '@/components/profile/RecentReviews';
import FavoritesSection from '@/components/profile/FavoritesSection';
import { useAuth } from '@/lib/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PublicProfileClientProps {
  userId: string;
}

export default function PublicProfileClient({ userId }: PublicProfileClientProps) {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<any | null>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/users/${userId}/public-profile`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          throw new Error(`Failed to load profile: ${res.status}`);
        }
        const data = await res.json();
        setProfile(data.profile);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchProfile();
  }, [userId]);

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
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pb-24">
          <div className="max-w-4xl mx-auto text-center py-12">
            <p className="text-destructive mb-2">{error || 'Profile not found'}</p>
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
          <ProfileHeader user={profile} isOwnProfile={false} />

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
