const repairOfferModel = require('../models/repairOfferModel');
const repairModel = require('../models/repairModel');

// Create a repair offer
const createOffer = async (req, res) => {
  try {
    const { repair_request_id, offered_price, estimated_duration_hours, message } = req.body;
    const repairerId = req.user.id;

    // Check if offer already exists
    const existingOffer = await repairOfferModel.hasExistingOffer(repair_request_id, repairerId);
    if (existingOffer) {
      return res.status(400).json({
        success: false,
        error: 'You have already submitted an offer for this repair request'
      });
    }

    // Verify repair request exists
    const repair = await repairModel.getRepairRequestById(repair_request_id);
    if (!repair) {
      return res.status(404).json({
        success: false,
        error: 'Repair request not found'
      });
    }

    const offer = await repairOfferModel.createRepairOffer(
      repair_request_id,
      repairerId,
      offered_price,
      estimated_duration_hours,
      message
    );

    res.status(201).json({
      success: true,
      offer
    });
  } catch (err) {
    console.error('createOffer error:', err);
    // Handle unique constraint violation (repairer already offered)
    if (err && err.code === '23505') {
      return res.status(409).json({ success: false, error: 'You have already submitted an offer for this repair request' });
    }
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get all offers for a repair request
const getOffersForRepair = async (req, res) => {
  try {
    const { repairId } = req.params;

    const offers = await repairOfferModel.getOffersByRepairRequest(repairId);

    res.json({
      success: true,
      offers,
      count: offers.length
    });
  } catch (err) {
    console.error('getOffersForRepair error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
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
    console.error('getMyOffers error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
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
    console.error('getClientOffers error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get single offer details
const getOfferDetail = async (req, res) => {
  try {
    const { offerId } = req.params;

    const offer = await repairOfferModel.getOfferById(offerId);
    if (!offer) {
      return res.status(404).json({
        success: false,
        error: 'Offer not found'
      });
    }

    res.json({
      success: true,
      offer
    });
  } catch (err) {
    console.error('getOfferDetail error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Accept or reject an offer
const updateOfferStatus = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be accepted or rejected'
      });
    }

    const offer = await repairOfferModel.getOfferById(offerId);
    if (!offer) {
      return res.status(404).json({
        success: false,
        error: 'Offer not found'
      });
    }

    // Verify that the current user owns the repair request
    const repair = await repairModel.getRepairRequestById(offer.repair_request_id);
    if (repair.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only manage offers for your repair requests'
      });
    }

    const updatedOffer = await repairOfferModel.updateOfferStatus(offerId, status);

    // If accepted, update repair request status and assign repairer
    if (status === 'accepted') {
      await repairModel.updateRepairRequestStatus(
        offer.repair_request_id,
        'assigned',
        offer.repairer_id
      );
    }

    // Emit socket events so clients/repairers can refresh views
    try {
      const io = req.app.get('io');
      if (io) {
        // Notify the client who owns the repair request
        const clientId = req.user.id;
        console.log(`Emitting status_update to user-${clientId} for offer ${offerId} status=${status}`);
        io.to(`user-${clientId}`).emit('status_update', { status, offer: updatedOffer });
        // Notify the repairer about their offer update
        if (updatedOffer && updatedOffer.repairer_id) {
          console.log(`Emitting offer_update to user-${updatedOffer.repairer_id} for offer ${offerId}`);
          io.to(`user-${updatedOffer.repairer_id}`).emit('offer_update', { offer: updatedOffer });
        }
      }
    } catch (e) {
      console.error('Socket emit error after offer status update:', e);
    }
    res.json({
      success: true,
      offer: updatedOffer
    });
  } catch (err) {
    console.error('updateOfferStatus error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

module.exports = {
  createOffer,
  getOffersForRepair,
  getMyOffers,
  getClientOffers,
  getOfferDetail,
  updateOfferStatus
};
