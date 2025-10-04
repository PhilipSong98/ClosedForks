'use client'

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, MapPin, Bookmark, Users } from 'lucide-react';
import MobileMenu from './MobileMenu';
import Image from 'next/image';

interface HeaderProps {
  onProfileClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onProfileClick }) => {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
    } else {
      // Default to profile page if no custom handler
      router.push('/profile');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/dinecircle-logo.png"
                alt="DineCircle"
                width={36}
                height={36}
                className="object-contain"
              />
              <span className="text-xl font-bold text-foreground">DineCircle</span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                href="/restaurants"
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                Restaurants
              </Link>
              <Link 
                href="/groups"
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                Groups
              </Link>
              <Link 
                href="/to-eat"
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                To-Eat List
              </Link>
            </nav>
          </div>

          {/* User Profile */}
          {user && (
            <div className="flex items-center space-x-2">
              {/* Mobile Menu */}
              <MobileMenu onProfileClick={onProfileClick} />
              
              {/* Desktop Dropdown */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                          {getInitials(user.full_name || user.name || user.email || 'U')}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        {(user.full_name || user.name) && (
                          <p className="font-medium">{user.full_name || user.name}</p>
                        )}
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleProfileClick}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/restaurants">
                        <MapPin className="mr-2 h-4 w-4" />
                        Restaurants
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/groups">
                        <Users className="mr-2 h-4 w-4" />
                        Groups
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/to-eat">
                        <Bookmark className="mr-2 h-4 w-4" />
                        To-Eat List
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;