'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { usePathname } from 'next/navigation';
import { SearchFAB } from '@/components/search/SearchFAB';
import { WriteReviewFAB } from '@/components/layout/WriteReviewFAB';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Define public routes that don't require authentication
  const publicRoutes = ['/welcome', '/signup', '/signin'];
  const isPublicRoute = publicRoutes.includes(pathname);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If user is not authenticated and not on a public route, redirect to welcome
  if (!user && !isPublicRoute) {
    if (typeof window !== 'undefined') {
      window.location.href = '/welcome';
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  // If user is authenticated and on a public route, redirect to home
  if (user && isPublicRoute) {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // For public routes, render without authenticated UI elements
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // For authenticated users on private routes
  return (
    <div className="min-h-screen bg-background">
      {children}
      <SearchFAB />
      <WriteReviewFAB />
    </div>
  );
}