const { 
  createRepairRequest, 
  getRepairRequestsByUser, 
  getRepairRequestById,
  updateRepairRequestStatus,
  getAllRepairRequests 
} = require('../models/repairModel');
const repairOfferModel = require('../models/repairOfferModel');
const logger = require('../src/logger');

/**
 * Créer une demande de réparation
 */
async function createRepair(req, res) {
  const { title, description, bike_type, location_lat, location_lng, location_address, metadata } = req.body;
  const userId = req.user.id;

  if (!title || !description) {
    return res.status(400).json({ error: 'Titre et description requis' });
  }

  try {
    const repair = await createRepairRequest(
      userId,
      title,
      description,
      bike_type || null,
      location_lat || null,
      location_lng || null,
      location_address || null,
      metadata || {}
    );
    res.status(201).json({ success: true, repair });
  } catch (err) {
    logger.error({ err, userId, title }, 'createRepair error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Récupérer les demandes de l'utilisateur connecté
 */
async function getRepairs(req, res) {
  const userId = req.user.id;

  try {
    const repairs = await getRepairRequestsByUser(userId);
    // Map photos to authenticated URLs
    const mapped = repairs.map(r => ({
      ...r,
      photos: (r.photos || []).map(p => ({ id: p.id, filename: p.filename, url: `/api/repairs/photos/${p.id}` })),
      hasAcceptedOffer: !!r.has_accepted_offer
    }));
    res.json({ success: true, repairs: mapped });
  } catch (err) {
    logger.error({ err, userId }, 'getRepairs error');
    res.status(500).json({ error: 'Erreur serveur' });
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
      return res.status(404).json({ error: 'Demande introuvable' });
    }
    // Build photo URLs
    const photos = (repair.photos || []).map(p => ({ id: p.id, filename: p.filename, url: `/api/repairs/photos/${p.id}` }));
    repair.photos = photos;
    res.json({ success: true, repair });
  } catch (err) {
    logger.error({ err, requestId }, 'getRepairDetail error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Mettre à jour le statut d'une demande
 */
async function updateRepairStatus(req, res) {
  const { requestId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Statut requis' });
  }

  try {
    // Prevent cancelling a request if any associated offer has been accepted
    if (status === 'annulée') {
      const offers = await repairOfferModel.getOffersByRepairRequest(requestId);
      const hasAccepted = (offers || []).some(o => o.status === 'acceptée');
      if (hasAccepted) {
        return res.status(400).json({ error: 'Impossible d\'annuler : une offre a déjà été acceptée pour cette demande' });
      }
    }

    const repair = await updateRepairRequestStatus(requestId, status);
    res.json({ success: true, repair });
  } catch (err) {
    logger.error({ err, requestId, status }, 'updateRepairStatus error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Récupérer toutes les demandes en attente (pour les réparateurs)
 */
async function getPendingRepairs(req, res) {
  try {
    // Filtrer explicitement sur les statuts en attente/explorables
    // Par défaut, le modèle retourne par statut exact; on cible 'créée' et éventuellement 'en_attente'
    const created = await getAllRepairRequests('créée');
    let pending = created;
    try {
      const enAttente = await getAllRepairRequests('en_attente');
      pending = [...created, ...enAttente];
    } catch (_) {
      // Si le statut 'en_attente' n'existe pas dans certains dumps, on ignore
    }
    const repairerId = req.user.id;
    // Exclure les demandes pour lesquelles le réparateur courant a déjà proposé une offre
    const withExclusion = [];
    for (const r of pending) {
      try {
        const hasOffer = await require('../models/repairOfferModel').hasExistingOffer(r.id, repairerId);
        if (!hasOffer) withExclusion.push(r);
      } catch (e) {
        // En cas d'erreur DB ponctuelle, ne pas bloquer l'affichage: inclure la demande
        withExclusion.push(r);
      }
    }
    const repairs = withExclusion;
    const mapped = repairs.map(r => ({
      ...r,
      photos: (r.photos || []).map(p => ({ id: p.id, filename: p.filename, url: `/api/repairs/photos/${p.id}` }))
    }));
    res.json({ success: true, repairs: mapped, count: mapped.length });
  } catch (err) {
    logger.error({ err }, 'getPendingRepairs error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Démarrer une réparation (transition assignée → en_cours)
 */
async function startRepair(req, res) {
  const { requestId } = req.params;
  const userId = req.user.id;

  try {
    const repair = await getRepairRequestById(requestId);
    if (!repair) {
      return res.status(404).json({ error: 'Demande introuvable' });
    }

    // Vérifier que l'utilisateur est le réparateur assigné
    if (repair.assigned_repairer_id !== userId) {
      return res.status(403).json({ error: 'Seul le réparateur assigné peut démarrer cette réparation' });
    }

    if (repair.status !== 'assignée') {
      return res.status(400).json({ error: 'Cette demande ne peut pas être démarrée (statut actuel: ' + repair.status + ')' });
    }

    const updated = await updateRepairRequestStatus(requestId, 'en_cours');
    logger.info({ repairId: requestId, repairerId: userId }, 'Réparation démarrée');
    
    res.json({ success: true, repair: updated });
  } catch (err) {
    logger.error({ err, requestId }, 'startRepair error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Finaliser une réparation (transition en_cours → terminée)
 */
async function completeRepair(req, res) {
  const { requestId } = req.params;
  const userId = req.user.id;

  try {
    const repair = await getRepairRequestById(requestId);
    if (!repair) {
      return res.status(404).json({ error: 'Demande introuvable' });
    }

    // Le client ou le réparateur assigné peut finaliser
    const isOwner = repair.user_id === userId;
    const isAssignedRepairer = repair.assigned_repairer_id === userId;
    
    if (!isOwner && !isAssignedRepairer) {
      return res.status(403).json({ error: 'Vous n\'avez pas les permissions pour finaliser cette réparation' });
    }

    if (repair.status !== 'en_cours') {
      return res.status(400).json({ error: 'Cette demande ne peut pas être finalisée (statut actuel: ' + repair.status + ')' });
    }

    const updated = await updateRepairRequestStatus(requestId, 'terminée');
    logger.info({ repairId: requestId, userId }, 'Réparation finalisée');
    
    res.json({ success: true, repair: updated });
  } catch (err) {
    logger.error({ err, requestId }, 'completeRepair error');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { 
  createRepair, 
  getRepairs,
  getRepairDetail,
  updateRepairStatus,
  getPendingRepairs,
  startRepair,
  completeRepair
};
