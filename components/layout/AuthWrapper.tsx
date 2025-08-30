'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { SignInForm } from '@/components/auth/SignInForm';
import { SearchFAB } from '@/components/search/SearchFAB';
import { WriteReviewFAB } from '@/components/layout/WriteReviewFAB';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Restaurant Reviews
            </h1>
            <p className="text-gray-600">
              A private place for friends & family to share restaurant experiences
            </p>
          </div>
          <SignInForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
      <SearchFAB />
      <WriteReviewFAB />
    </div>
  );
}