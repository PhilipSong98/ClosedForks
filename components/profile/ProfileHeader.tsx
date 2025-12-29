'use client';

import React, { useState } from 'react';
import { Edit2, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EditProfileModal from './EditProfileModal';
import { FollowButton } from './FollowButton';
import { FollowersModal } from './FollowersModal';
import { FollowingModal } from './FollowingModal';
import { User, PublicProfile, FollowStatus } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface ProfileHeaderProps {
  user: (User & {
    stats: {
      reviewCount: number;
      favoritesCount: number;
    };
    followers_count?: number;
    following_count?: number;
  }) | (PublicProfile & {
    followStatus?: FollowStatus;
  });
  isOwnProfile?: boolean;
  currentUserId?: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, isOwnProfile = true, currentUserId }) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followingModalOpen, setFollowingModalOpen] = useState(false);

  const displayName = (
    isOwnProfile
      ? (user.full_name || user.name || user.email || 'User')
      : (user.full_name || user.name || 'User')
  ).trim();

  // Get follow counts and status
  const followersCount = user.followers_count || 0;
  const followingCount = user.following_count || 0;
  const followStatus = 'followStatus' in user ? user.followStatus : undefined;

  const getInitials = (value: string) => {
    const safe = (value || '').trim();
    if (!safe) return 'U';
    // If looks like an email, use first letter before @
    const source = safe.includes('@') ? safe.split('@')[0] : safe;
    return source.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const memberSince = formatDistanceToNow(new Date(user.created_at), { addSuffix: true });

  return (
    <>
      <Card className="border border-slate-200/60 shadow-sm bg-white">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Profile Avatar - Left side on desktop */}
            <div className="relative shrink-0">
              <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-2 border-slate-100">
                <AvatarImage
                  src={user.avatar_url}
                  alt={`${displayName} profile picture`}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl sm:text-3xl bg-[var(--primary)] text-white">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-white rounded-full flex items-center justify-center border-2 border-slate-100 shadow-sm">
                <Calendar className="w-4 h-4 text-slate-500" />
              </div>
            </div>

            {/* User Info - Right side on desktop */}
            <div className="flex-1 text-center sm:text-left space-y-3 w-full">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {displayName}
                </h1>
                {isOwnProfile && (
                  <p className="text-sm text-slate-500 truncate max-w-xs sm:max-w-none mx-auto sm:mx-0">
                    {user.email}
                  </p>
                )}
                <p className="text-xs text-slate-400">
                  Member {memberSince}
                </p>
              </div>

              {/* Stats - Simple inline */}
              <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-6 pt-2 flex-wrap">
                <div className="text-center sm:text-left">
                  <div className="text-2xl font-bold text-[var(--primary)]">
                    {user.stats.reviewCount}
                  </div>
                  <div className="text-xs text-slate-500">
                    Review{user.stats.reviewCount !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-2xl font-bold text-[var(--primary)]">
                    {user.stats.favoritesCount}
                  </div>
                  <div className="text-xs text-slate-500">
                    Favorite{user.stats.favoritesCount !== 1 ? 's' : ''}
                  </div>
                </div>
                {/* Followers - Clickable */}
                <button
                  onClick={() => setFollowersModalOpen(true)}
                  className="text-center sm:text-left hover:opacity-70 transition-opacity"
                >
                  <div className="text-2xl font-bold text-[var(--primary)]">
                    {followersCount}
                  </div>
                  <div className="text-xs text-slate-500">
                    Follower{followersCount !== 1 ? 's' : ''}
                  </div>
                </button>
                {/* Following - Clickable */}
                <button
                  onClick={() => setFollowingModalOpen(true)}
                  className="text-center sm:text-left hover:opacity-70 transition-opacity"
                >
                  <div className="text-2xl font-bold text-[var(--primary)]">
                    {followingCount}
                  </div>
                  <div className="text-xs text-slate-500">
                    Following
                  </div>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-2">
                {isOwnProfile ? (
                  <Button
                    onClick={() => setEditModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="border-slate-200 hover:bg-slate-50"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : followStatus && (
                  <FollowButton
                    targetUserId={user.id}
                    isFollowing={followStatus.isFollowing}
                    hasPendingRequest={followStatus.hasPendingRequest}
                    isFollower={followStatus.isFollower}
                    size="default"
                  />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isOwnProfile && 'role' in user && (
        <EditProfileModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          user={user}
        />
      )}

      {/* Followers/Following Modals */}
      <FollowersModal
        userId={user.id}
        isOpen={followersModalOpen}
        onOpenChange={setFollowersModalOpen}
        currentUserId={currentUserId}
      />
      <FollowingModal
        userId={user.id}
        isOpen={followingModalOpen}
        onOpenChange={setFollowingModalOpen}
        currentUserId={currentUserId}
      />
    </>
  );
};

export default ProfileHeader;
