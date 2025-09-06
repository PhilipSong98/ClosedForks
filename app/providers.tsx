'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavigationProgressProvider } from "@/components/layout/NavigationProgressProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Optimized caching settings for better performance
        staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh longer
        gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
        refetchOnWindowFocus: false, // Reduce unnecessary network requests
        refetchOnReconnect: true, // Refetch on network reconnect
        retryOnMount: true, // Retry failed queries on component mount
        retry: (failureCount, error) => {
          // Don't retry authentication errors
          if ((error as unknown as { status?: number })?.status === 401 || (error as unknown as { status?: number })?.status === 403) {
            return false;
          }
          // Retry up to 2 times for other errors
          return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      },
      mutations: {
        // Optimistic updates and better error handling
        retry: (failureCount, error) => {
          // Don't retry client errors (4xx)
          const errorWithStatus = error as unknown as { status?: number };
          if (errorWithStatus?.status && errorWithStatus.status >= 400 && errorWithStatus.status < 500) {
            return false;
          }
          // Retry server errors up to 1 time
          return failureCount < 1;
        },
        retryDelay: 1000, // 1 second delay for mutation retries
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <NavigationProgressProvider>
          <Toaster />
          <Sonner />
          {children}
        </NavigationProgressProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}