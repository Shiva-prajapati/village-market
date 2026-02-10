/**
 * Advanced caching strategy for API requests
 * Implements memory cache, localStorage cache, and cache invalidation
 */

class CacheManager {
  constructor(options = {}) {
    this.memoryCache = new Map();
    this.cacheExpiry = new Map();
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes
    this.maxCacheSize = options.maxCacheSize || 100; // max items in memory
    this.useLocalStorage = options.useLocalStorage !== false;
  }

  /**
   * Generate cache key from URL and parameters
   */
  generateKey(endpoint, params = {}) {
    const paramStr = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    return `${endpoint}:${paramStr}`;
  }

  /**
   * Set cache value
   */
  set(key, value, ttl = this.defaultTTL) {
    // Check memory cache size
    if (this.memoryCache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
      this.cacheExpiry.delete(firstKey);
    }

    // Set in memory
    this.memoryCache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + ttl);

    // Also store in localStorage for persistence
    if (this.useLocalStorage) {
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify({
          value,
          expiry: Date.now() + ttl
        }));
      } catch (e) {
        console.warn('LocalStorage full or unavailable:', e);
      }
    }
  }

  /**
   * Get cache value
   */
  get(key) {
    const now = Date.now();

    // Check memory cache first
    if (this.memoryCache.has(key)) {
      const expiry = this.cacheExpiry.get(key);
      if (expiry && expiry > now) {
        return this.memoryCache.get(key);
      } else {
        // Expired, remove it
        this.memoryCache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }

    // Check localStorage as fallback
    if (this.useLocalStorage) {
      try {
        const cached = localStorage.getItem(`cache_${key}`);
        if (cached) {
          const { value, expiry } = JSON.parse(cached);
          if (expiry && expiry > now) {
            // Restore to memory cache
            this.memoryCache.set(key, value);
            this.cacheExpiry.set(key, expiry);
            return value;
          } else {
            // Expired, remove it
            localStorage.removeItem(`cache_${key}`);
          }
        }
      } catch (e) {
        console.warn('Error reading localStorage:', e);
      }
    }

    return null;
  }

  /**
   * Check if cache exists and is valid
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key) {
    this.memoryCache.delete(key);
    this.cacheExpiry.delete(key);
    if (this.useLocalStorage) {
      try {
        localStorage.removeItem(`cache_${key}`);
      } catch (e) {
        console.warn('Error removing from localStorage:', e);
      }
    }
  }

  /**
   * Invalidate multiple entries matching a pattern
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    
    // Clear memory cache
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }

    // Clear localStorage
    if (this.useLocalStorage) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('cache_') && regex.test(key.substring(6))) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        console.warn('Error clearing localStorage:', e);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.memoryCache.clear();
    this.cacheExpiry.clear();
    if (this.useLocalStorage) {
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('cache_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (e) {
        console.warn('Error clearing localStorage:', e);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      memorySize: this.memoryCache.size,
      maxSize: this.maxCacheSize,
      percentUsed: (this.memoryCache.size / this.maxCacheSize * 100).toFixed(1) + '%'
    };
  }
}

// Create singleton instance
const cacheManager = new CacheManager({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxCacheSize: 150
});

/**
 * Fetch with caching wrapper
 */
export async function cachedFetch(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    ttl = cacheManager.defaultTTL,
    bypassCache = false,
    params = {}
  } = options;

  // Generate cache key
  const cacheKey = cacheManager.generateKey(endpoint, params);

  // Check cache if GET request and cache not bypassed
  if (method === 'GET' && !bypassCache) {
    const cachedData = cacheManager.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache HIT] ${endpoint}`);
      return cachedData;
    }
  }

  // Make actual request
  try {
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Cache successful GET requests
    if (method === 'GET') {
      cacheManager.set(cacheKey, data, ttl);
      console.log(`[Cache SET] ${endpoint}`);
    }

    return data;
  } catch (error) {
    console.error(`[Fetch Error] ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Cache invalidation helper
 */
export function invalidateCache(pattern) {
  if (!pattern) {
    cacheManager.clear();
  } else {
    cacheManager.invalidatePattern(pattern);
  }
}

export default cacheManager;
