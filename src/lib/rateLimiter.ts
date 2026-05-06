/**
 * Simple in-memory rate limiter for free tier
 * Tracks requests per user/IP and enforces limits
 * Automatically cleans up old entries
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private cleanupScheduled = false;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Check if request is allowed
   * @param key Unique identifier (user ID or IP)
   * @returns true if allowed, false if rate limited
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    this.scheduleCleanup();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // New window, reset counter
      this.store.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    // Check if under limit
    if (entry.count < this.maxRequests) {
      entry.count++;
      return true;
    }

    // Over limit
    return false;
  }

  /**
   * Get remaining requests
   */
  getRemaining(key: string): number {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  /**
   * Get reset time in seconds
   */
  getResetTime(key: string): number {
    const entry = this.store.get(key);
    if (!entry) {
      return 0;
    }
    const remaining = Math.max(0, entry.resetTime - Date.now());
    return Math.ceil(remaining / 1000);
  }

  /**
   * Clean up old entries
   */
  private cleanup(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    this.store.forEach((entry, key) => {
      if (now > entry.resetTime + this.windowMs) {
        entriesToDelete.push(key);
      }
    });

    entriesToDelete.forEach((key) => {
      this.store.delete(key);
    });
  }

  private scheduleCleanup(): void {
    if (this.cleanupScheduled) {
      return;
    }

    this.cleanupScheduled = true;
    setTimeout(() => {
      this.cleanupScheduled = false;
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Reset limit for a key
   */
  reset(key: string): void {
    this.store.delete(key);
  }
}

// Export instances for different rate limits
export const downloadLimiter = new RateLimiter(60000, 10); // 10 downloads per minute
export const paymentLimiter = new RateLimiter(60000, 5); // 5 payment requests per minute
export const uploadLimiter = new RateLimiter(60000, 3); // 3 uploads per minute

/**
 * Extract user ID or IP from request
 */
export function getClientKey(request: Request, userId?: string): string {
  if (userId) {
    return `user_${userId}`;
  }

  // Fallback to IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `ip_${ip}`;
}
