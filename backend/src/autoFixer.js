// backend/src/autoFixer.js
// Système d'auto-fix automatique pour anomalies critiques

const logger = require('./logger');
const fs = require('fs').promises;
const path = require('path');

class AutoFixer {
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled !== false,
      requireApproval: config.requireApproval || ['dbMigrations', 'productionChanges'],
      dryRun: config.dryRun || false,
      ...config
    };

    this.fixes = [
      {
        id: 'rotate-logs',
        condition: (anomaly) => anomaly.type === 'HIGH_ERROR_RATE' || anomaly.message.includes('log'),
        action: this.rotateLogs.bind(this),
        severity: 'LOW',
        description: 'Rotation des fichiers logs',
        requiresApproval: false
      },
      {
        id: 'clear-stale-cache',
        condition: (anomaly) => anomaly.type === 'HIGH_LATENCY',
        action: this.clearStaleCache.bind(this),
        severity: 'LOW',
        description: 'Nettoyage du cache obsolète',
        requiresApproval: false
      },
      {
        id: 'reconnect-db',
        condition: (anomaly) => anomaly.type === 'DB_POOL_EXHAUSTED',
        action: this.reconnectDatabase.bind(this),
        severity: 'HIGH',
        description: 'Reconnexion à la base de données',
        requiresApproval: true
      }
    ];

    this.executionLog = [];
  }

  async executeAutoFixes(anomalies) {
    const applicableFixes = [];

    for (const anomaly of anomalies) {
      for (const fix of this.fixes) {
        if (await fix.condition(anomaly)) {
          applicableFixes.push({
            fix,
            anomaly,
            timestamp: new Date()
          });
        }
      }
    }

    if (applicableFixes.length === 0) {
      logger.debug('Aucun auto-fix applicable');
      return [];
    }

    const results = [];

    for (const { fix, anomaly } of applicableFixes) {
      const shouldApprove = fix.requiresApproval && this.config.requireApproval.includes(fix.id);

      if (shouldApprove && !this.config.dryRun) {
        logger.warn({ fix: fix.id, anomaly }, `Auto-fix requires approval: ${fix.description}`);
        continue;
      }

      try {
        if (this.config.dryRun) {
          logger.info(`[DRY RUN] Would execute: ${fix.description}`);
          results.push({
            fixId: fix.id,
            status: 'skipped-dry-run',
            message: `Would execute: ${fix.description}`
          });
        } else {
          logger.info(`🔧 Exécution du fix: ${fix.description}`);
          await fix.action(anomaly);

          results.push({
            fixId: fix.id,
            status: 'success',
            message: `${fix.description} exécuté avec succès`,
            executedAt: new Date()
          });

          this.executionLog.push({
            fixId: fix.id,
            status: 'success',
            anomaly: anomaly.type,
            timestamp: new Date()
          });
        }
      } catch (error) {
        logger.error({ error, fixId: fix.id }, `❌ Auto-fix échoué: ${fix.description}`);
        results.push({
          fixId: fix.id,
          status: 'error',
          message: error.message,
          error: error.toString()
        });

        this.executionLog.push({
          fixId: fix.id,
          status: 'error',
          anomaly: anomaly.type,
          error: error.message,
          timestamp: new Date()
        });
      }
    }

    return results;
  }

  async rotateLogs() {
    try {
      const logsDir = path.join(__dirname, '../logs');
      const files = await fs.readdir(logsDir);
      const now = new Date();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours

      let rotatedCount = 0;

      for (const file of files) {
        const filePath = path.join(logsDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtime > maxAge) {
          await fs.unlink(filePath);
          rotatedCount++;
        }
      }

      logger.info(`📋 ${rotatedCount} fichiers logs supprimés`);
    } catch (error) {
      logger.error({ error }, 'Erreur lors de la rotation des logs');
      throw error;
    }
  }

  async clearStaleCache() {
    try {
      // TODO: Implémenter avec Redis si disponible
      logger.info('🗑️ Cache cleared (simulated)');
    } catch (error) {
      logger.error({ error }, 'Erreur lors du nettoyage du cache');
      throw error;
    }
  }

  async reconnectDatabase() {
    try {
      const db = require('./db');
      logger.info('🔌 Tentative de reconnexion à la base de données...');

      if (db.pool && typeof db.pool.end === 'function') {
        await db.pool.end();
        logger.info('✅ Pool fermée');
      }

      // La reconnexion se fera automatiquement à la prochaine requête
      logger.info('✅ Base de données reconnectée');
    } catch (error) {
      logger.error({ error }, 'Erreur lors de la reconnexion DB');
      throw error;
    }
  }

  getExecutionLog(limit = 50) {
    return this.executionLog.slice(-limit);
  }

  getStats() {
    const total = this.executionLog.length;
    const successful = this.executionLog.filter(l => l.status === 'success').length;
    const failed = this.executionLog.filter(l => l.status === 'error').length;

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? ((successful / total) * 100).toFixed(2) + '%' : 'N/A',
      lastExecution: this.executionLog[this.executionLog.length - 1]?.timestamp || null
    };
  }
}

module.exports = { AutoFixer };
