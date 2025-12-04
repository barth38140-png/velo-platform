// backend/routes/metricsRoutes.js
// Endpoints pour exposer les métriques de monitoring

const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

module.exports = (continuousImprovement) => {
  // Endpoint public: health check
  router.get('/health', (req, res) => {
    const metrics = continuousImprovement.getMetrics();
    const score = continuousImprovement.calculateHealthScore(metrics);
    
    const status = score >= 80 ? 'healthy' : (score >= 60 ? 'degraded' : 'critical');
    const statusCode = score >= 80 ? 200 : 503;

    res.status(statusCode).json({
      status,
      score,
      metrics,
      timestamp: new Date().toISOString()
    });
  });

  // Endpoint admin: métriques détaillées
  router.get('/metrics', auth, isAdmin, (req, res) => {
    const metrics = continuousImprovement.getMetrics();
    const baseline = continuousImprovement.config.anomalyDetector.getBaseline();
    const history = continuousImprovement.config.anomalyDetector.getHistory(50);

    res.json({
      current: metrics,
      baseline,
      history,
      timestamp: new Date().toISOString()
    });
  });

  // Endpoint admin: recommandations
  router.get('/recommendations', auth, isAdmin, (req, res) => {
    const metrics = continuousImprovement.getMetrics();
    const recommendations = continuousImprovement.generateRecommendations(metrics);

    res.json({
      recommendations,
      healthScore: continuousImprovement.calculateHealthScore(metrics),
      timestamp: new Date().toISOString()
    });
  });

  return router;
};
