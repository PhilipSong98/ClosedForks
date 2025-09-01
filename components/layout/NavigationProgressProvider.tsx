'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface NavigationProgressContextType {
  isNavigating: boolean;
  progress: number;
}

const NavigationProgressContext = createContext<NavigationProgressContextType | undefined>(undefined);

export function useNavigationProgress() {
  const context = useContext(NavigationProgressContext);
  if (context === undefined) {
    throw new Error('useNavigationProgress must be used within a NavigationProgressProvider');
  }
  return context;
}

export function NavigationProgressProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    const handleRouteChangeStart = () => {
      setIsNavigating(true);
      setProgress(0);

      // Quick initial jump for immediate feedback
      setTimeout(() => setProgress(30), 50);
      
      // Gradual progress to 80% over ~500ms
      const progressSteps = [40, 50, 60, 70, 80];
      let currentStep = 0;

      progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          setProgress(progressSteps[currentStep]);
          currentStep++;
        }
      }, 100);
    };

    const handleRouteChangeComplete = () => {
      // Complete immediately to 100%
      setProgress(100);
      
      // Quick fade-out
      timeoutId = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 200);

      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };

    const handleRouteChangeError = () => {
      setIsNavigating(false);
      setProgress(0);
      
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };

    // Listen for page navigation events
    const originalPush = router.push;
    const originalReplace = router.replace;

    router.push = (...args) => {
      handleRouteChangeStart();
      const result = originalPush.apply(router, args);
      
      // Since Next.js App Router doesn't have built-in route change events,
      // we'll simulate completion after navigation
      Promise.resolve(result).then(() => {
        handleRouteChangeComplete();
      }).catch(() => {
        handleRouteChangeError();
      });

      return result;
    };

    router.replace = (...args) => {
      handleRouteChangeStart();
      const result = originalReplace.apply(router, args);
      
      Promise.resolve(result).then(() => {
        handleRouteChangeComplete();
      }).catch(() => {
        handleRouteChangeError();
      });

      return result;
    };

    // Handle browser navigation (back/forward buttons)
    const handlePopState = () => {
      handleRouteChangeStart();
      setTimeout(handleRouteChangeComplete, 300);
    };

    window.addEventListener('popstate', handlePopState);

    // Handle link clicks that might trigger navigation
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href^="/"], a[href^="./"], a[href^="../"]');
      
      if (link && !link.getAttribute('target') && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        const href = link.getAttribute('href');
        if (href && href !== window.location.pathname) {
          handleRouteChangeStart();
          setTimeout(handleRouteChangeComplete, 300);
        }
      }
    };

    document.addEventListener('click', handleLinkClick);

    return () => {
      // Cleanup
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      router.push = originalPush;
      router.replace = originalReplace;
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleLinkClick);
    };
  }, [router]);

  return (
    <NavigationProgressContext.Provider value={{ isNavigating, progress }}>
      {children}
    </NavigationProgressContext.Provider>
  );
}