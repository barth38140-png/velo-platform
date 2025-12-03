const db = require('./db');
const logger = require('./logger');

/**
 * Log an admin action to the database for audit trail
 * @param {number} userId - ID of the admin user
 * @param {string} action - Action performed (e.g., 'seed_brands', 'normalize_brands', 'elevate_admin')
 * @param {object} metadata - Additional context (e.g., { count: 5, brands: [...] })
 * @param {string} ipAddress - IP address of the requester
 */
async function logAdminAction(userId, action, metadata = {}, ipAddress = null) {
  try {
    await ensureAuditTable();
    await db.query(
      `INSERT INTO admin_audit_log (user_id, action, metadata, ip_address) 
       VALUES ($1, $2, $3, $4)`,
      [userId, action, JSON.stringify(metadata), ipAddress]
    );
    logger.info({ userId, action, metadata, ipAddress }, '[audit] admin action logged');
  } catch (e) {
    logger.error({ err: e, userId, action }, '[audit] failed to log admin action');
  }
}

async function ensureAuditTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        metadata JSONB,
        ip_address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_audit_user_id ON admin_audit_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_log(action);
      CREATE INDEX IF NOT EXISTS idx_audit_created_at ON admin_audit_log(created_at DESC);
    `);
  } catch (e) {
    logger.error({ err: e }, '[audit] failed to ensure audit table');
  }
}

/**
 * Get recent audit logs
 * @param {number} limit - Number of logs to retrieve
 * @returns {Array} - Array of audit log entries
 */
async function getAuditLogs(limit = 100) {
  try {
    await ensureAuditTable();
    const result = await db.query(
      `SELECT al.*, u.email, u.name 
       FROM admin_audit_log al 
       LEFT JOIN users u ON al.user_id = u.id 
       ORDER BY al.created_at DESC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  } catch (e) {
    logger.error({ err: e }, '[audit] failed to retrieve audit logs');
    return [];
  }
}

module.exports = {
  logAdminAction,
  getAuditLogs
};
