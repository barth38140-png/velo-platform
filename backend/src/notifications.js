// backend/src/notifications.js
// Service de notifications pour alertes et rapports

const logger = require('./logger');
const axios = require('axios');

class NotificationService {
  constructor(config = {}) {
    this.config = {
      slackWebhook: config.slackWebhook || process.env.SLACK_WEBHOOK_URL,
      alertEmail: config.alertEmail || process.env.ALERT_EMAIL,
      sendSlack: config.sendSlack !== false && !!process.env.SLACK_WEBHOOK_URL,
      sendEmail: config.sendEmail !== false && !!process.env.ALERT_EMAIL,
      ...config
    };
  }

  async sendAlert(anomaly) {
    logger.info({ anomaly }, '📢 Envoi d\'alerte...');

    if (this.config.sendSlack) {
      await this.sendSlackAlert(anomaly);
    }

    if (this.config.sendEmail && anomaly.severity === 'CRITICAL') {
      await this.sendEmailAlert(anomaly);
    }
  }

  async sendSlackAlert(anomaly) {
    try {
      const severityEmoji = {
        'CRITICAL': '🔴',
        'HIGH': '🟠',
        'MEDIUM': '🟡',
        'LOW': '🟢'
      }[anomaly.severity] || '⚪';

      const payload = {
        text: `${severityEmoji} ${anomaly.type}: ${anomaly.message}`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `${severityEmoji} ${anomaly.severity} - ${anomaly.type}`,
              emoji: true
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Message*\n${anomaly.message}`
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Valeur*\n${anomaly.value || 'N/A'}`
              },
              {
                type: 'mrkdwn',
                text: `*Seuil*\n${anomaly.threshold || 'N/A'}`
              }
            ]
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `_${anomaly.timestamp.toISOString()}_`
              }
            ]
          }
        ]
      };

      await axios.post(this.config.slackWebhook, payload);
      logger.debug('✅ Alerte Slack envoyée');
    } catch (error) {
      logger.error({ error }, '❌ Erreur lors de l\'envoi Slack');
    }
  }

  async sendEmailAlert() {
    try {
      // TODO: Implémenter avec nodemailer ou service mail
      logger.info('📧 Email alerte (non implémenté)');
    } catch (error) {
      logger.error({ error }, '❌ Erreur lors de l\'envoi email');
    }
  }

  async sendDailyReport(report) {
    logger.info('📊 Envoi du rapport quotidien...');

    try {
      if (this.config.sendSlack) {
        await this.sendSlackReport(report);
      }
    } catch (error) {
      logger.error({ error }, '❌ Erreur lors de l\'envoi du rapport');
    }
  }

  async sendSlackReport(report) {
    const healthColor = report.summary.healthScore >= 80 ? 'good' : (
      report.summary.healthScore >= 60 ? 'warning' : 'danger'
    );

    const payload = {
      text: `📊 Rapport quotidien ${report.date}`,
      attachments: [
        {
          color: healthColor,
          title: `Health Score: ${report.summary.healthScore.toFixed(0)}/100`,
          fields: [
            {
              title: 'Uptime',
              value: `${Math.floor(report.metrics.uptime / 3600)}h`,
              short: true
            },
            {
              title: 'Taux d\'erreur',
              value: `${report.metrics.errorRate}%`,
              short: true
            },
            {
              title: 'Latence P95',
              value: `${report.metrics.p95Latency}ms`,
              short: true
            },
            {
              title: 'Requêtes',
              value: report.metrics.requests.toString(),
              short: true
            }
          ],
          footer: 'Continuous Improvement System',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };

    // Ajouter les recommandations si nécessaire
    if (report.summary.recommendations.length > 0) {
      const recText = report.summary.recommendations
        .map(r => `• ${r.priority}: ${r.message}`)
        .join('\n');

      payload.attachments.push({
        color: '#808080',
        title: 'Recommandations',
        text: recText,
        mrkdwn_in: ['text']
      });
    }

    await axios.post(this.config.slackWebhook, payload);
    logger.debug('✅ Rapport Slack envoyé');
  }
}

module.exports = { NotificationService };
