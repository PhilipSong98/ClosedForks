'use client';

import React, { useState } from 'react';
import { Edit2, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EditProfileModal from './EditProfileModal';
import { User } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface ProfileHeaderProps {
  user: User & {
    stats: {
      reviewCount: number;
      favoritesCount: number;
    };
  };
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  const [editModalOpen, setEditModalOpen] = useState(false);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const memberSince = formatDistanceToNow(new Date(user.created_at), { addSuffix: true });

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            {/* Profile Avatar */}
            <div className="relative inline-block">
              <Avatar className="w-32 h-32 mx-auto">
                <AvatarImage 
                  src={user.avatar_url} 
                  alt={`${user.name} profile picture`}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* User Info */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                {user.name}
              </h1>
              <p className="text-muted-foreground">
                {user.email}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Member {memberSince}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {user.stats.reviewCount}
                </div>
                <div className="text-sm text-muted-foreground">
                  Review{user.stats.reviewCount !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {user.stats.favoritesCount}
                </div>
                <div className="text-sm text-muted-foreground">
                  Favorite{user.stats.favoritesCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Edit Profile Button */}
            <Button 
              onClick={() => setEditModalOpen(true)}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <EditProfileModal 
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        user={user}
      />
    </>
  );
};

export default ProfileHeader;