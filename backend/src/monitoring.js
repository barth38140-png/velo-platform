const os = require('os');
const logger = require('./logger');
const db = require('./db');

let requestCount = 0;
let errorCount = 0;
const startTime = Date.now();

// Middleware to track metrics
function metricsMiddleware(req, res, next) {
  requestCount++;
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 500) errorCount++;
    
    // Log slow requests (>1s)
    if (duration > 1000) {
      logger.warn({ 
        reqId: req.id, 
        method: req.method, 
        url: req.url, 
        duration,
        statusCode: res.statusCode 
      }, '[metrics] slow request detected');
    }
  });
  
  next();
}

async function getHealthMetrics() {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const memUsage = process.memoryUsage();
  
  // Check database connection
  let dbHealthy = false;
  let dbLatency = null;
  try {
    const dbStart = Date.now();
    await db.query('SELECT 1');
    dbLatency = Date.now() - dbStart;
    dbHealthy = true;
  } catch (e) {
    logger.error({ err: e }, '[health] database check failed');
  }
  
  return {
    status: dbHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime,
    database: {
      connected: dbHealthy,
      latency_ms: dbLatency
    },
    memory: {
      rss_mb: Math.round(memUsage.rss / 1024 / 1024),
      heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
      external_mb: Math.round(memUsage.external / 1024 / 1024)
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      node_version: process.version,
      cpus: os.cpus().length,
      load_avg: os.loadavg(),
      free_mem_mb: Math.round(os.freemem() / 1024 / 1024),
      total_mem_mb: Math.round(os.totalmem() / 1024 / 1024)
    },
    metrics: {
      requests_total: requestCount,
      errors_total: errorCount,
      error_rate: requestCount > 0 ? (errorCount / requestCount * 100).toFixed(2) + '%' : '0%'
    }
  };
}

module.exports = {
  metricsMiddleware,
  getHealthMetrics
};
