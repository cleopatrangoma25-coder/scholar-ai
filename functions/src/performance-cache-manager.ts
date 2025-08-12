// import * as functions from 'firebase-functions';
// import * as admin from 'firebase-admin';

// Cache interfaces
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface QueryCache {
  query: string;
  results: any[];
  timestamp: number;
  ttl: number;
  lastAccessed: number;
}

interface EmbeddingCache {
  text: string;
  embedding: number[];
  timestamp: number;
  ttl: number;
  lastAccessed: number;
}

interface PerformanceMetrics {
  queryCount: number;
  cacheHitRate: number;
  averageResponseTime: number;
  totalCacheSize: number;
  lastReset: number;
}

export class PerformanceCacheManager {
  private queryCache: Map<string, QueryCache> = new Map();
  private embeddingCache: Map<string, EmbeddingCache> = new Map();
  private responseCache: Map<string, CacheEntry<any>> = new Map();
  private metrics: PerformanceMetrics = {
    queryCount: 0,
    cacheHitRate: 0,
    averageResponseTime: 0,
    totalCacheSize: 0,
    lastReset: Date.now()
  };

  // Cache configuration
  private readonly QUERY_CACHE_TTL = 3600000; // 1 hour
  private readonly EMBEDDING_CACHE_TTL = 86400000; // 24 hours
  private readonly RESPONSE_CACHE_TTL = 1800000; // 30 minutes
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly MAX_EMBEDDING_CACHE_SIZE = 5000;

  constructor() {
    // Start cache cleanup interval
    setInterval(() => this.cleanupExpiredCache(), 300000); // Every 5 minutes
  }

  // Query preprocessing and normalization
  preprocessQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s]/g, '') // Remove special characters
      .substring(0, 500); // Limit length
  }

  // Generate cache key
  generateCacheKey(prefix: string, data: any): string {
    const hash = this.simpleHash(JSON.stringify(data));
    return `${prefix}:${hash}`;
  }

  // Query caching
  async getCachedQuery(query: string): Promise<any[] | null> {
    const normalizedQuery = this.preprocessQuery(query);
    const cacheKey = this.generateCacheKey('query', normalizedQuery);
    const cached = this.queryCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      cached.lastAccessed = Date.now();
      this.updateMetrics(true);
      return cached.results;
    }

    if (cached) {
      this.queryCache.delete(cacheKey);
    }

    this.updateMetrics(false);
    return null;
  }

  async setCachedQuery(query: string, results: any[]): Promise<void> {
    const normalizedQuery = this.preprocessQuery(query);
    const cacheKey = this.generateCacheKey('query', normalizedQuery);

    // Implement LRU eviction if cache is full
    if (this.queryCache.size >= this.MAX_CACHE_SIZE) {
      this.evictLRUQuery();
    }

    this.queryCache.set(cacheKey, {
      query: normalizedQuery,
      results,
      timestamp: Date.now(),
      ttl: this.QUERY_CACHE_TTL,
      lastAccessed: Date.now()
    });

    this.updateCacheSize();
  }

  // Embedding caching
  async getCachedEmbedding(text: string): Promise<number[] | null> {
    const normalizedText = this.preprocessQuery(text);
    const cacheKey = this.generateCacheKey('embedding', normalizedText);
    const cached = this.embeddingCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      cached.lastAccessed = Date.now();
      return cached.embedding;
    }

    if (cached) {
      this.embeddingCache.delete(cacheKey);
    }

    return null;
  }

  async setCachedEmbedding(text: string, embedding: number[]): Promise<void> {
    const normalizedText = this.preprocessQuery(text);
    const cacheKey = this.generateCacheKey('embedding', normalizedText);

    // Implement LRU eviction if cache is full
    if (this.embeddingCache.size >= this.MAX_EMBEDDING_CACHE_SIZE) {
      this.evictLRUEmbedding();
    }

    this.embeddingCache.set(cacheKey, {
      text: normalizedText,
      embedding,
      timestamp: Date.now(),
      ttl: this.EMBEDDING_CACHE_TTL,
      lastAccessed: Date.now()
    });

    this.updateCacheSize();
  }

  // Response caching
  async getCachedResponse(key: string): Promise<any | null> {
    const cached = this.responseCache.get(key);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      cached.accessCount++;
      cached.lastAccessed = Date.now();
      return cached.data;
    }

    if (cached) {
      this.responseCache.delete(key);
    }

    return null;
  }

  async setCachedResponse(key: string, data: any, ttl?: number): Promise<void> {
    // Implement LRU eviction if cache is full
    if (this.responseCache.size >= this.MAX_CACHE_SIZE) {
      this.evictLRUResponse();
    }

    this.responseCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.RESPONSE_CACHE_TTL,
      accessCount: 1,
      lastAccessed: Date.now()
    });

    this.updateCacheSize();
  }

  // Cache management
  private evictLRUQuery(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, value] of this.queryCache.entries()) {
      if (value.lastAccessed < oldestTime) {
        oldestTime = value.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.queryCache.delete(oldestKey);
    }
  }

  private evictLRUEmbedding(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, value] of this.embeddingCache.entries()) {
      if (value.lastAccessed < oldestTime) {
        oldestTime = value.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.embeddingCache.delete(oldestKey);
    }
  }

  private evictLRUResponse(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, value] of this.responseCache.entries()) {
      if (value.lastAccessed < oldestTime) {
        oldestTime = value.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.responseCache.delete(oldestKey);
    }
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();

    // Cleanup query cache
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.queryCache.delete(key);
      }
    }

    // Cleanup embedding cache
    for (const [key, value] of this.embeddingCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.embeddingCache.delete(key);
      }
    }

    // Cleanup response cache
    for (const [key, value] of this.responseCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.responseCache.delete(key);
      }
    }

    this.updateCacheSize();
  }

  // Performance monitoring
  private updateMetrics(cacheHit: boolean): void {
    this.metrics.queryCount++;
    
    if (this.metrics.queryCount > 0) {
      const currentHitRate = cacheHit ? 1 : 0;
      this.metrics.cacheHitRate = 
        (this.metrics.cacheHitRate * (this.metrics.queryCount - 1) + currentHitRate) / this.metrics.queryCount;
    }
  }

  private updateCacheSize(): void {
    this.metrics.totalCacheSize = 
      this.queryCache.size + 
      this.embeddingCache.size + 
      this.responseCache.size;
  }

  // Performance optimization utilities
  async parallelProcess<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 10
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);
    }

    return results;
  }

  async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = 30000
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
      )
    ]);
  }

  // Metrics and monitoring
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      queryCount: 0,
      cacheHitRate: 0,
      averageResponseTime: 0,
      totalCacheSize: this.metrics.totalCacheSize,
      lastReset: Date.now()
    };
  }

  getCacheStats(): any {
    return {
      queryCacheSize: this.queryCache.size,
      embeddingCacheSize: this.embeddingCache.size,
      responseCacheSize: this.responseCache.size,
      totalCacheSize: this.metrics.totalCacheSize,
      cacheHitRate: this.metrics.cacheHitRate,
      queryCount: this.metrics.queryCount
    };
  }

  // Utility functions
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Clear all caches
  clearAllCaches(): void {
    this.queryCache.clear();
    this.embeddingCache.clear();
    this.responseCache.clear();
    this.updateCacheSize();
  }

  // Background processing simulation
  async processInBackground<T>(
    task: () => Promise<T>,
    onComplete?: (result: T) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    setImmediate(async () => {
      try {
        const result = await task();
        if (onComplete) onComplete(result);
      } catch (error) {
        if (onError) onError(error as Error);
        console.error('Background task failed:', error);
      }
    });
  }
}

export const performanceCacheManager = new PerformanceCacheManager();
