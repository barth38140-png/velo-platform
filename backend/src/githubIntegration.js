// backend/src/githubIntegration.js
// Intégration GitHub pour créer automatiquement des issues sur anomalies critiques

const axios = require('axios');
const logger = require('./logger');

class GitHubIntegration {
  constructor(config = {}) {
    this.token = config.token || process.env.GITHUB_TOKEN;
    this.owner = config.owner || process.env.GITHUB_OWNER || 'barth38140-png';
    this.repo = config.repo || process.env.GITHUB_REPO || 'velo-platform';
    this.enabled = this.token && this.owner && this.repo;

    if (!this.enabled) {
      logger.warn('GitHub Integration désactivée: GITHUB_TOKEN, GITHUB_OWNER ou GITHUB_REPO manquants');
    }

    this.baseUrl = `https://api.github.com/repos/${this.owner}/${this.repo}`;
    this.createdIssues = [];

    this.severityToLabel = {
      CRITICAL: ['bug', 'priority-critical', 'p0'],
      HIGH: ['bug', 'priority-high', 'p1'],
      MEDIUM: ['enhancement', 'priority-medium', 'p2'],
      LOW: ['documentation', 'priority-low', 'p3']
    };
  }

  async createIssueForAnomaly(anomaly) {
    if (!this.enabled) {
      logger.debug('GitHub Integration désactivée');
      return { created: false, reason: 'disabled' };
    }

    try {
      // Vérifier si une issue existe déjà pour cette anomalie
      const existingIssue = await this.findExistingIssue(anomaly);
      if (existingIssue) {
        logger.info(`✅ Issue existante trouvée: #${existingIssue.number}`);
        return { created: false, reason: 'already_exists', issueNumber: existingIssue.number };
      }

      const { title, body, labels } = this.formatIssue(anomaly);

      const response = await axios.post(
        `${this.baseUrl}/issues`,
        {
          title,
          body,
          labels
        },
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );

      const issue = response.data;
      logger.info(
        { issueNumber: issue.number, url: issue.html_url },
        `📝 Issue créée: ${title}`
      );

      this.createdIssues.push({
        number: issue.number,
        anomalyType: anomaly.type,
        timestamp: new Date(),
        url: issue.html_url
      });

      return {
        created: true,
        issueNumber: issue.number,
        url: issue.html_url
      };
    } catch (error) {
      logger.error({ error, anomaly }, '❌ Erreur lors de la création d\'issue GitHub');
      return {
        created: false,
        reason: 'error',
        error: error.message
      };
    }
  }

  async findExistingIssue(anomaly) {
    try {
      const response = await axios.get(`${this.baseUrl}/issues`, {
        params: {
          state: 'open',
          per_page: 100
        },
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });

      // Chercher une issue avec un titre similaire
      const similar = response.data.find(issue =>
        issue.title.includes(anomaly.type) ||
        issue.body?.includes(anomaly.type)
      );

      return similar;
    } catch (error) {
      logger.debug({ error }, 'Erreur lors de la recherche d\'issues existantes');
      return null;
    }
  }

  formatIssue(anomaly) {
    const timestamp = new Date(anomaly.timestamp).toLocaleString('fr-FR');

    const title = `[${anomaly.severity}] ${anomaly.type} - ${anomaly.message}`;

    const body = `## 🚨 Détails de l'Anomalie

**Type**: ${anomaly.type}
**Sévérité**: ${anomaly.severity}
**Message**: ${anomaly.message}
**Timestamp**: ${timestamp}

## 📊 Contexte

\`\`\`json
${JSON.stringify({
  value: anomaly.value,
  threshold: anomaly.threshold,
  autoFixable: anomaly.autoFixable
}, null, 2)}
\`\`\`

## ✅ Actions Recommandées

${anomaly.autoFixable
  ? '- ✅ Cette anomalie peut être auto-réparée automatiquement'
  : '- ⚠️ Intervention manuelle recommandée'
}

- [ ] Vérifier les logs associés
- [ ] Analyser les métriques détaillées
- [ ] Mettre en place une correction
- [ ] Tester en staging
- [ ] Déployer en production

## 🔗 Liens Utiles

- [Metrics API](/api/metrics/metrics)
- [Health Status](/api/metrics/health)
- [Logs](./backend/logs)

---
*Issue générée automatiquement par le système d'amélioration continue*`;

    const labels = this.severityToLabel[anomaly.severity] || ['bug'];

    return { title, body, labels };
  }

  async closeRelatedIssues(anomalyType) {
    if (!this.enabled) return [];

    try {
      const response = await axios.get(`${this.baseUrl}/issues`, {
        params: {
          state: 'open',
          per_page: 100
        },
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });

      const relatedIssues = response.data.filter(issue => issue.title.includes(anomalyType));
      const closed = [];

      for (const issue of relatedIssues) {
        await axios.patch(
          `${this.baseUrl}/issues/${issue.number}`,
          { state: 'closed' },
          {
            headers: {
              Authorization: `token ${this.token}`,
              Accept: 'application/vnd.github.v3+json'
            }
          }
        );

        logger.info(`🔒 Issue fermée: #${issue.number}`);
        closed.push(issue.number);
      }

      return closed;
    } catch (error) {
      logger.error({ error }, '❌ Erreur lors de la fermeture des issues');
      return [];
    }
  }

  async addCommentToIssue(issueNumber, comment) {
    if (!this.enabled) return;

    try {
      await axios.post(
        `${this.baseUrl}/issues/${issueNumber}/comments`,
        { body: comment },
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );

      logger.info(`💬 Commentaire ajouté à l'issue #${issueNumber}`);
    } catch (error) {
      logger.error({ error }, `❌ Erreur lors de l'ajout du commentaire`);
    }
  }

  getCreatedIssuesReport() {
    return {
      total: this.createdIssues.length,
      byType: this.createdIssues.reduce((acc, issue) => {
        acc[issue.anomalyType] = (acc[issue.anomalyType] || 0) + 1;
        return acc;
      }, {}),
      recentIssues: this.createdIssues.slice(-10)
    };
  }
}

module.exports = { GitHubIntegration };
