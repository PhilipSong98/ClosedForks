
import React, { useState } from 'react';
import { ArrowLeft, MapPin, Star, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ReviewCard from './ReviewCard';

interface User {
  id: string;
  name: string;
  avatar?: string;
  joinDate: string;
  totalReviews: number;
  totalLikes: number;
  favoriteRestaurants: string[];
}

interface Review {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  restaurant: {
    name: string;
    address: string;
    cuisine: string;
  };
  rating: number;
  dish: string;
  review: string;
  tip?: string;
  timestamp: string;
  likes: number;
}

interface ProfilePageProps {
  user: User;
  reviews: Review[];
  onBack: () => void;
  onUserClick: (userId: string) => void;
  isOwnProfile?: boolean;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ 
  user, 
  reviews, 
  onBack, 
  onUserClick, 
  isOwnProfile = false 
}) => {
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  // Sort reviews based on selected option
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } else {
      return b.rating - a.rating;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="surface-elevated border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-start space-x-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground mb-2">{user.name}</h1>
              
              <div className="flex items-center gap-6 mb-4">
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground">{user.totalReviews}</div>
                  <div className="text-sm text-muted-foreground">Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground">{user.favoriteRestaurants.length}</div>
                  <div className="text-sm text-muted-foreground">Favorites</div>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(user.joinDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Favorite Restaurants */}
        {user.favoriteRestaurants.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Favorite Restaurants</h2>
            <div className="flex flex-wrap gap-2">
              {user.favoriteRestaurants.map((restaurant, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm"
                >
                  {restaurant}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">
              {isOwnProfile ? 'Your Reviews' : 'Recent Reviews'}
            </h2>
            
            {/* Sort Controls for Profile */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort:</span>
                <div className="flex bg-accent rounded-lg p-1">
                  <button
                    onClick={() => setSortBy('recent')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      sortBy === 'recent' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Recent
                  </button>
                  <button
                    onClick={() => setSortBy('rating')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      sortBy === 'rating' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Best Rated
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {sortedReviews.length > 0 ? (
            <div className="space-y-6">
              {sortedReviews.map((review) => (
                <ReviewCard 
                  key={review.id} 
                  review={review} 
                  onUserClick={onUserClick}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No reviews yet.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
