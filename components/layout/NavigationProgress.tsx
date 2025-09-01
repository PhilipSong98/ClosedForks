'use client';

import React from 'react';
import { useNavigationProgress } from './NavigationProgressProvider';

export function NavigationProgress() {
  const { isNavigating, progress } = useNavigationProgress();

  if (!isNavigating) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-gray-200">
      <div
        className="h-full bg-blue-600 transition-all duration-300 ease-out shadow-sm"
        style={{
          width: `${progress}%`,
          boxShadow: '0 0 10px rgba(37, 99, 235, 0.5)',
        }}
      />
    </div>
  );
}