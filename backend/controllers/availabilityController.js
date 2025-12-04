const logger = require('../src/logger');
const availabilityModel = require('../models/availabilityModel');

async function list(req, res) {
  try {
    const { repairerId } = req.params;
    const { from, to, status } = req.query;
    const slots = await availabilityModel.listSlots(Number(repairerId), { from, to, status });
    res.status(200).json(slots);
  } catch (e) {
    logger.error({ err: e }, 'availability list error');
    res.status(500).json({ error: "Erreur serveur lors de la récupération des créneaux" });
  }
}

async function create(req, res) {
  try {
    const repairerId = req.user.id;
    const { startsAt, endsAt } = req.body;
    const slot = await availabilityModel.createSlot(repairerId, startsAt, endsAt);
    res.status(201).json(slot);
  } catch (e) {
    logger.error({ err: e }, 'availability create error');
    const msg = e.message && e.message.includes('overlap') ? "Créneau en chevauchement, veuillez choisir un autre créneau" : "Erreur lors de la création du créneau";
    res.status(400).json({ error: msg });
  }
}

async function remove(req, res) {
  try {
    const repairerId = req.user.id;
    const { slotId } = req.params;
    const slot = await availabilityModel.deleteSlot(Number(slotId), repairerId);
    if (!slot) return res.status(404).json({ error: "Créneau introuvable" });
    res.status(200).json({ ok: true });
  } catch (e) {
    logger.error({ err: e }, 'availability delete error');
    res.status(500).json({ error: "Erreur serveur lors de la suppression du créneau" });
  }
}

async function reserve(req, res) {
  try {
    const clientId = req.user.id;
    const { slotId } = req.params;
    const { repairerId, repairRequestId } = req.body;
    const slot = await availabilityModel.reserveSlot(Number(slotId), Number(repairerId), Number(repairRequestId), Number(clientId));
    res.status(200).json(slot);
  } catch (e) {
    logger.error({ err: e }, 'availability reserve error');
    const msg = e.message === 'Slot not available' ? "Créneau indisponible" : (e.message === 'Unauthorized request' ? "Demande non autorisée" : "Erreur lors de la réservation du créneau");
    res.status(400).json({ error: msg });
  }
}

module.exports = {
  list,
  create,
  remove,
  reserve,
};
