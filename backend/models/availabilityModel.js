const pool = require('../config/db');

async function listSlots(repairerId, { from, to, status } = {}) {
  const where = ['repairer_id = $1'];
  const params = [repairerId];
  let i = 2;
  if (from) { where.push('ends_at > $' + i); params.push(from); i++; }
  if (to) { where.push('starts_at < $' + i); params.push(to); i++; }
  if (status) { where.push('status = $' + i); params.push(status); i++; }
  const sql = `SELECT * FROM availability_slots WHERE ${where.join(' AND ')} ORDER BY starts_at ASC`;
  const res = await pool.query(sql, params);
  return res.rows;
}

async function createSlot(repairerId, startsAt, endsAt) {
  const sql = `INSERT INTO availability_slots (repairer_id, starts_at, ends_at) VALUES ($1,$2,$3) RETURNING *`;
  const res = await pool.query(sql, [repairerId, startsAt, endsAt]);
  return res.rows[0];
}

async function deleteSlot(slotId, repairerId) {
  const sql = `DELETE FROM availability_slots WHERE id = $1 AND repairer_id = $2 RETURNING *`;
  const res = await pool.query(sql, [slotId, repairerId]);
  return res.rows[0];
}

async function reserveSlot(slotId, repairerId, repairRequestId, clientId) {
  // Réserver en transaction: vérifier slot libre, marquer réservé
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sel = await client.query(
      'SELECT * FROM availability_slots WHERE id = $1 AND repairer_id = $2 FOR UPDATE',
      [slotId, repairerId]
    );
    const slot = sel.rows[0];
    if (!slot) throw new Error('Slot not found');
    if (slot.status !== 'free') throw new Error('Slot not available');

    // Vérifier que la demande appartient au client
    const rr = await client.query('SELECT id, user_id FROM repair_requests WHERE id = $1', [repairRequestId]);
    if (!rr.rows[0] || rr.rows[0].user_id !== clientId) throw new Error('Unauthorized request');

    const upd = await client.query(
      `UPDATE availability_slots SET status = 'reserved', reserved_by_request_id = $1 WHERE id = $2 RETURNING *`,
      [repairRequestId, slotId]
    );

    // Optionnel: mettre à jour repair_offers pour cette demande et ce réparateur
    // Détecter colonnes scheduled_* et date_status
    let hasScheduled = false, hasNegotiation = false;
    try {
      const sch = await client.query("SELECT COUNT(*) AS cnt FROM information_schema.columns WHERE table_schema='public' AND table_name='repair_offers' AND column_name IN ('scheduled_from','scheduled_to')");
      hasScheduled = Number(sch?.rows?.[0]?.cnt || 0) === 2;
      const neg = await client.query("SELECT COUNT(*) AS cnt FROM information_schema.columns WHERE table_schema='public' AND table_name='repair_offers' AND column_name IN ('date_status','date_confirmed_at')");
      hasNegotiation = Number(neg?.rows?.[0]?.cnt || 0) === 2;
    } catch {}

    // Récupérer un offerId potentiel lié à la demande + réparateur
    let offer = null;
    try {
      const o = await client.query('SELECT * FROM repair_offers WHERE repair_request_id = $1 AND repairer_id = $2 ORDER BY created_at DESC LIMIT 1', [repairRequestId, repairerId]);
      offer = o.rows[0] || null;
    } catch {}

    if (offer && hasScheduled) {
      // Mettre à jour les dates planifiées depuis le slot
      const setStatus = hasNegotiation ? ", date_status = 'confirmed', date_confirmed_at = CURRENT_TIMESTAMP" : '';
      await client.query(
        `UPDATE repair_offers SET scheduled_from = $1, scheduled_to = $2${setStatus} WHERE id = $3`,
        [slot.starts_at, slot.ends_at, offer.id]
      );
    }
    await client.query('COMMIT');
    return upd.rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = {
  listSlots,
  createSlot,
  deleteSlot,
  reserveSlot,
};
