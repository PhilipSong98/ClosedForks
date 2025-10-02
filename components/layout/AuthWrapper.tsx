'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';
import { WriteReviewFAB } from '@/components/layout/WriteReviewFAB';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const redirectTargetRef = useRef<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Define public routes that don't require authentication
  const publicRoutes = useMemo(() => new Set(['/welcome', '/signup', '/signin']), []);
  const currentPath = pathname ?? '';
  const isPublicRoute = publicRoutes.has(currentPath);
  const needsAuthRedirect = !loading && !user && !isPublicRoute;
  const needsHomeRedirect = !loading && !!user && isPublicRoute;

  useEffect(() => {
    if (needsAuthRedirect && redirectTargetRef.current !== '/welcome') {
      redirectTargetRef.current = '/welcome';
      setIsRedirecting(true);
      router.replace('/welcome');
      return;
    }

    if (needsHomeRedirect && redirectTargetRef.current !== '/') {
      redirectTargetRef.current = '/';
      setIsRedirecting(true);
      router.replace('/');
      return;
    }

    if (!needsAuthRedirect && !needsHomeRedirect) {
      redirectTargetRef.current = null;
      setIsRedirecting(false);
    }
  }, [needsAuthRedirect, needsHomeRedirect, router]);

  const showBlockingLoader =
    loading ||
    isRedirecting ||
    (needsAuthRedirect && currentPath !== '/welcome') ||
    (needsHomeRedirect && currentPath !== '/');

  if (showBlockingLoader) {
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
      <WriteReviewFAB />
    </div>
  );
}
