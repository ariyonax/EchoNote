const promClient = require('prom-client');

// Collect default metrics (CPU, memory, etc)
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeUsers = new promClient.Gauge({
  name: 'active_users_total',
  help: 'Total number of active users'
});

const transcriptionsTotal = new promClient.Counter({
  name: 'transcriptions_total',
  help: 'Total number of transcriptions processed'
});

module.exports = {
  promClient,
  httpRequestDuration,
  httpRequestTotal,
  activeUsers,
  transcriptionsTotal
};