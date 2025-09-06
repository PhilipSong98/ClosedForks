// Performance monitoring utilities for tracking database optimizations

export interface QueryPerformanceMetrics {
  endpoint: string;
  responseTime: number;
  timestamp: number;
  optimized: boolean;
  queriesUsed: string;
  paginationType: 'keyset' | 'offset';
  recordCount: number;
  cacheHit?: boolean;
}

class PerformanceMonitor {
  private metrics: QueryPerformanceMetrics[] = [];
  private readonly maxMetrics = 100; // Keep last 100 measurements
  
  recordMetric(metric: QueryPerformanceMetrics) {
    this.metrics.unshift({
      ...metric,
      timestamp: Date.now(),
    });
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(0, this.maxMetrics);
    }
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${metric.endpoint}: ${metric.responseTime.toFixed(2)}ms (${metric.optimized ? 'optimized' : 'legacy'}, ${metric.queriesUsed} queries, ${metric.paginationType} pagination)`);
    }
  }
  
  getMetrics(endpoint?: string): QueryPerformanceMetrics[] {
    return endpoint 
      ? this.metrics.filter(m => m.endpoint === endpoint)
      : this.metrics;
  }
  
  getAverageResponseTime(endpoint?: string): number {
    const relevantMetrics = this.getMetrics(endpoint);
    if (relevantMetrics.length === 0) return 0;
    
    const total = relevantMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    return total / relevantMetrics.length;
  }
  
  getPerformanceComparison(endpoint: string) {
    const metrics = this.getMetrics(endpoint);
    const optimized = metrics.filter(m => m.optimized);
    const legacy = metrics.filter(m => !m.optimized);
    
    return {
      optimized: {
        count: optimized.length,
        averageTime: optimized.length > 0 ? optimized.reduce((sum, m) => sum + m.responseTime, 0) / optimized.length : 0,
        averageQueries: optimized.length > 0 ? optimized[0]?.queriesUsed || 'N/A' : 'N/A',
      },
      legacy: {
        count: legacy.length,
        averageTime: legacy.length > 0 ? legacy.reduce((sum, m) => sum + m.responseTime, 0) / legacy.length : 0,
        averageQueries: legacy.length > 0 ? legacy[0]?.queriesUsed || 'N/A' : 'N/A',
      },
      improvement: {
        timeSaved: legacy.length > 0 && optimized.length > 0 
          ? ((legacy.reduce((sum, m) => sum + m.responseTime, 0) / legacy.length) - (optimized.reduce((sum, m) => sum + m.responseTime, 0) / optimized.length))
          : 0,
        percentImprovement: legacy.length > 0 && optimized.length > 0 
          ? (((legacy.reduce((sum, m) => sum + m.responseTime, 0) / legacy.length) - (optimized.reduce((sum, m) => sum + m.responseTime, 0) / optimized.length)) / (legacy.reduce((sum, m) => sum + m.responseTime, 0) / legacy.length)) * 100
          : 0,
      }
    };
  }
  
  generateReport(): string {
    const endpoints = [...new Set(this.metrics.map(m => m.endpoint))];
    let report = '# Performance Optimization Report\n\n';
    
    report += `**Total Measurements:** ${this.metrics.length}\n`;
    report += `**Time Range:** ${new Date(Math.min(...this.metrics.map(m => m.timestamp))).toLocaleString()} to ${new Date(Math.max(...this.metrics.map(m => m.timestamp))).toLocaleString()}\n\n`;
    
    endpoints.forEach(endpoint => {
      const comparison = this.getPerformanceComparison(endpoint);
      report += `## ${endpoint}\n\n`;
      
      if (comparison.optimized.count > 0) {
        report += `**Optimized Queries:**\n`;
        report += `- Count: ${comparison.optimized.count}\n`;
        report += `- Average Response Time: ${comparison.optimized.averageTime.toFixed(2)}ms\n`;
        report += `- Queries Used: ${comparison.optimized.averageQueries}\n\n`;
      }
      
      if (comparison.legacy.count > 0) {
        report += `**Legacy Queries:**\n`;
        report += `- Count: ${comparison.legacy.count}\n`;
        report += `- Average Response Time: ${comparison.legacy.averageTime.toFixed(2)}ms\n`;
        report += `- Queries Used: ${comparison.legacy.averageQueries}\n\n`;
      }
      
      if (comparison.improvement.timeSaved > 0) {
        report += `**Performance Improvement:**\n`;
        report += `- Time Saved: ${comparison.improvement.timeSaved.toFixed(2)}ms (${comparison.improvement.percentImprovement.toFixed(1)}%)\n`;
        report += `- Query Reduction: ${comparison.legacy.averageQueries} → ${comparison.optimized.averageQueries}\n\n`;
      }
    });
    
    return report;
  }
  
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }
  
  clear() {
    this.metrics = [];
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();

// Utility function to wrap fetch calls with performance monitoring
export async function monitoredFetch(
  url: string, 
  options?: RequestInit & { skipMonitoring?: boolean }
): Promise<Response> {
  if (options?.skipMonitoring) {
    const { skipMonitoring, ...fetchOptions } = options;
    return fetch(url, fetchOptions);
  }
  
  const startTime = performance.now();
  const response = await fetch(url, options);
  const endTime = performance.now();
  
  // Try to extract performance metadata from response
  try {
    const clonedResponse = response.clone();
    const data = await clonedResponse.json();
    
    if (data._meta) {
      performanceMonitor.recordMetric({
        endpoint: new URL(url, window.location.origin).pathname,
        responseTime: endTime - startTime,
        timestamp: Date.now(),
        optimized: data._meta.optimized || false,
        queriesUsed: data._meta.queriesUsed || 'unknown',
        paginationType: data._meta.paginationType || 'unknown',
        recordCount: Array.isArray(data.reviews) ? data.reviews.length : 
                    Array.isArray(data.restaurants) ? data.restaurants.length : 0,
        cacheHit: response.headers.get('x-cache') === 'HIT',
      });
    }
  } catch {
    // Ignore JSON parsing errors for non-API endpoints
  }
  
  return response;
}

// React hook for accessing performance data
import { useQuery } from '@tanstack/react-query';

export function usePerformanceMetrics(endpoint?: string) {
  return useQuery({
    queryKey: ['performance-metrics', endpoint],
    queryFn: () => ({
      metrics: performanceMonitor.getMetrics(endpoint),
      averageTime: performanceMonitor.getAverageResponseTime(endpoint),
      comparison: endpoint ? performanceMonitor.getPerformanceComparison(endpoint) : null,
    }),
    staleTime: 5000, // Update every 5 seconds
    refetchInterval: 5000,
    enabled: process.env.NODE_ENV === 'development',
  });
}

// Development-only performance dashboard data
export function getPerformanceDashboardData() {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return {
    report: performanceMonitor.generateReport(),
    rawMetrics: performanceMonitor.exportMetrics(),
    summary: {
      totalMeasurements: performanceMonitor.getMetrics().length,
      averageResponseTime: performanceMonitor.getAverageResponseTime(),
      endpoints: [...new Set(performanceMonitor.getMetrics().map(m => m.endpoint))],
    }
  };
}