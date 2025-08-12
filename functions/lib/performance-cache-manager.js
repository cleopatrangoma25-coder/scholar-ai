"use strict";
// import * as functions from 'firebase-functions';
// import * as admin from 'firebase-admin';
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceCacheManager = exports.PerformanceCacheManager = void 0;
class PerformanceCacheManager {
    constructor() {
        this.queryCache = new Map();
        this.embeddingCache = new Map();
        this.responseCache = new Map();
        this.metrics = {
            queryCount: 0,
            cacheHitRate: 0,
            averageResponseTime: 0,
            totalCacheSize: 0,
            lastReset: Date.now()
        };
        // Cache configuration
        this.QUERY_CACHE_TTL = 3600000; // 1 hour
        this.EMBEDDING_CACHE_TTL = 86400000; // 24 hours
        this.RESPONSE_CACHE_TTL = 1800000; // 30 minutes
        this.MAX_CACHE_SIZE = 1000;
        this.MAX_EMBEDDING_CACHE_SIZE = 5000;
        // Start cache cleanup interval
        setInterval(() => this.cleanupExpiredCache(), 300000); // Every 5 minutes
    }
    // Query preprocessing and normalization
    preprocessQuery(query) {
        return query
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/[^\w\s]/g, '') // Remove special characters
            .substring(0, 500); // Limit length
    }
    // Generate cache key
    generateCacheKey(prefix, data) {
        const hash = this.simpleHash(JSON.stringify(data));
        return `${prefix}:${hash}`;
    }
    // Query caching
    async getCachedQuery(query) {
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
    async setCachedQuery(query, results) {
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
    async getCachedEmbedding(text) {
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
    async setCachedEmbedding(text, embedding) {
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
    async getCachedResponse(key) {
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
    async setCachedResponse(key, data, ttl) {
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
    evictLRUQuery() {
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
    evictLRUEmbedding() {
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
    evictLRUResponse() {
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
    cleanupExpiredCache() {
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
    updateMetrics(cacheHit) {
        this.metrics.queryCount++;
        if (this.metrics.queryCount > 0) {
            const currentHitRate = cacheHit ? 1 : 0;
            this.metrics.cacheHitRate =
                (this.metrics.cacheHitRate * (this.metrics.queryCount - 1) + currentHitRate) / this.metrics.queryCount;
        }
    }
    updateCacheSize() {
        this.metrics.totalCacheSize =
            this.queryCache.size +
                this.embeddingCache.size +
                this.responseCache.size;
    }
    // Performance optimization utilities
    async parallelProcess(items, processor, batchSize = 10) {
        const results = [];
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map(processor));
            results.push(...batchResults);
        }
        return results;
    }
    async withTimeout(promise, timeoutMs = 30000) {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timeout')), timeoutMs))
        ]);
    }
    // Metrics and monitoring
    getPerformanceMetrics() {
        return Object.assign({}, this.metrics);
    }
    resetMetrics() {
        this.metrics = {
            queryCount: 0,
            cacheHitRate: 0,
            averageResponseTime: 0,
            totalCacheSize: this.metrics.totalCacheSize,
            lastReset: Date.now()
        };
    }
    getCacheStats() {
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
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    // Clear all caches
    clearAllCaches() {
        this.queryCache.clear();
        this.embeddingCache.clear();
        this.responseCache.clear();
        this.updateCacheSize();
    }
    // Background processing simulation
    async processInBackground(task, onComplete, onError) {
        setImmediate(async () => {
            try {
                const result = await task();
                if (onComplete)
                    onComplete(result);
            }
            catch (error) {
                if (onError)
                    onError(error);
                console.error('Background task failed:', error);
            }
        });
    }
}
exports.PerformanceCacheManager = PerformanceCacheManager;
exports.performanceCacheManager = new PerformanceCacheManager();
//# sourceMappingURL=performance-cache-manager.js.map