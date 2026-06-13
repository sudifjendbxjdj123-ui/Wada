/**
 * Retry with Exponential Backoff — Resilient API calls
 *
 * Automatically retries failed requests with exponential backoff
 * Perfect for unreliable networks and rate limiting
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, delay: number, error: Error) => void;
  onGiveUp?: (error: Error) => void;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  onRetry: () => {},
  onGiveUp: () => {},
  shouldRetry: (error, attempt) => {
    // Only retry on network errors or 5xx server errors
    if (error instanceof TypeError) return true; // Network error
    if (error.message.includes("abort") || error.name === "AbortError") return true;
    return false;
  },
};

/**
 * Sleep for given milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff + jitter
 */
function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  multiplier: number,
): number {
  // exponential: 500ms, 1s, 2s, 4s...
  const exponentialDelay = initialDelayMs * Math.pow(multiplier, attempt);

  // Cap at max
  const capped = Math.min(exponentialDelay, maxDelayMs);

  // Add jitter (±10%)
  const jitter = capped * 0.1 * (Math.random() * 2 - 1);

  return Math.round(capped + jitter);
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn Function to retry
 * @param options Retry configuration
 * @returns Result of successful function call
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Try to execute
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // No more retries
      if (attempt === config.maxRetries) {
        config.onGiveUp(lastError);
        throw lastError;
      }

      // Check if we should retry
      if (!config.shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      // Calculate backoff
      const delay = calculateDelay(
        attempt,
        config.initialDelayMs,
        config.maxDelayMs,
        config.backoffMultiplier,
      );

      config.onRetry(attempt + 1, delay, lastError);
      console.warn(
        `[retryWithBackoff] Attempt ${attempt + 1}/${config.maxRetries} failed, retrying in ${delay}ms`,
        lastError.message,
      );

      // Wait before retry
      await sleep(delay);
    }
  }

  // Should never reach here
  throw lastError || new Error("Unknown retry error");
}

/**
 * Simpler version for API fetches
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit & { maxRetries?: number; timeout?: number },
): Promise<Response> {
  const { maxRetries = 3, timeout = 5000, ...fetchOptions } = options || {};

  return retryWithBackoff(
    async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const res = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        if (!res.ok) {
          // Don't retry on 4xx errors
          if (res.status >= 400 && res.status < 500) {
            throw new Error(`HTTP ${res.status}`);
          }

          // Retry on 5xx
          throw new Error(`HTTP ${res.status}`);
        }

        return res;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    {
      maxRetries,
      initialDelayMs: 300,
      shouldRetry: (error, attempt) => {
        // Retry on timeout or network errors
        if (error.name === "AbortError") return true;
        if (error instanceof TypeError) return true;

        // Retry on 5xx
        const statusMatch = error.message.match(/HTTP (\d+)/);
        if (statusMatch) {
          const status = parseInt(statusMatch[1]);
          return status >= 500;
        }

        return false;
      },
    },
  );
}

/**
 * Example usage:
 *
 * // Basic retry
 * const result = await retryWithBackoff(async () => {
 *   return await fetch('/api/products?color=red');
 * });
 *
 * // With custom config
 * const result = await retryWithBackoff(
 *   async () => someApi(),
 *   {
 *     maxRetries: 5,
 *     initialDelayMs: 1000,
 *     maxDelayMs: 30000,
 *     onRetry: (attempt, delay) => {
 *       console.log(`Retrying attempt ${attempt}, waiting ${delay}ms`);
 *     },
 *   }
 * );
 *
 * // For fetch
 * const res = await fetchWithRetry('/api/data', { maxRetries: 3 });
 * const data = await res.json();
 */
