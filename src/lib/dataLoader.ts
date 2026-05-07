/**
 * Utility for safely loading word data with error handling and caching
 * Prevents silent failures and provides user feedback
 */

import { errorLogger } from "./errorLogger";

interface Word {
  word: string;
  pos: string;
  phonetic: string;
  bangla: string;
  example: string;
}

interface DataLoadResult {
  success: boolean;
  data: Word[];
  error: string | null;
  fromCache: boolean;
}

interface LoadOptions {
  forceRefresh?: boolean;
}

class DataLoader {
  private cache: Map<string, Word[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private cacheTTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Safely load word data from JSON
   */
  async loadData(stage: string, file: string, options: LoadOptions = {}): Promise<DataLoadResult> {
    const cacheKey = `${stage}/${file}`;
    const shouldUseCache = !options.forceRefresh;

    // Check in-memory cache first unless caller explicitly asked for a refresh
    const cachedData = shouldUseCache ? this.cache.get(cacheKey) : undefined;
    const cacheTime = shouldUseCache ? (this.cacheExpiry.get(cacheKey) ?? 0) : 0;

    if (cachedData && cacheTime > Date.now()) {
      errorLogger.info(`📦 Loaded from in-memory cache: ${cacheKey}`);
      return {
        success: true,
        data: cachedData,
        error: null,
        fromCache: true,
      };
    }

    // Check localStorage cache unless caller explicitly asked for a refresh
    if (shouldUseCache) {
      const storageKey = `word_data_${cacheKey}`;
      const storageCacheMeta = typeof window !== "undefined"
        ? window.localStorage.getItem(`${storageKey}_meta`)
        : null;

      if (storageCacheMeta) {
        try {
          const meta = JSON.parse(storageCacheMeta);
          if (meta.expiry > Date.now()) {
            const stored = typeof window !== "undefined"
              ? window.localStorage.getItem(storageKey)
              : null;

            if (stored) {
              const data = JSON.parse(stored) as Word[];
              // Restore to in-memory cache
              this.setCache(cacheKey, data);
              errorLogger.info(`💾 Loaded from localStorage cache: ${cacheKey}`);
              return {
                success: true,
                data,
                error: null,
                fromCache: true,
              };
            }
          }
        } catch {
          errorLogger.warn(`Could not restore localStorage cache for ${cacheKey}`);
        }
      }
    }

    // Load fresh data
    try {
      errorLogger.info(`📥 Loading fresh data: ${cacheKey}`);
      const data = await import(`@/data/${stage}/${file}.json`);
      const words = (data.default ?? []) as Word[];

      // Validate data
      if (!Array.isArray(words) || words.length === 0) {
        throw new Error(`Invalid or empty data for ${cacheKey}`);
      }

      // Validate each word has required fields
      for (let i = 0; i < Math.min(5, words.length); i++) {
        const word = words[i];
        if (!word.word || !word.pos) {
          throw new Error(`Invalid word structure at index ${i} in ${cacheKey}`);
        }
      }

      // Cache the data
      this.setCache(cacheKey, words);
      this.setCacheStorage(`word_data_${cacheKey}`, words);

      return {
        success: true,
        data: words,
        error: null,
        fromCache: false,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errorLogger.error(
        `Failed to load data: ${cacheKey}`,
        error instanceof Error ? error : new Error(errorMsg),
        `stage=${stage}, file=${file}`
      );

      // Try to return cached data even if expired
      if (cachedData) {
        errorLogger.warn(`Using expired cache for ${cacheKey}`);
        return {
          success: false,
          data: cachedData,
          error: "Failed to load fresh data, using cached version",
          fromCache: true,
        };
      }

      return {
        success: false,
        data: [],
        error: `Could not load word data. Error: ${errorMsg}`,
        fromCache: false,
      };
    }
  }

  /**
   * Set in-memory cache
   */
  private setCache(key: string, data: Word[]): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.cacheTTL);
  }

  /**
   * Set localStorage cache
   */
  private setCacheStorage(key: string, data: Word[]): void {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(key, JSON.stringify(data));
      window.localStorage.setItem(
        `${key}_meta`,
        JSON.stringify({ expiry: Date.now() + this.cacheTTL })
      );
    } catch {
      errorLogger.warn(`Could not save to localStorage: ${key}`);
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();

    if (typeof window === "undefined") return;

    try {
      const keys = Object.keys(window.localStorage);
      keys.forEach((key) => {
        if (key.startsWith("word_data_")) {
          window.localStorage.removeItem(key);
        }
      });
    } catch {
      // localStorage access failed
    }
  }

  /**
   * Get cache stats for debugging
   */
  getStats() {
    return {
      inMemoryCacheSize: this.cache.size,
      cacheItems: Array.from(this.cache.keys()),
    };
  }
}

// Create singleton instance
export const dataLoader = new DataLoader();
