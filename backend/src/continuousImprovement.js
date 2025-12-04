// backend/src/monitoring.js
// Module d'amélioration continue et monitoring autonome

const logger = require('./logger');
const { AnomalyDetector } = require('./anomalyDetector');
const { NotificationService } = require('./notifications');
const fs = require('fs').promises;
const path = require('path');

class ContinuousImprovement {
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled !== false,
      checkInterval: config.checkInterval || 60000, // 1 minute
      metricsFile: config.metricsFile || path.join(__dirname, '../metrics/current.json'),
      anomalyDetector: config.anomalyDetector || new AnomalyDetector(),
      notifications: config.notifications || new NotificationService(),
      ...config
    };

    this.metrics = {
      startTime: new Date(),
      requests: 0,
      errors: 0,
      avgLatency: 0,
      lastCheck: null
    };

    this.latencies = [];
    this.errors = [];
  }

  async start() {
    if (!this.config.enabled) {
      logger.info('Continuous improvement monitoring est désactivé');
      return;
    }

    logger.info('🚀 Démarrage du monitoring continu d\'amélioration...');

    // Lancer la collection de metrics
    this.metricsInterval = setInterval(() => this.checkHealth(), this.config.checkInterval);

    // Rapport journalier
    this.dailyInterval = setInterval(() => this.generateDailyReport(), 24 * 60 * 60 * 1000);

    logger.info('✅ Monitoring continu actif');
  }

  async stop() {
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    if (this.dailyInterval) clearInterval(this.dailyInterval);
    logger.info('🛑 Monitoring continu arrêté');
  }

  // Enregistrer une requête
  recordRequest(method, route, latency, statusCode) {
    this.metrics.requests++;
    this.latencies.push(latency);

    if (statusCode >= 400) {
      this.metrics.errors++;
      this.errors.push({ method, route, statusCode, timestamp: new Date() });
    }

    // Garder seulement les 100 dernières latences
    if (this.latencies.length > 100) {
      this.latencies.shift();
    }

    // Garder seulement les 50 dernières erreurs
    if (this.errors.length > 50) {
      this.errors.shift();
    }
  }

  // Vérifier la santé du système
  async checkHealth() {
    try {
      const currentMetrics = this.calculateMetrics();
      const anomalies = await this.config.anomalyDetector.analyze(currentMetrics);

      if (anomalies.length > 0) {
        logger.warn({ anomalies }, '⚠️  Anomalies détectées');
        await this.handleAnomalies(anomalies);
      }

      // Sauvegarder les métriques
      await this.saveMetrics(currentMetrics);

      this.metrics.lastCheck = new Date();
    } catch (error) {
      logger.error({ error }, 'Erreur lors du check de santé');
    }
  }

  calculateMetrics() {
    const avgLatency = this.latencies.length > 0
      ? this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length
      : 0;

    const p95Latency = this.latencies.length > 0
      ? this.latencies.sort((a, b) => a - b)[Math.floor(this.latencies.length * 0.95)]
      : 0;

    const errorRate = this.metrics.requests > 0
      ? (this.metrics.errors / this.metrics.requests) * 100
      : 0;

    return {
      timestamp: new Date(),
      uptime: Math.round((new Date() - this.metrics.startTime) / 1000),
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: errorRate.toFixed(2),
      avgLatency: Math.round(avgLatency),
      p95Latency: Math.round(p95Latency),
      recentErrors: this.errors.slice(-10)
    };
  }

  async handleAnomalies(anomalies) {
    for (const anomaly of anomalies) {
      logger.error({ anomaly }, `🚨 Anomalie ${anomaly.severity}: ${anomaly.type}`);

      // Envoyer notification
      await this.config.notifications.sendAlert(anomaly);

      // Auto-fix si possible
      if (anomaly.autoFixable) {
        await this.executeAutoFix(anomaly);
      }
    }
  }

  async executeAutoFix(anomaly) {
    logger.info(`🔧 Tentative de auto-fix: ${anomaly.type}`);

    try {
      switch (anomaly.type) {
        case 'HIGH_ERROR_RATE':
          // Nettoyer les logs anciens
          await this.cleanOldLogs();
          break;

        case 'HIGH_LATENCY':
          // Pas d'auto-fix possible, juste alerte
          break;

        default:
          logger.debug(`Pas de fix automatique pour: ${anomaly.type}`);
      }
    } catch (error) {
      logger.error({ error }, 'Erreur lors du auto-fix');
    }
  }

  async cleanOldLogs() {
    try {
      const logsDir = path.join(__dirname, '../logs');
      const files = await fs.readdir(logsDir);
      const now = new Date();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours

      for (const file of files) {
        const filePath = path.join(logsDir, file);
        const stats = await fs.stat(filePath);
        if (now - stats.mtime > maxAge) {
          await fs.unlink(filePath);
          logger.info(`Logs supprimés: ${file}`);
        }
      }
    } catch (error) {
      logger.error({ error }, 'Erreur lors du nettoyage des logs');
    }
  }

  async saveMetrics(metrics) {
    try {
      const dir = path.dirname(this.config.metricsFile);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.config.metricsFile, JSON.stringify(metrics, null, 2));
    } catch (error) {
      logger.debug({ error }, 'Impossible de sauvegarder les metrics');
    }
  }

  async generateDailyReport() {
    logger.info('📊 Génération du rapport quotidien...');

    const metrics = this.calculateMetrics();
    const report = {
      date: new Date().toISOString().split('T')[0],
      metrics,
      summary: {
        healthScore: this.calculateHealthScore(metrics),
        issues: this.errors.slice(-20),
        recommendations: this.generateRecommendations(metrics)
      }
    };

    logger.info({ report }, '📈 Rapport quotidien généré');

    // Envoyer via notification
    if (report.summary.healthScore < 80) {
      await this.config.notifications.sendDailyReport(report);
    }
  }

  calculateHealthScore(metrics) {
    const errorRatePenalty = Math.min(metrics.errorRate * 2, 50);
    const latencyPenalty = Math.min((metrics.p95Latency / 1000) * 5, 30);

    return Math.max(0, 100 - errorRatePenalty - latencyPenalty);
  }

  generateRecommendations(metrics) {
    const recommendations = [];

    if (metrics.errorRate > 1) {
      recommendations.push({
        priority: 'HIGH',
        message: 'Taux d\'erreur élevé détecté',
        action: 'Vérifier les logs d\'erreur récents'
      });
    }

    if (metrics.p95Latency > 1000) {
      recommendations.push({
        priority: 'MEDIUM',
        message: 'Latence P95 élevée',
        action: 'Analyser les queries lentes'
      });
    }

    if (metrics.uptime > 7 * 24 * 3600 && metrics.requests > 0) {
      recommendations.push({
        priority: 'LOW',
        message: 'Uptime long sans redémarrage',
        action: 'Planifier un redémarrage gracieux'
      });
    }

    return recommendations;
  }

  getMetrics() {
    return {
      ...this.calculateMetrics(),
      lastCheck: this.metrics.lastCheck
    };
  }
}

module.exports = { ContinuousImprovement };
