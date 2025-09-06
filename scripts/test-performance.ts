/**
 * Performance Testing Script
 * 
 * Run this script to verify the database optimizations are working correctly.
 * 
 * Usage:
 * npm run test:performance
 * 
 * Or add to package.json:
 * "scripts": {
 *   "test:performance": "ts-node scripts/test-performance.ts"
 * }
 */

import { performance } from 'perf_hooks';

interface PerformanceTestResult {
  endpoint: string;
  method: string;
  responseTime: number;
  success: boolean;
  optimized?: boolean;
  queriesUsed?: string;
  recordCount?: number;
  error?: string;
}

class PerformanceTester {
  private baseUrl: string;
  private results: PerformanceTestResult[] = [];

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async testEndpoint(
    endpoint: string, 
    options: RequestInit = {},
    description: string = ''
  ): Promise<PerformanceTestResult> {
    console.log(`Testing ${description || endpoint}...`);
    
    const startTime = performance.now();
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          // You'll need to add authentication headers here
          // 'Authorization': 'Bearer your-token',
          ...options.headers,
        },
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const result: PerformanceTestResult = {
        endpoint,
        method: options.method || 'GET',
        responseTime,
        success: true,
        optimized: data._meta?.optimized,
        queriesUsed: data._meta?.queriesUsed,
        recordCount: Array.isArray(data.reviews) ? data.reviews.length :
                    Array.isArray(data.restaurants) ? data.restaurants.length : 0,
      };
      
      console.log(`  ✅ ${responseTime.toFixed(2)}ms - ${result.recordCount} records - ${result.optimized ? 'Optimized' : 'Legacy'} (${result.queriesUsed} queries)`);
      
      this.results.push(result);
      return result;
      
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      const result: PerformanceTestResult = {
        endpoint,
        method: options.method || 'GET',
        responseTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      console.log(`  ❌ ${responseTime.toFixed(2)}ms - Error: ${result.error}`);
      
      this.results.push(result);
      return result;
    }
  }

  async runPerformanceTests(): Promise<void> {
    console.log('🚀 Starting Performance Tests\n');
    
    // Test 1: Homepage Reviews Feed (Main Optimization Target)
    console.log('📊 Testing Reviews Feed Performance...');
    
    // Test different page sizes
    await this.testEndpoint('/api/reviews?limit=10', {}, 'Reviews feed (10 items)');
    await this.testEndpoint('/api/reviews?limit=15', {}, 'Reviews feed (15 items)');
    await this.testEndpoint('/api/reviews?limit=25', {}, 'Reviews feed (25 items)');
    
    // Test keyset pagination vs offset
    console.log('\n📄 Testing Pagination Performance...');
    
    // First page (both should be fast)
    await this.testEndpoint('/api/reviews?limit=15&page=1', {}, 'Page 1 (offset pagination)');
    
    // Deep page with offset (should be slower)
    await this.testEndpoint('/api/reviews?limit=15&page=10', {}, 'Page 10 (offset pagination)');
    
    // Keyset pagination (should be consistently fast)
    const firstPageResult = this.results.find(r => r.endpoint.includes('page=1'));
    if (firstPageResult && firstPageResult.success) {
      // In a real test, you'd extract cursor from the first page response
      // await this.testEndpoint('/api/reviews?limit=15&cursor_created_at=2025-01-01T00:00:00Z&cursor_id=uuid', {}, 'Deep page (keyset pagination)');
    }
    
    // Test 2: Restaurants Feed
    console.log('\n🏪 Testing Restaurants Feed Performance...');
    
    await this.testEndpoint('/api/restaurants/feed?limit=15', {}, 'Restaurants feed (optimized)');
    await this.testEndpoint('/api/restaurants?limit=15', {}, 'Restaurants feed (legacy)');
    
    // Test 3: Different Query Types
    console.log('\n🔍 Testing Query Variations...');
    
    // Group-specific queries (should still use legacy path)
    // await this.testEndpoint('/api/reviews?group_id=some-uuid&limit=15', {}, 'Group-specific reviews');
    
    // Restaurant-specific queries
    // await this.testEndpoint('/api/reviews?restaurant_id=some-uuid&limit=15', {}, 'Restaurant-specific reviews');
    
    // Test 4: Performance under different loads
    console.log('\n⚡ Testing Concurrent Performance...');
    
    const concurrentTests = Array(5).fill(null).map((_, i) => 
      this.testEndpoint('/api/reviews?limit=15', {}, `Concurrent test ${i + 1}`)
    );
    
    await Promise.all(concurrentTests);
    
    console.log('\n✅ Performance Tests Complete!\n');
    this.generateReport();
  }

  generateReport(): void {
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    
    console.log('📈 PERFORMANCE REPORT');
    console.log('===================');
    
    console.log(`\n📊 Test Summary:`);
    console.log(`  Total tests: ${this.results.length}`);
    console.log(`  Successful: ${successful.length}`);
    console.log(`  Failed: ${failed.length}`);
    
    if (failed.length > 0) {
      console.log(`\n❌ Failed Tests:`);
      failed.forEach(result => {
        console.log(`  ${result.endpoint}: ${result.error}`);
      });
    }
    
    console.log(`\n⚡ Performance Metrics:`);
    
    // Group by optimization status
    const optimized = successful.filter(r => r.optimized === true);
    const legacy = successful.filter(r => r.optimized === false);
    const unknown = successful.filter(r => r.optimized === undefined);
    
    if (optimized.length > 0) {
      const avgTime = optimized.reduce((sum, r) => sum + r.responseTime, 0) / optimized.length;
      console.log(`  Optimized queries (${optimized.length}): ${avgTime.toFixed(2)}ms average`);
      
      const queryCounts = optimized.map(r => r.queriesUsed).filter(Boolean);
      if (queryCounts.length > 0) {
        console.log(`    Query counts: ${[...new Set(queryCounts)].join(', ')}`);
      }
    }
    
    if (legacy.length > 0) {
      const avgTime = legacy.reduce((sum, r) => sum + r.responseTime, 0) / legacy.length;
      console.log(`  Legacy queries (${legacy.length}): ${avgTime.toFixed(2)}ms average`);
      
      const queryCounts = legacy.map(r => r.queriesUsed).filter(Boolean);
      if (queryCounts.length > 0) {
        console.log(`    Query counts: ${[...new Set(queryCounts)].join(', ')}`);
      }
    }
    
    if (unknown.length > 0) {
      const avgTime = unknown.reduce((sum, r) => sum + r.responseTime, 0) / unknown.length;
      console.log(`  Unknown status (${unknown.length}): ${avgTime.toFixed(2)}ms average`);
    }
    
    // Performance comparison
    if (optimized.length > 0 && legacy.length > 0) {
      const optimizedAvg = optimized.reduce((sum, r) => sum + r.responseTime, 0) / optimized.length;
      const legacyAvg = legacy.reduce((sum, r) => sum + r.responseTime, 0) / legacy.length;
      const improvement = ((legacyAvg - optimizedAvg) / legacyAvg) * 100;
      
      console.log(`\n🎯 Optimization Impact:`);
      console.log(`  Legacy average: ${legacyAvg.toFixed(2)}ms`);
      console.log(`  Optimized average: ${optimizedAvg.toFixed(2)}ms`);
      console.log(`  Improvement: ${improvement.toFixed(1)}% faster`);
      
      if (improvement > 50) {
        console.log(`  🎉 Excellent! Over 50% performance improvement achieved.`);
      } else if (improvement > 25) {
        console.log(`  ✅ Good! Over 25% performance improvement achieved.`);
      } else if (improvement > 0) {
        console.log(`  📈 Some improvement detected.`);
      } else {
        console.log(`  ⚠️  No significant improvement detected. Check optimizations.`);
      }
    }
    
    // Fastest and slowest endpoints
    if (successful.length > 0) {
      const sorted = [...successful].sort((a, b) => a.responseTime - b.responseTime);
      
      console.log(`\n🏆 Performance Rankings:`);
      console.log(`  Fastest: ${sorted[0].endpoint} (${sorted[0].responseTime.toFixed(2)}ms)`);
      console.log(`  Slowest: ${sorted[sorted.length - 1].endpoint} (${sorted[sorted.length - 1].responseTime.toFixed(2)}ms)`);
    }
    
    // Recommendations
    console.log(`\n💡 Recommendations:`);
    
    if (legacy.length > optimized.length) {
      console.log(`  - More endpoints are using legacy code than optimized code`);
      console.log(`  - Consider enabling optimizations for more endpoints`);
    }
    
    if (failed.length > 0) {
      console.log(`  - ${failed.length} tests failed - check authentication and server status`);
    }
    
    const slowTests = successful.filter(r => r.responseTime > 500);
    if (slowTests.length > 0) {
      console.log(`  - ${slowTests.length} endpoints are slower than 500ms - investigate further`);
    }
    
    console.log(`\n📝 Raw Results:`);
    console.table(
      this.results.map(r => ({
        Endpoint: r.endpoint.substring(0, 40),
        'Time (ms)': r.responseTime.toFixed(2),
        Success: r.success ? '✅' : '❌',
        Optimized: r.optimized === true ? '✅' : r.optimized === false ? '❌' : '❓',
        Queries: r.queriesUsed || 'N/A',
        Records: r.recordCount || 0,
      }))
    );
  }

  exportResults(): string {
    return JSON.stringify(this.results, null, 2);
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  const tester = new PerformanceTester();
  
  tester.runPerformanceTests().catch(error => {
    console.error('Performance test failed:', error);
    process.exit(1);
  });
}

export { PerformanceTester };