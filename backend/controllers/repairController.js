const { 
  createRepairRequest, 
  getRepairRequestsByUser, 
  getRepairRequestById,
  updateRepairRequestStatus,
  getAllRepairRequests 
} = require('../models/repairModel');

/**
 * Créer une demande de réparation
 */
async function createRepair(req, res) {
  const { title, description, bike_type, location_lat, location_lng, location_address } = req.body;
  const userId = req.user.id;

  if (!title || !description) {
    return res.status(400).json({ error: 'title and description are required' });
  }

  try {
    const repair = await createRepairRequest(
      userId, 
      title, 
      description, 
      bike_type || null,
      location_lat || null,
      location_lng || null,
      location_address || null
    );
    res.status(201).json({ success: true, repair });
  } catch (err) {
    console.error('createRepair error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Récupérer les demandes de l'utilisateur connecté
 */
async function getRepairs(req, res) {
  const userId = req.user.id;

  try {
    const repairs = await getRepairRequestsByUser(userId);
    res.json({ success: true, repairs });
  } catch (err) {
    console.error('getRepairs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Récupérer une demande spécifique
 */
async function getRepairDetail(req, res) {
  const { requestId } = req.params;

  try {
    const repair = await getRepairRequestById(requestId);
    if (!repair) {
      return res.status(404).json({ error: 'Repair request not found' });
    }
    res.json({ success: true, repair });
  } catch (err) {
    console.error('getRepairDetail error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Mettre à jour le statut d'une demande
 */
async function updateRepairStatus(req, res) {
  const { requestId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  try {
    const repair = await updateRepairRequestStatus(requestId, status);
    res.json({ success: true, repair });
  } catch (err) {
    console.error('updateRepairStatus error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Récupérer toutes les demandes en attente (pour les réparateurs)
 */
async function getPendingRepairs(req, res) {
  try {
    const repairs = await getAllRepairRequests();
    res.json({ success: true, repairs, count: repairs.length });
  } catch (err) {
    console.error('getPendingRepairs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { 
  createRepair, 
  getRepairs,
  getRepairDetail,
  updateRepairStatus,
  getPendingRepairs
};
