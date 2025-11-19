const { upsertLocation, getLocationByUser, findNearbyRepairers } = require('../models/locationModel');

/**
 * Mettre à jour ou créer la localisation de l'utilisateur
 */
async function updateLocation(req, res) {
  const { latitude, longitude, address } = req.body;
  const userId = req.user.id;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'latitude and longitude are required' });
  }

  try {
    const loc = await upsertLocation(userId, latitude, longitude, address || null);
    res.json({ success: true, location: loc });
  } catch (err) {
    console.error('updateLocation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Récupérer la localisation de l'utilisateur
 */
async function getLocation(req, res) {
  const userId = req.user.id;

  try {
    const loc = await getLocationByUser(userId);
    // Return empty location object instead of 404 if not found
    // (user may not have set location yet)
    if (!loc) {
      return res.json({ 
        success: true, 
        location: { 
          latitude: null, 
          longitude: null, 
          address: null 
        } 
      });
    }
    res.json({ success: true, location: loc });
  } catch (err) {
    console.error('getLocation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Trouver les réparateurs proches
 */
async function getNearbyRepairers(req, res) {
  const { latitude, longitude, radius_km } = req.query;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'latitude and longitude are required' });
  }

  try {
    const radiusKm = parseInt(radius_km) || 10;
    const repairers = await findNearbyRepairers(parseFloat(latitude), parseFloat(longitude), radiusKm);
    res.json({ success: true, repairers, count: repairers.length });
  } catch (err) {
    console.error('getNearbyRepairers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { 
  updateLocation, 
  getLocation, 
  getNearbyRepairers
};
