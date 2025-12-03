const repairOfferModel = require('../models/repairOfferModel');
const repairModel = require('../models/repairModel');
const logger = require('../src/logger');

// Create a repair offer
const createOffer = async (req, res) => {
  try {
    logger.debug({ body: req.body, userId: req.user?.id }, 'createOffer payload received');
    const { repair_request_id, offered_price, estimated_duration_hours, message, scheduled_from, scheduled_to } = req.body;
    const repairerId = req.user.id;

    // Check if offer already exists
    const existingOffer = await repairOfferModel.hasExistingOffer(repair_request_id, repairerId);
    if (existingOffer) {
      return res.status(400).json({ success: false, error: 'Vous avez déjà proposé une offre pour cette demande' });
    }

    // Verify repair request exists
    const repair = await repairModel.getRepairRequestById(repair_request_id);
    if (!repair) {
      return res.status(404).json({ success: false, error: 'Demande de réparation introuvable' });
    }

    // Validation simple des dates (si présentes)
    let scheduledFrom = null;
    let scheduledTo = null;
    try {
      if (scheduled_from) {
        const d = new Date(scheduled_from);
        if (!isNaN(d.getTime())) scheduledFrom = d;
        else return res.status(400).json({ success: false, error: 'Date de début invalide' });
      }
      if (scheduled_to) {
        const d2 = new Date(scheduled_to);
        if (!isNaN(d2.getTime())) scheduledTo = d2;
        else return res.status(400).json({ success: false, error: 'Date de fin invalide' });
      }
      if (scheduledFrom && scheduledTo && scheduledTo < scheduledFrom) {
        return res.status(400).json({ success: false, error: 'La date de fin doit être postérieure à la date de début' });
      }
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Dates d\'intervention invalides' });
    }

    const offer = await repairOfferModel.createRepairOffer(
      repair_request_id,
      repairerId,
      offered_price,
      estimated_duration_hours,
      message,
      scheduledFrom,
      scheduledTo
    );

    // Transition automatique: créée → en_attente après première offre
    if (repair.status === 'créée') {
      try {
        await repairModel.updateRepairRequestStatus(repair_request_id, 'en_attente');
        logger.info({ repairId: repair_request_id }, 'Demande passée en statut en_attente après première offre');
      } catch (e) {
        logger.error({ err: e, repairId: repair_request_id }, 'Erreur transition créée → en_attente');
      }
    }

    res.status(201).json({
      success: true,
      offer
    });
  } catch (err) {
    logger.error({ err, repairerId: req.user?.id }, 'createOffer error');
    // Conflit (doublon)
    if (err && err.code === '23505') {
      return res.status(409).json({ success: false, error: 'Vous avez déjà proposé une offre pour cette demande' });
    }
    // Clé étrangère manquante (demande inexistante)
    if (err && err.code === '23503') {
      return res.status(404).json({ success: false, error: 'Demande de réparation introuvable' });
    }
    // Représentation invalide (types non conformes)
    if (err && err.code === '22P02') {
      return res.status(400).json({ success: false, error: 'Paramètres invalides pour l\'offre' });
    }
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Get all offers for a repair request
const getOffersForRepair = async (req, res) => {
  try {
    const { repairId } = req.params;

    logger.debug({ repairId }, 'getOffersForRepair start');
    // Vérifier que la demande existe pour éviter un 500 sur jointures
    const exists = await repairModel.getRepairRequestById(repairId);
    if (!exists) {
      return res.status(404).json({ success: false, error: 'Demande de réparation introuvable' });
    }
    let offers = [];
    try {
      offers = await repairOfferModel.getOffersByRepairRequest(repairId);
    } catch (e) {
      // Fallback: renvoyer une liste vide mais logguer l'erreur pour correction
      logger.error({ err: e, repairId }, 'getOffersForRepair SQL error, returning empty list');
      offers = [];
    }

    res.json({
      success: true,
      offers,
      count: offers.length
    });
  } catch (err) {
    logger.error({ err, repairId: req.params?.repairId }, 'getOffersForRepair error');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Get all offers from current user (as repairer)
const getMyOffers = async (req, res) => {
  try {
    const repairerId = req.user.id;

    const offers = await repairOfferModel.getOffersByRepairer(repairerId);

    res.json({
      success: true,
      offers,
      count: offers.length
    });
  } catch (err) {
    logger.error({ err, repairerId: req.user?.id }, 'getMyOffers error');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Get all offers received by current user (as client)
const getClientOffers = async (req, res) => {
  try {
    const clientId = req.user.id;

    const offers = await repairOfferModel.getOffersByClient(clientId);

    res.json({
      success: true,
      offers,
      count: offers.length
    });
  } catch (err) {
    logger.error({ err, clientId: req.user?.id }, 'getClientOffers error');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Get single offer details
const getOfferDetail = async (req, res) => {
  try {
    const { offerId } = req.params;

    const offer = await repairOfferModel.getOfferById(offerId);
    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offre introuvable' });
    }

    res.json({
      success: true,
      offer
    });
  } catch (err) {
    logger.error({ err, offerId: req.params?.offerId }, 'getOfferDetail error');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Accept or reject an offer
const updateOfferStatus = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Le statut doit être "accepted" ou "rejected"' });
    }

    const offer = await repairOfferModel.getOfferById(offerId);
    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offre introuvable' });
    }

    // Verify that the current user owns the repair request
    const repair = await repairModel.getRepairRequestById(offer.repair_request_id);
    if (repair.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Vous ne pouvez gérer que les offres de vos demandes' });
    }

    // Vérifier que la date est confirmée avant d'accepter (si la colonne existe)
    if (status === 'accepted') {
      if (offer.date_status !== undefined && offer.date_status !== null && offer.date_status !== 'confirmed') {
        return res.status(400).json({ 
          success: false, 
          error: 'Vous devez d\'abord confirmer une date d\'intervention avec le réparateur avant d\'accepter l\'offre' 
        });
      }
    }

    const updatedOffer = await repairOfferModel.updateOfferStatus(offerId, status);

    // If accepted, update repair request status and assign repairer
    if (status === 'accepted') {
      // Rejeter automatiquement toutes les autres offres de cette demande
      const allOffers = await repairOfferModel.getOffersByRepairRequest(offer.repair_request_id);
      for (const otherOffer of allOffers) {
        if (otherOffer.id !== parseInt(offerId) && otherOffer.status === 'proposée') {
          await repairOfferModel.updateOfferStatus(otherOffer.id, 'rejected');
          // Notifier le réparateur concerné
          try {
            const io = req.app.get('io');
            if (io && otherOffer.repairer_id) {
              io.to(`user-${otherOffer.repairer_id}`).emit('offer_update', { 
                offer: { ...otherOffer, status: 'rejetée' },
                reason: 'Une autre offre a été acceptée pour cette demande'
              });
            }
          } catch (e) {
            logger.error({ err: e }, 'Socket emit error for rejected offer');
          }
        }
      }
      
      await repairModel.updateRepairRequestStatus(
        offer.repair_request_id,
        'assignée',
        offer.repairer_id
      );
    }

    // Emit socket events so clients/repairers can refresh views
    try {
      const io = req.app.get('io');
      if (io) {
        // Notify the client who owns the repair request
        const clientId = req.user.id;
        logger.info({ clientId, offerId, status }, 'Emitting status_update');
        io.to(`user-${clientId}`).emit('status_update', { status, offer: updatedOffer });
        // Notify the repairer about their offer update
        if (updatedOffer && updatedOffer.repairer_id) {
          logger.info({ repairerId: updatedOffer.repairer_id, offerId }, 'Emitting offer_update');
          io.to(`user-${updatedOffer.repairer_id}`).emit('offer_update', { offer: updatedOffer });
        }
      }
    } catch (e) {
      logger.error({ err: e }, 'Socket emit error after offer status update');
    }
    res.json({
      success: true,
      offer: updatedOffer
    });
  } catch (err) {
    logger.error({ err, offerId: req.params?.offerId, status: req.body?.status }, 'updateOfferStatus error');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Proposer ou contre-proposer une date d'intervention
const proposeDate = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { scheduled_from, scheduled_to } = req.body;
    const userId = req.user.id;

    // Validation des dates
    if (!scheduled_from) {
      return res.status(400).json({ success: false, error: 'La date de début est requise' });
    }

    const dateFrom = new Date(scheduled_from);
    const dateTo = scheduled_to ? new Date(scheduled_to) : null;

    if (isNaN(dateFrom.getTime())) {
      return res.status(400).json({ success: false, error: 'Date de début invalide' });
    }

    if (dateTo && isNaN(dateTo.getTime())) {
      return res.status(400).json({ success: false, error: 'Date de fin invalide' });
    }

    if (dateTo && dateTo < dateFrom) {
      return res.status(400).json({ success: false, error: 'La date de fin doit être postérieure à la date de début' });
    }

    // Traces pour diagnostic
    logger.debug({ offerId, userId, scheduled_from, scheduled_to }, 'proposeDate received payload');

    const offer = await repairOfferModel.getOfferById(offerId);
    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offre introuvable' });
    }

    // Vérifier les permissions
    const repair = await repairModel.getRepairRequestById(offer.repair_request_id);
    const isClient = repair.user_id === userId;
    const isRepairer = offer.repairer_id === userId;

    if (!isClient && !isRepairer) {
      return res.status(403).json({ success: false, error: 'Vous n\'êtes pas autorisé à proposer une date pour cette offre' });
    }

    // Déterminer qui propose
    const proposedBy = isClient ? 'client' : 'repairer';
    const dateStatus = isClient ? 'proposed_by_client' : 'proposed_by_repairer';

    // Mettre à jour l'offre
    const updatedOffer = await repairOfferModel.proposeDates(
      offerId,
      dateFrom,
      dateTo,
      proposedBy,
      dateStatus
    );

    // Notifier l'autre partie
    try {
      const io = req.app.get('io');
      if (io) {
        const targetUserId = isClient ? offer.repairer_id : repair.user_id;
        io.to(`user-${targetUserId}`).emit('date_proposed', { 
          offer: updatedOffer,
          proposedBy 
        });
      }
    } catch (e) {
      logger.error({ err: e }, 'Socket emit error for date proposal');
    }

    res.json({
      success: true,
      offer: updatedOffer,
      message: 'Date proposée avec succès'
    });
  } catch (err) {
    logger.error({ 
      err, 
      offerId: req.params?.offerId,
      body: req.body,
      userId: req.user?.id
    }, 'proposeDate error');
    const msg = err?.message?.includes('invalid input syntax for type timestamp')
      ? 'Format de date invalide'
      : 'Erreur serveur lors de la proposition de date';
    res.status(500).json({ success: false, error: msg });
  }
};

// Confirmer une date proposée
const confirmDate = async (req, res) => {
  try {
    const { offerId } = req.params;
    const userId = req.user.id;

    const offer = await repairOfferModel.getOfferById(offerId);
    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offre introuvable' });
    }

    // Vérifier qu'une date a été proposée
    if (!offer.scheduled_from) {
      return res.status(400).json({ success: false, error: 'Aucune date n\'a été proposée pour cette offre' });
    }

    if (offer.date_status === 'confirmed') {
      return res.status(400).json({ success: false, error: 'La date est déjà confirmée' });
    }

    // Vérifier les permissions
    const repair = await repairModel.getRepairRequestById(offer.repair_request_id);
    const isClient = repair.user_id === userId;
    const isRepairer = offer.repairer_id === userId;

    if (!isClient && !isRepairer) {
      return res.status(403).json({ success: false, error: 'Vous n\'êtes pas autorisé à confirmer cette date' });
    }

    // Vérifier que l'utilisateur n'est pas celui qui a proposé
    if ((isClient && offer.proposed_by === 'client') || (isRepairer && offer.proposed_by === 'repairer')) {
      return res.status(400).json({ success: false, error: 'Vous ne pouvez pas confirmer votre propre proposition' });
    }

    // Confirmer la date
    const updatedOffer = await repairOfferModel.confirmDate(offerId);

    // Notifier l'autre partie
    try {
      const io = req.app.get('io');
      if (io) {
        const targetUserId = isClient ? offer.repairer_id : repair.user_id;
        io.to(`user-${targetUserId}`).emit('date_confirmed', { 
          offer: updatedOffer
        });
      }
    } catch (e) {
      logger.error({ err: e }, 'Socket emit error for date confirmation');
    }

    res.json({
      success: true,
      offer: updatedOffer,
      message: 'Date confirmée avec succès. L\'offre peut maintenant être acceptée.'
    });
  } catch (err) {
    logger.error({ err, offerId: req.params?.offerId }, 'confirmDate error');
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

module.exports = {
  createOffer,
  getOffersForRepair,
  getMyOffers,
  getClientOffers,
  getOfferDetail,
  updateOfferStatus,
  proposeDate,
  confirmDate
};
