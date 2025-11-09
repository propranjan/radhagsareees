/**
 * Redis-based Rate Limiting using Token Bucket Algorithm
 * Implements rate limiting for API endpoints with Redis storage
 */

import Redis from 'ioredis';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  keyGenerator?: (identifier: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

/**
 * Redis client singleton
 */
class RedisClient {
  private static instance: Redis | null = null;
  
  static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis(
        process.env.REDIS_URL || 'redis://localhost:6379',
        {
          retryDelayOnFailover: 100,
          enableReadyCheck: false,
          maxRetriesPerRequest: null,
          lazyConnect: true,
        }
      );
    }
    return RedisClient.instance;
  }
}

/**
 * Token bucket implementation using Redis
 */
export class TokenBucket {
  private redis: Redis;
  private capacity: number;
  private refillRate: number; // tokens per second
  private windowMs: number;

  constructor(capacity: number, refillRate: number, windowMs: number = 60000) {
    this.redis = RedisClient.getInstance();
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.windowMs = windowMs;
  }

  /**
   * Consume tokens from bucket
   */
  async consume(key: string, tokens: number = 1): Promise<RateLimitResult> {
    const bucketKey = `rate_limit:${key}`;
    const now = Date.now();
    
    // Lua script for atomic token bucket operations
    const luaScript = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refillRate = tonumber(ARGV[2])
      local windowMs = tonumber(ARGV[3])
      local tokens = tonumber(ARGV[4])
      local now = tonumber(ARGV[5])
      
      -- Get current bucket state
      local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
      local currentTokens = tonumber(bucket[1]) or capacity
      local lastRefill = tonumber(bucket[2]) or now
      
      -- Calculate tokens to add based on time elapsed
      local timeElapsed = math.max(0, now - lastRefill)
      local tokensToAdd = math.floor((timeElapsed / 1000) * refillRate)
      currentTokens = math.min(capacity, currentTokens + tokensToAdd)
      
      -- Check if we can consume the requested tokens
      local allowed = currentTokens >= tokens
      local remaining = currentTokens
      
      if allowed then
        remaining = currentTokens - tokens
      end
      
      -- Update bucket state
      redis.call('HMSET', key, 'tokens', remaining, 'lastRefill', now)
      redis.call('EXPIRE', key, math.ceil(windowMs / 1000))
      
      return {allowed and 1 or 0, remaining, now + windowMs, currentTokens}
    `;

    try {
      const result = await this.redis.eval(
        luaScript,
        1,
        bucketKey,
        this.capacity.toString(),
        this.refillRate.toString(),
        this.windowMs.toString(),
        tokens.toString(),
        now.toString()
      ) as [number, number, number, number];

      return {
        allowed: result[0] === 1,
        remaining: result[1],
        resetTime: result[2],
        totalHits: this.capacity - result[1] + (result[0] === 1 ? tokens : 0)
      };
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        remaining: this.capacity,
        resetTime: now + this.windowMs,
        totalHits: 1
      };
    }
  }
}

/**
 * Sliding window rate limiter
 */
export class SlidingWindowRateLimiter {
  private redis: Redis;
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.redis = RedisClient.getInstance();
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async isAllowed(key: string): Promise<RateLimitResult> {
    const windowKey = `sliding_window:${key}`;
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const luaScript = `
      local key = KEYS[1]
      local windowStart = tonumber(ARGV[1])
      local now = tonumber(ARGV[2])
      local maxRequests = tonumber(ARGV[3])
      
      -- Remove expired entries
      redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
      
      -- Count current requests in window
      local currentCount = redis.call('ZCARD', key)
      
      -- Check if request is allowed
      local allowed = currentCount < maxRequests
      
      if allowed then
        -- Add current request
        redis.call('ZADD', key, now, now)
        currentCount = currentCount + 1
      end
      
      -- Set expiration
      redis.call('EXPIRE', key, math.ceil(${this.windowMs} / 1000))
      
      return {allowed and 1 or 0, maxRequests - currentCount, now + ${this.windowMs}, currentCount}
    `;

    try {
      const result = await this.redis.eval(
        luaScript,
        1,
        windowKey,
        windowStart.toString(),
        now.toString(),
        this.maxRequests.toString()
      ) as [number, number, number, number];

      return {
        allowed: result[0] === 1,
        remaining: Math.max(0, result[1]),
        resetTime: result[2],
        totalHits: result[3]
      };
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open
      return {
        allowed: true,
        remaining: this.maxRequests,
        resetTime: now + this.windowMs,
        totalHits: 1
      };
    }
  }
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimiter(config: RateLimitConfig) {
  const limiter = new SlidingWindowRateLimiter(config.windowMs, config.max);

  return async function rateLimitMiddleware(
    identifier: string,
    request?: any
  ): Promise<RateLimitResult> {
    const key = config.keyGenerator ? config.keyGenerator(identifier) : identifier;
    
    return await limiter.isAllowed(key);
  };
}

/**
 * Pre-configured rate limiters for different endpoint types
 */
export const rateLimiters = {
  // Strict limits for write operations
  writeOperations: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per 15 minutes
    message: 'Too many write requests, please try again later'
  }),

  // Moderate limits for reviews
  reviews: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 reviews per hour
    message: 'Too many reviews submitted, please try again later'
  }),

  // Checkout operations
  checkout: createRateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3, // 3 checkout attempts per 10 minutes
    message: 'Too many checkout attempts, please wait before trying again'
  }),

  // API endpoints (general)
  api: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many API requests, please try again later'
  }),

  // Authentication endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    message: 'Too many login attempts, please try again later'
  }),

  // File uploads
  uploads: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
    message: 'Too many file uploads, please try again later'
  })
};

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: any): string {
  // Try to get user ID if authenticated
  const userId = request.auth?.userId || request.user?.id;
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 
             request.headers.get('x-real-ip') || 
             request.ip || 
             'unknown';
  
  return `ip:${ip}`;
}

/**
 * Rate limiting middleware for Next.js API routes
 */
export function withRateLimit(
  rateLimiter: (identifier: string, request?: any) => Promise<RateLimitResult>,
  options: {
    keyGenerator?: (request: any) => string;
    onLimitReached?: (result: RateLimitResult) => any;
  } = {}
) {
  return function <T extends Function>(handler: T): T {
    return (async (request: any, ...args: any[]) => {
      try {
        const identifier = options.keyGenerator ? 
          options.keyGenerator(request) : 
          getClientIdentifier(request);

        const result = await rateLimiter(identifier, request);

        // Add rate limit headers
        const response = result.allowed ? 
          await handler(request, ...args) : 
          (options.onLimitReached ? 
            options.onLimitReached(result) :
            new Response(
              JSON.stringify({
                error: 'Rate limit exceeded',
                message: 'Too many requests, please try again later',
                resetTime: result.resetTime
              }),
              {
                status: 429,
                headers: {
                  'Content-Type': 'application/json',
                  'X-RateLimit-Limit': '10',
                  'X-RateLimit-Remaining': result.remaining.toString(),
                  'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
                  'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
                }
              }
            )
          );

        // Add rate limit headers to successful responses
        if (response && typeof response === 'object' && 'headers' in response) {
          response.headers.set('X-RateLimit-Limit', '10');
          response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
          response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
        }

        return response;
      } catch (error) {
        console.error('Rate limiting middleware error:', error);
        // Continue to handler if rate limiting fails
        return handler(request, ...args);
      }
    }) as T;
  };
}