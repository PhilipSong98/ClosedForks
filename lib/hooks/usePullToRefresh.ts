'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
  maxPull?: number
}

interface UsePullToRefreshReturn {
  pullDistance: number
  isPulling: boolean
  isRefreshing: boolean
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
  }
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const startY = useRef(0)
  const currentY = useRef(0)

  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(15)
    }
  }, [])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // Only enable pull-to-refresh when at top of scroll
    const element = e.currentTarget as HTMLElement
    if (element.scrollTop > 0) return

    startY.current = e.touches[0].clientY
    setIsPulling(true)
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return

    const element = e.currentTarget as HTMLElement
    if (element.scrollTop > 0) {
      setPullDistance(0)
      return
    }

    currentY.current = e.touches[0].clientY
    const diff = currentY.current - startY.current

    if (diff > 0) {
      // Apply resistance - pull gets harder as you go
      const resistance = 0.5
      const distance = Math.min(diff * resistance, maxPull)
      setPullDistance(distance)

      // Haptic when crossing threshold
      if (distance >= threshold && pullDistance < threshold) {
        triggerHaptic()
      }
    }
  }, [isPulling, isRefreshing, maxPull, threshold, pullDistance, triggerHaptic])

  const onTouchEnd = useCallback(async () => {
    if (!isPulling) return

    setIsPulling(false)

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      triggerHaptic()

      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh, triggerHaptic])

  // Reset on unmount
  useEffect(() => {
    return () => {
      setPullDistance(0)
      setIsPulling(false)
      setIsRefreshing(false)
    }
  }, [])

  return {
    pullDistance,
    isPulling,
    isRefreshing,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd
    }
  }
}
