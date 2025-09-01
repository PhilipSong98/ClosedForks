'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Menu, User, MapPin, LogOut, Bookmark, Users } from 'lucide-react';

interface MobileMenuProps {
  onProfileClick?: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ onProfileClick }) => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    if (onProfileClick) {
      onProfileClick();
    } else {
      router.push('/profile');
    }
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    router.push('/');
  };

  const handleNavigation = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  if (!user) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden h-10 w-10"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 p-0">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">
          Access restaurants, profile, and account settings
        </SheetDescription>
        
        <div className="flex flex-col h-full">
          {/* User Profile Section */}
          <div className="p-6 border-b border-border bg-muted/20">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  {getInitials(user.full_name || user.name || user.email || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                {(user.full_name || user.name) && (
                  <p className="font-semibold text-foreground">
                    {user.full_name || user.name}
                  </p>
                )}
                <p className="text-sm text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 py-4">
            <nav className="space-y-2 px-4">
              {/* Restaurants */}
              <Button
                variant="ghost"
                className="w-full justify-start h-12 px-4 font-medium"
                onClick={() => handleNavigation('/restaurants')}
              >
                <MapPin className="mr-3 h-5 w-5" />
                Restaurants
              </Button>

              {/* Groups */}
              <Button
                variant="ghost"
                className="w-full justify-start h-12 px-4 font-medium"
                onClick={() => handleNavigation('/groups')}
              >
                <Users className="mr-3 h-5 w-5" />
                Groups
              </Button>

              {/* To-Eat List */}
              <Button
                variant="ghost"
                className="w-full justify-start h-12 px-4 font-medium"
                onClick={() => handleNavigation('/to-eat')}
              >
                <Bookmark className="mr-3 h-5 w-5" />
                To-Eat List
              </Button>

              {/* Profile */}
              <Button
                variant="ghost"
                className="w-full justify-start h-12 px-4 font-medium"
                onClick={handleProfileClick}
              >
                <User className="mr-3 h-5 w-5" />
                Profile
              </Button>
            </nav>
          </div>

          {/* Sign Out */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start h-12 px-4 font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;