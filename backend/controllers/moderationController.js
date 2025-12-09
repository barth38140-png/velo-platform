/**
 * Admin: Modérer un message signalé
 */
async function moderateMessage(req, res) {
  try {
    const { messageId } = req.params;
    const { action, notes } = req.body; // action: 'approve', 'reject', 'delete'

    if (!['approve', 'reject', 'delete'].includes(action)) {
      return res.status(400).json({ error: 'Action invalide' });
    }

    if (action === 'delete') {
      await pool.query('DELETE FROM messages WHERE id = $1', [messageId]);
      await pool.query('DELETE FROM message_flags WHERE message_id = $1', [messageId]);
    } else {
      await pool.query(
        'UPDATE message_flags SET status = $1, moderation_notes = $2, moderated_at = NOW(), moderated_by = $3 WHERE message_id = $4',
        [action === 'approve' ? 'approved' : 'rejected', notes || null, req.user.id, messageId]
      );
    }

    await logAdminAction(req.user.id, 'MESSAGE_MODERATION', `Message ${messageId} ${action}ed`, { messageId, action });

    return res.json({
      success: true,
      message: `Message ${action === 'approve' ? 'approuvé' : action === 'reject' ? 'rejeté' : 'supprimé'}`
    });
  } catch (err) {
    logger.error({ err }, 'moderateMessage error');
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
const logger = require('../src/logger');
const pool = require('../config/db');
const { logAdminAction } = require('../src/audit');

/**
 * Admin: Obtenir les avis signalés
 */
async function getFlaggedReviews(req, res) {
  try {
    const { status = 'pending', limit = 50, offset = 0 } = req.query;
    
    // Correction : inclure les reviews sans flag si le statut demandé est 'pending'
    // Explication : le WHERE doit permettre d'afficher tous les avis non modérés quand rf.status est NULL
    const result = await pool.query(`
      SELECT 
        r.id, r.repair_id, r.repairer_id, r.rating, r.comment, r.created_at,
        u.email as reviewer_email, u.name as reviewer_name,
        rep.email as repairer_email, rep.name as repairer_name,
        COALESCE(rf.count, 0) as flag_count,
        rf.reasons,
        rf.status as flag_status
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN users rep ON r.repairer_id = rep.id
      LEFT JOIN (
        SELECT review_id, COUNT(*) as count, ARRAY_AGG(DISTINCT reason) as reasons, MAX(status) as status
        FROM review_flags
        GROUP BY review_id
      ) rf ON r.id = rf.review_id
      WHERE ($1 = 'pending' AND (rf.status = 'pending' OR rf.status IS NULL))
         OR ($1 <> 'pending' AND rf.status = $1)
      ORDER BY rf.count DESC, r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [status === 'pending' ? 'pending' : status, limit, offset]);
    
    const countRes = await pool.query(
      'SELECT COUNT(*) as total FROM review_flags WHERE status = $1',
      [status === 'pending' ? 'pending' : status]
    );
    
    return res.json({
      success: true,
      reviews: result.rows,
      total: parseInt(countRes.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    logger.error({ err }, 'getFlaggedReviews error');
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Admin: Approuver ou rejeter un avis signalé
 */
async function moderateReview(req, res) {
  try {
    const { reviewId } = req.params;
    const { action, notes } = req.body; // action: 'approve', 'reject', 'delete'
    
    if (!['approve', 'reject', 'delete'].includes(action)) {
      return res.status(400).json({ error: 'Action invalide' });
    }
    
    if (action === 'delete') {
      // Supprimer l'avis
      await pool.query('DELETE FROM reviews WHERE id = $1', [reviewId]);
      await pool.query('DELETE FROM review_flags WHERE review_id = $1', [reviewId]);
    } else {
      // Marquer le signalement comme traité
      await pool.query(
        'UPDATE review_flags SET status = $1, moderation_notes = $2, moderated_at = NOW(), moderated_by = $3 WHERE review_id = $4',
        [action === 'approve' ? 'approved' : 'rejected', notes || null, req.user.id, reviewId]
      );
    }
    
    await logAdminAction(req.user.id, 'REVIEW_MODERATION', `Review ${reviewId} ${action}ed`, { reviewId, action });
    
    return res.json({
      success: true,
      message: `Avis ${action === 'approve' ? 'approuvé' : action === 'reject' ? 'rejeté' : 'supprimé'}`
    });
  } catch (err) {
    logger.error({ err }, 'moderateReview error');
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Admin: Obtenir les messages signalés
 */
async function getFlaggedMessages(req, res) {
  logger.info({ params: req.query, user: req.user?.id }, 'Entrée dans getFlaggedMessages');
  let query, params;
  try {
    const { status = 'pending', limit = 50, offset = 0 } = req.query;
    query = `
      SELECT 
        m.id, m.conversation_id, m.sender_id, m.content, m.created_at,
        s.email as sender_email, s.name as sender_name,
        COALESCE(mf.count, 0) as flag_count,
        mf.reasons,
        mf.status as flag_status
      FROM messages m
      LEFT JOIN users s ON m.sender_id = s.id
      LEFT JOIN (
        SELECT message_id, COUNT(*) as count, ARRAY_AGG(DISTINCT reason) as reasons, status
        FROM message_flags
        GROUP BY message_id, status
      ) mf ON m.id = mf.message_id
      WHERE mf.status = $1 OR (mf.status IS NULL AND $1 = 'pending')
      ORDER BY mf.count DESC, m.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    params = [status === 'pending' ? 'pending' : status, limit, offset];
    const result = await pool.query(query, params);
    const countRes = await pool.query(
      'SELECT COUNT(*) as total FROM message_flags WHERE status = $1',
      [status === 'pending' ? 'pending' : status]
    );
    return res.json({
      success: true,
      messages: result.rows,
      total: parseInt(countRes.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    logger.error({
      err,
      query: typeof query !== 'undefined' ? query : undefined,
      params: typeof params !== 'undefined' ? params : undefined
    }, 'Erreur getFlaggedMessages');
    return res.status(500).json({ error: err && err.stack ? err.stack : JSON.stringify(err) });
  }
}

module.exports = {
  getFlaggedReviews,
  moderateReview,
  getFlaggedMessages,
  moderateMessage
};
