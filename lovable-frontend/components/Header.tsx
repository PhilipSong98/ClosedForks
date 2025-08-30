
import React from 'react';
import { Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onProfileClick: () => void;
  onHomeClick: () => void;
  onWriteReviewClick?: () => void;
  currentUser?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

const Header: React.FC<HeaderProps> = ({ onProfileClick, onHomeClick, onWriteReviewClick, currentUser }) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button 
            onClick={onHomeClick}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-primary-foreground rounded-sm" />
            </div>
            <span className="text-xl font-bold text-foreground">DineCircle</span>
          </button>


          {/* User Profile */}
          {currentUser && (
            <button 
              onClick={onProfileClick}
              className="avatar-clickable"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
