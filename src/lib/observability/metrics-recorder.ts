import { httpRequestCount, httpRequestDuration, errorCount } from '@/lib/observability/metrics';

/**
 * Utility to record HTTP request metrics.
 * Safe to call from both Node.js and Edge runtimes (though it will be a no-op on Edge).
 */
export function recordHttpRequest(method: string, route: string, statusCode: number, durationSeconds: number) {
  // prom-client only works in Node.js environment
  if (typeof process !== 'undefined' && process.release?.name === 'node') {
    httpRequestCount.inc({ method, route, status_code: statusCode });
    httpRequestDuration.observe({ method, route, status_code: statusCode }, durationSeconds);
  }
}

export function recordError(type: string, message: string) {
  if (typeof process !== 'undefined' && process.release?.name === 'node') {
    errorCount.inc({ type, message: message.substring(0, 50) }); // Truncate long messages
  }
}
