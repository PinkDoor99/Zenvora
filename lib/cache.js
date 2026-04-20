/**
 * Multi-level caching system for Zenvora
 * Supports in-memory caching with TTL and optional persistence
 */

class Cache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000; // Max cache entries
    this.defaultTTL = options.defaultTTL || 3600000; // 1 hour default TTL
    this.storage = new Map();
    this.metadata = new Map(); // Store TTL and access info
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Get value from cache
   */
  get(key) {
    const entry = this.storage.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    const meta = this.metadata.get(key);
    if (meta && meta.expiresAt && meta.expiresAt < Date.now()) {
      this.storage.delete(key);
      this.metadata.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access time
    if (meta) {
      meta.lastAccessed = Date.now();
      meta.accessCount++;
    }

    this.stats.hits++;
    return entry;
  }

  /**
   * Set value in cache
   */
  set(key, value, ttl = this.defaultTTL) {
    // Evict if cache is full (LRU policy)
    if (this.storage.size >= this.maxSize && !this.storage.has(key)) {
      this.evictLRU();
    }

    this.storage.set(key, value);
    this.metadata.set(key, {
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      expiresAt: Date.now() + ttl,
      accessCount: 0,
      ttl
    });

    this.stats.sets++;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key) {
    const meta = this.metadata.get(key);
    if (!meta) return false;

    if (meta.expiresAt && meta.expiresAt < Date.now()) {
      this.storage.delete(key);
      this.metadata.delete(key);
      return false;
    }

    return this.storage.has(key);
  }

  /**
   * Delete entry from cache
   */
  delete(key) {
    this.storage.delete(key);
    this.metadata.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.storage.clear();
    this.metadata.clear();
    this.stats = { hits: 0, misses: 0, sets: 0, evictions: 0 };
  }

  /**
   * Evict least recently used entry
   */
  evictLRU() {
    let lruKey = null;
    let lruTime = Infinity;

    for (const [key, meta] of this.metadata.entries()) {
      if (meta.lastAccessed < lruTime) {
        lruTime = meta.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.storage.delete(lruKey);
      this.metadata.delete(lruKey);
      this.stats.evictions++;
    }
  }

  /**
   * Remove expired entries
   */
  cleanup() {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, meta] of this.metadata.entries()) {
      if (meta.expiresAt && meta.expiresAt < now) {
        this.storage.delete(key);
        this.metadata.delete(key);
        expiredCount++;
      }
    }

    return expiredCount;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.storage.size,
      maxSize: this.maxSize,
      utcMemory: process.memoryUsage().heapUsed
    };
  }

  /**
   * Get cache entries (for debugging)
   */
  entries() {
    return Array.from(this.storage.entries());
  }

  /**
   * Destroy cache and cleanup
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

// Create singleton instances for common caches
module.exports = {
  Cache,
  // Language detection cache (1 hour TTL)
  languageCache: new Cache({ maxSize: 5000, defaultTTL: 3600000 }),
  // Code analysis cache (30 minutes TTL)
  analysisCache: new Cache({ maxSize: 2000, defaultTTL: 1800000 }),
  // Project metadata cache (1 hour TTL)
  projectCache: new Cache({ maxSize: 1000, defaultTTL: 3600000 }),
  // User session cache (24 hours TTL)
  sessionCache: new Cache({ maxSize: 500, defaultTTL: 86400000 })
};
