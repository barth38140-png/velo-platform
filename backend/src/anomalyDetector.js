// backend/src/anomalyDetector.js
// Détection automatique d'anomalies et patterns

const logger = require('./logger');

class AnomalyDetector {
  constructor(config = {}) {
    this.config = {
      errorRateThreshold: config.errorRateThreshold || 1, // > 1%
      latencyThreshold: config.latencyThreshold || 2000, // > 2000ms
      errorSpikeThreshold: config.errorSpikeThreshold || 0.5, // +50%
      minDataPoints: config.minDataPoints || 10,
      ...config
    };

    this.baseline = {
      errorRate: 0,
      avgLatency: 0,
      lastUpdate: new Date()
    };

    this.history = [];
  }

  async analyze(metrics) {
    const anomalies = [];

    // Vérifier les seuils absolus
    if (metrics.errorRate > this.config.errorRateThreshold) {
      anomalies.push({
        type: 'HIGH_ERROR_RATE',
        severity: 'HIGH',
        message: `Taux d'erreur élevé: ${metrics.errorRate}%`,
        value: metrics.errorRate,
        threshold: this.config.errorRateThreshold,
        autoFixable: true,
        timestamp: new Date()
      });
    }

    if (metrics.p95Latency > this.config.latencyThreshold) {
      anomalies.push({
        type: 'HIGH_LATENCY',
        severity: 'MEDIUM',
        message: `Latence P95 élevée: ${metrics.p95Latency}ms`,
        value: metrics.p95Latency,
        threshold: this.config.latencyThreshold,
        autoFixable: false,
        timestamp: new Date()
      });
    }

    // Vérifier les tendances
    if (this.history.length >= this.config.minDataPoints) {
      const trendAnomalies = this.detectTrends(metrics);
      anomalies.push(...trendAnomalies);
    }

    // Mettre à jour l'historique
    this.history.push({
      ...metrics,
      timestamp: new Date()
    });

    // Garder les 1000 dernières métriques
    if (this.history.length > 1000) {
      this.history.shift();
    }

    // Mettre à jour la baseline tous les 100 points
    if (this.history.length % 100 === 0) {
      this.updateBaseline();
    }

    return anomalies;
  }

  detectTrends(metrics) {
    const anomalies = [];
    const recentHistory = this.history.slice(-10);

    // Tendance d'erreurs croissantes
    const errorTrend = this.calculateTrend(recentHistory.map(h => h.errorRate));
    if (errorTrend > 0.1) { // Croissance de 10% par point
      const errorIncrease = ((metrics.errorRate - this.baseline.errorRate) / this.baseline.errorRate) * 100;
      if (errorIncrease > this.config.errorSpikeThreshold * 100) {
        anomalies.push({
          type: 'ERROR_SPIKE',
          severity: 'HIGH',
          message: `Pic d'erreurs: +${errorIncrease.toFixed(0)}%`,
          value: errorIncrease,
          autoFixable: false,
          timestamp: new Date()
        });
      }
    }

    // Tendance de latence croissante
    const latencyTrend = this.calculateTrend(recentHistory.map(h => h.avgLatency));
    if (latencyTrend > 50) { // Croissance de 50ms par point
      anomalies.push({
        type: 'LATENCY_DEGRADATION',
        severity: 'MEDIUM',
        message: `Dégradation de latence détectée`,
        value: latencyTrend,
        autoFixable: false,
        timestamp: new Date()
      });
    }

    return anomalies;
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;

    // Régression linéaire simple
    const n = values.length;
    const sumX = n * (n - 1) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  updateBaseline() {
    if (this.history.length === 0) return;

    const recentHistory = this.history.slice(-100);
    const avgErrorRate = recentHistory.reduce((sum, h) => sum + parseFloat(h.errorRate), 0) / recentHistory.length;
    const avgLatency = recentHistory.reduce((sum, h) => sum + h.avgLatency, 0) / recentHistory.length;

    this.baseline = {
      errorRate: avgErrorRate,
      avgLatency: avgLatency,
      lastUpdate: new Date()
    };

    logger.debug({
      baseline: this.baseline
    }, 'Baseline mise à jour');
  }

  getBaseline() {
    return { ...this.baseline };
  }

  getHistory(limit = 100) {
    return this.history.slice(-limit);
  }
}

module.exports = { AnomalyDetector };
