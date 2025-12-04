const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const { getAuditLogs } = require('../src/audit');

// Get audit logs (admin only)
router.get('/logs', auth, isAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = await getAuditLogs(limit);
    res.json({ success: true, logs, count: logs.length });
  } catch (err) {
    console.error('Failed to fetch audit logs:', err);
    res.status(500).json({ error: 'failed_to_fetch_audit_logs' });
  }
});

module.exports = router;
