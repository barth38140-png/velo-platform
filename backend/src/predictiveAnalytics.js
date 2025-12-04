// backend/src/predictiveAnalytics.js
// Module de prédictions ML pour anticipation des anomalies

const logger = require('./logger');

class PredictiveAnalytics {
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled !== false,
      windowSize: config.windowSize || 1000,
      forecastHorizon: config.forecastHorizon || 24, // 24 heures
      confidenceLevel: config.confidenceLevel || 0.95,
      ...config
    };

    this.metrics = {
      errorRates: [],
      latencies: [],
      cpuUsage: [],
      memoryUsage: [],
      requestCounts: []
    };

    this.forecasts = {
      errorRate: null,
      latency: null,
      requestVolume: null
    };

    this.lastForecastTime = null;
  }

  recordMetric(type, value) {
    if (!this.metrics[type]) {
      logger.warn(`Métrique inconnue: ${type}`);
      return;
    }

    this.metrics[type].push({
      value,
      timestamp: Date.now()
    });

    // Garder seulement les N derniers points
    if (this.metrics[type].length > this.config.windowSize) {
      this.metrics[type].shift();
    }
  }

  async generateForecast() {
    try {
      // Implémentation simplifiée (Prophet serait utilisé en production)
      const errorRateForecast = this.simpleExponentialSmoothing(
        this.metrics.errorRates.map(m => m.value),
        0.3
      );

      const latencyForecast = this.simpleExponentialSmoothing(
        this.metrics.latencies.map(m => m.value),
        0.2
      );

      const volumeForecast = this.simpleExponentialSmoothing(
        this.metrics.requestCounts.map(m => m.value),
        0.4
      );

      this.forecasts = {
        errorRate: {
          predicted: errorRateForecast.predicted,
          confidence: {
            lower: Math.max(0, errorRateForecast.predicted * 0.8),
            upper: errorRateForecast.predicted * 1.2
          },
          trend: errorRateForecast.trend
        },
        latency: {
          predicted: latencyForecast.predicted,
          confidence: {
            lower: Math.max(0, latencyForecast.predicted * 0.8),
            upper: latencyForecast.predicted * 1.2
          },
          trend: latencyForecast.trend
        },
        requestVolume: {
          predicted: Math.round(volumeForecast.predicted),
          confidence: {
            lower: Math.max(0, Math.round(volumeForecast.predicted * 0.8)),
            upper: Math.round(volumeForecast.predicted * 1.2)
          },
          trend: volumeForecast.trend
        }
      };

      this.lastForecastTime = new Date();

      logger.debug({ forecasts: this.forecasts }, '🔮 Prédictions générées');

      return this.forecasts;
    } catch (error) {
      logger.error({ error }, '❌ Erreur lors de la génération des prédictions');
      return null;
    }
  }

  // Algorithme simple d'exponential smoothing
  simpleExponentialSmoothing(values, alpha = 0.3) {
    if (values.length === 0) {
      return { predicted: 0, trend: 'stable' };
    }

    let s = values[0];

    for (let i = 1; i < values.length; i++) {
      s = alpha * values[i] + (1 - alpha) * s;
    }

    // Détecter la tendance
    const recent = values.slice(-20);
    const older = values.slice(-40, -20);

    const recentAvg = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
    const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : 0;

    let trend = 'stable';
    if (recentAvg > olderAvg * 1.1) {
      trend = 'increasing';
    } else if (recentAvg < olderAvg * 0.9) {
      trend = 'decreasing';
    }

    return {
      predicted: parseFloat(s.toFixed(2)),
      trend
    };
  }

  // Détection d'anomalies basée sur les écarts-types
  detectAnomaliesByStdDev(values, threshold = 2.5) {
    if (values.length < 10) {
      return [];
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const anomalies = [];

    for (let i = 0; i < values.length; i++) {
      const zScore = Math.abs((values[i] - mean) / stdDev);

      if (zScore > threshold) {
        anomalies.push({
          index: i,
          value: values[i],
          zScore: parseFloat(zScore.toFixed(2)),
          expectedRange: {
            lower: mean - threshold * stdDev,
            upper: mean + threshold * stdDev
          }
        });
      }
    }

    return anomalies;
  }

  // Détection de cycles/saisonnalité
  detectSeasonality(values, seasonLength = 24) {
    if (values.length < seasonLength * 2) {
      return null;
    }

    const correlations = [];

    for (let lag = 1; lag <= seasonLength; lag++) {
      const correlation = this.calculateCorrelation(values, values.slice(lag));
      correlations.push({ lag, correlation });
    }

    // Trouver le lag avec la plus forte corrélation
    const strongest = correlations.reduce((max, curr) =>
      curr.correlation > max.correlation ? curr : max
    );

    return {
      seasonLength: strongest.lag,
      strength: parseFloat(strongest.correlation.toFixed(2)),
      detectable: strongest.correlation > 0.5
    };
  }

  calculateCorrelation(array1, array2) {
    const minLength = Math.min(array1.length, array2.length);
    const arr1 = array1.slice(0, minLength);
    const arr2 = array2.slice(0, minLength);

    const mean1 = arr1.reduce((a, b) => a + b, 0) / minLength;
    const mean2 = arr2.reduce((a, b) => a + b, 0) / minLength;

    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;

    for (let i = 0; i < minLength; i++) {
      const diff1 = arr1[i] - mean1;
      const diff2 = arr2[i] - mean2;

      numerator += diff1 * diff2;
      denominator1 += diff1 * diff1;
      denominator2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(denominator1 * denominator2);

    return denominator === 0 ? 0 : numerator / denominator;
  }

  // Recommandations basées sur les prédictions
  generateRecommendations() {
    const recommendations = [];

    if (!this.forecasts.errorRate) {
      return recommendations;
    }

    // Recommandations basées sur la tendance d'erreur
    if (this.forecasts.errorRate.trend === 'increasing') {
      recommendations.push({
        type: 'ERROR_TREND_INCREASING',
        severity: 'HIGH',
        title: 'Taux d\'erreur en augmentation',
        description: 'Les erreurs augmentent. Vérifier les logs et déploiements récents.',
        action: 'Analyser les erreurs et identifier la cause racine',
        priority: 1
      });
    }

    // Recommandations basées sur la tendance de latence
    if (this.forecasts.latency.trend === 'increasing') {
      recommendations.push({
        type: 'LATENCY_TREND_INCREASING',
        severity: 'MEDIUM',
        title: 'Latence en augmentation',
        description: 'Les temps de réponse augmentent. Considérer un scaling ou une optimisation.',
        action: 'Optimiser les requêtes lentes et les index DB',
        priority: 2
      });
    }

    // Recommandations de capacité
    if (this.forecasts.requestVolume.trend === 'increasing') {
      recommendations.push({
        type: 'CAPACITY_PLANNING',
        severity: 'MEDIUM',
        title: 'Volume de requêtes en augmentation',
        description: 'La charge augmente. Planifier un scaling horizontal.',
        action: 'Augmenter la capacité des instances ou du cluster',
        priority: 3
      });
    }

    return recommendations;
  }

  getMetricsSnapshot() {
    return {
      errorRateCount: this.metrics.errorRates.length,
      latencyCount: this.metrics.latencies.length,
      requestCountCount: this.metrics.requestCounts.length,
      lastForecastTime: this.lastForecastTime,
      forecasts: this.forecasts
    };
  }
}

module.exports = { PredictiveAnalytics };
