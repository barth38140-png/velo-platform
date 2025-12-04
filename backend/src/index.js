require('dotenv').config();
/* src/index.js */
// Fail early in production if critical secrets are missing
if (process.env.NODE_ENV === 'production') {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret === 'change_this_secret') {
    const logger = require('./logger');
    logger.fatal('[startup] JWT_SECRET is not set or using the default value; refusing to start in production.');
    // Exit with non-zero code so orchestration systems detect the failure
    process.exit(1);
  }
}
const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./logger');
const pinoHttp = require('pino-http');
const { randomUUID } = require('crypto');
const { metricsMiddleware, getHealthMetrics } = require('./monitoring');
const { ContinuousImprovement } = require('./continuousImprovement');
const { AnomalyDetector } = require('./anomalyDetector');
const { NotificationService } = require('./notifications');

// Initialiser le monitoring continu
const anomalyDetector = new AnomalyDetector();
const notificationService = new NotificationService();
const continuousImprovement = new ContinuousImprovement({
  anomalyDetector,
  notifications: notificationService,
  enabled: process.env.CONTINUOUS_IMPROVEMENT_ENABLED !== 'false'
});

// Security headers avec configuration stricte
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite de 100 requêtes par IP
  message: 'Trop de requêtes, veuillez réessayer plus tard',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// CORS configuration - restrict to known origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];

const corsOptions = {
  origin: (origin, callback) => {
    // En dev, autoriser et refléter l'origine automatiquement
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    // En prod, vérifier sur liste blanche
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With','Accept','Origin','Referer'],
  exposedHeaders: ['x-request-id']
};
app.use(cors(corsOptions));
// Gérer les requêtes préflight OPTIONS avec regex (ajoute les bons headers CORS)
app.options(/.*/, cors(corsOptions));

// En développement, renforcer les en-têtes CORS pour éviter les échecs de préflight
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    const origin = req.headers.origin;
    if (!origin || allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    }
  }
  next();
});

/* AJOUT: body parser global with size limits */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Correlation ID middleware
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || randomUUID();
  res.setHeader('x-request-id', req.id);
  
  // Enregistrer la requête pour le monitoring
  const startTime = Date.now();
  
  res.on('finish', () => {
    const latency = Date.now() - startTime;
    continuousImprovement.recordRequest(req.method, req.path, latency, res.statusCode);
  });
  
  next();
  next();
});

// Request logging
app.use(pinoHttp({
  logger,
  customProps: (req) => ({ reqId: req.id }),
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      remoteAddress: req.remoteAddress,
      remotePort: req.remotePort
    }),
    res: (res) => ({
      statusCode: res.statusCode
    })
  },
  // Réduire la verbosité: ne pas logger les 2xx/3xx, prévenir sur 4xx, erreurs sur 5xx
  customLogLevel: (req, res, err) => {
    if (err) return 'error';
    const code = res.statusCode;
    if (code >= 500) return 'error';
    if (code >= 400) return 'warn';
    // 2xx/3xx: pas de log
    return 'silent';
  }
}));

// Metrics tracking
app.use(metricsMiddleware);

const userRoutes = require('../routes/userRoutes');
app.use('/api/users', userRoutes);

/* Rate limiting strict pour les routes sensibles */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limite de 5 tentatives
  message: 'Trop de tentatives de connexion, réessayez plus tard',
  skipSuccessfulRequests: true,
});

/* AJOUT: monter le router d'auth */
const authRoutes = require('../routes/authRoutes');
app.use('/api/auth', authLimiter, authRoutes);
const bookingsRouter = require('../routes/bookings');
app.use('/bookings', bookingsRouter);

/* Mount repairs API used by frontend E2E tests */
try {
  const repairRoutes = require('../routes/repairRoutes');
  app.use('/api/repairs', repairRoutes);
  logger.info('[startup] mounted /api/repairs');
} catch (e) {
  logger.error({ err: e }, '[startup] failed to mount /api/repairs');
}
// Mount bikes API
try {
  const bikeRoutes = require('../routes/bikeRoutes');
  app.use('/api/bikes', bikeRoutes);
  logger.info('[startup] mounted /api/bikes');
} catch (e) {
  logger.error({ err: e }, '[startup] failed to mount /api/bikes');
}
// Mount conversations API (messagerie)
try {
  const conversationRoutes = require('../routes/conversationRoutes');
  app.use('/api/conversations', conversationRoutes);
  logger.info('[startup] mounted /api/conversations');
} catch (e) {
  logger.error({ err: e }, '[startup] failed to mount /api/conversations');
}
// Mount repairers API for repairer profiles
try {
  const repairerRoutes = require('../routes/repairerRoutes');
  app.use('/api/repairers', repairerRoutes);
  logger.info('[startup] mounted /api/repairers');
} catch (e) {
  logger.error({ err: e }, '[startup] failed to mount /api/repairers');
}

// Attempt to mount repair-offers router (may be absent in some environments)
try {
  const repairOfferRoutes = require('../routes/repairOfferRoutes');
  app.use('/api/repair-offers', repairOfferRoutes);
} catch (e) {
  // if repair-offers routes are not present in this environment, ignore
}

// Mount brands API for shared brand suggestions
try {
  const brandRoutes = require('../routes/brandRoutes');
  app.use('/api/brands', brandRoutes);
  logger.info('[startup] mounted /api/brands');
} catch (e) {
  logger.error({ err: e }, '[startup] failed to mount /api/brands');
}

// Mount bike models API for model suggestions
try {
  const bikeModelRoutes = require('../routes/bikeModelRoutes');
  app.use('/api/bike-models', bikeModelRoutes);
  logger.info('[startup] mounted /api/bike-models');
} catch (e) {
  logger.error({ err: e }, '[startup] failed to mount /api/bike-models');
}

// Mount wheel sizes API for wheel dimension suggestions
try {
  const wheelSizeRoutes = require('../routes/wheelSizeRoutes');
  app.use('/api/wheel-sizes', wheelSizeRoutes);
  logger.info('[startup] mounted /api/wheel-sizes');
} catch (e) {
  logger.error({ err: e }, '[startup] failed to mount /api/wheel-sizes');
}

// Mount audit logs API (admin only)
try {
  const auditRoutes = require('../routes/auditRoutes');
  app.use('/api/audit', auditRoutes);
  logger.info('[startup] mounted /api/audit');
} catch (e) {
  logger.error({ err: e }, '[startup] failed to mount /api/audit');
}

// Mount reviews API for rating system
try {
  const reviewRoutes = require('../routes/reviewRoutes');
  app.use('/api/reviews', reviewRoutes);
  logger.info('[startup] mounted /api/reviews');
} catch (e) {
  logger.error({ err: e }, '[startup] failed to mount /api/reviews');
}

// Mount push notifications API
try {
  const pushRoutes = require('../routes/pushSubscriptionRoutes');
  app.use('/api/push', pushRoutes);
  logger.info('[startup] mounted /api/push');
} catch (e) {
  logger.error({ err: e }, '[startup] failed to mount /api/push');
}

// Mount availability slots API
try {
  const availabilityRoutes = require('../routes/availabilityRoutes');
  app.use('/api/availability', availabilityRoutes);
  logger.info('[startup] mounted /api/availability');
} catch (e) {
  logger.error({ err: e }, '[startup] failed to mount /api/availability');
}

// Mount metrics & monitoring API
try {
  const metricsRoutes = require('../routes/metricsRoutes')(continuousImprovement);
  app.use('/api/metrics', metricsRoutes);
  logger.info('[startup] mounted /api/metrics');
} catch (e) {
  logger.error({ err: e }, '[startup] failed to mount /api/metrics');
}

// NOTE: /api/velos alias removed to avoid duplicate mounts


app.get('/health', async (req, res) => {
  try {
    const metrics = await getHealthMetrics();
    
    // Check database connectivity
    let dbHealthy = false;
    try {
      await db.query('SELECT 1');
      dbHealthy = true;
    } catch (dbErr) {
      logger.error({ err: dbErr }, '[health] database check failed');
    }
    
    const health = {
      ...metrics,
      database: dbHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      },
      version: process.env.npm_package_version || '1.0.0'
    };
    
    const statusCode = (metrics.status === 'healthy' && dbHealthy) ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (e) {
    logger.error({ err: e }, '[health] failed to generate metrics');
    res.status(503).json({ status: 'error', message: 'health check failed' });
  }
});

// Centralized error handler (must be last)
const { errorHandler } = require('../middlewares/errorHandler');
app.use(errorHandler);

const http = require('http');
const { Server } = require('socket.io');
const PORT = process.env.PORT || 3000;
let server = null;
const db = require('./db');
let configDbPool = null;
try {
  configDbPool = require('../config/db');
} catch {
  configDbPool = null;
}

let io = null;
function start(port = PORT) {
  return new Promise((resolve, reject) => {
    if (server) return resolve(server);
    server = http.createServer(app);
    io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });
    app.set('io', io);

    // Gestion des événements Socket.io pour la messagerie
    io.on('connection', (socket) => {
      // Authentification simplifiée (à améliorer en prod)
      socket.on('join_conversation', ({ conversationId, userId }) => {
        socket.join(`conv-${conversationId}`);
      });
      socket.on('send_message', async ({ conversationId, senderId, content }) => {
        // Enregistrement du message en base
        const messageModel = require('../models/messageModel');
        const msg = await messageModel.sendMessage(conversationId, senderId, content);
        // Diffusion aux membres de la conversation
        io.to(`conv-${conversationId}`).emit('new_message', msg);
      });
    });

    server.listen(port, () => resolve(server)).on('error', reject);
  });
}

function stop() {
  return new Promise((resolve, reject) => {
    if (!server) return resolve();
    server.close(async err => {
      if (err) return reject(err);
      server = null;
      try {
        if (db && db.pool && typeof db.pool.end === 'function') {
          await db.pool.end();
        }
        if (configDbPool && typeof configDbPool.end === 'function') {
          await configDbPool.end();
        }
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });
}

if (require.main === module) {
  start()
    .then(async (server) => {
      // Démarrer le monitoring continu
      await continuousImprovement.start();

      // Gestion de l'arrêt gracieux
      process.on('SIGTERM', async () => {
        logger.info('SIGTERM reçu, arrêt gracieux...');
        await continuousImprovement.stop();
        await stop().catch(err => logger.error({ err }, 'Erreur lors de l\'arrêt'));
        process.exit(0);
      });

      process.on('SIGINT', async () => {
        logger.info('SIGINT reçu, arrêt gracieux...');
        await continuousImprovement.stop();
        await stop().catch(err => logger.error({ err }, 'Erreur lors de l\'arrêt'));
        process.exit(0);
      });
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { start, stop, app };










