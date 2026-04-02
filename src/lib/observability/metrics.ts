import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

// Create a Registry which registers the metrics
const register = new Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'school-erp-system'
});

// Enable the collection of default metrics
collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestCount = new Counter({
  name: 'http_request_count',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10], // Request duration buckets
  registers: [register],
});

export const errorCount = new Counter({
  name: 'error_count',
  help: 'Total number of errors',
  labelNames: ['type', 'message'],
  registers: [register],
});

export { register };
