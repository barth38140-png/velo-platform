const axios = require('axios');
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function safeRegister(email, password, name, phone, role) {
  try {
    const res = await axios.post(`${BASE_URL}/users/register`, { email, password, name, phone, role });
    return res.data;
  } catch (err) {
    if (err.response) {
      console.log(`Register error for ${email}: status=${err.response.status} data=`, err.response.data);
    } else {
      console.error(`Register unknown error for ${email}:`, err.message);
      console.error(err);
    }
    // try login
    try {
      const loginRes = await axios.post(`${BASE_URL}/users/login`, { email, password });
      return loginRes.data;
    } catch (e) {
      console.error('Login fallback failed:', e.response ? e.response.data : e.message);
      throw e;
    }
  }
}

async function main() {
  try {
    const clientEmail = `client_api_${Date.now()}@example.com`;
    const repairerEmail = `repairer_api_${Date.now()}@example.com`;
    const password = 'Password123!';

    console.log('Base URL:', BASE_URL);

    console.log('\n1) Register client');
    const clientResp = await safeRegister(clientEmail, password, 'Client API', '+33100000001', 'client');
    console.log('clientResp:', clientResp);
    const clientToken = clientResp.token;

    console.log('\n2) Register repairer');
    const repairerResp = await safeRegister(repairerEmail, password, 'Repairer API', '+33100000002', 'repairer');
    console.log('repairerResp:', repairerResp);
    const repairerToken = repairerResp.token;

    console.log('\n3) Create repair request as client');
    const createRepairRes = await axios.post(`${BASE_URL}/repairs`, {
      title: 'Test SMOKE - Frein avant',
      description: 'Frein avant grince (smoke test)',
      bike_type: 'VTC',
      location_lat: 48.8566,
      location_lng: 2.3522,
      location_address: 'Paris'
    }, { headers: { Authorization: `Bearer ${clientToken}` } });
    console.log('createRepairRes.data:', createRepairRes.data);
    const repairId = createRepairRes.data.repair.id || createRepairRes.data.repair?.id;

    console.log('\n4) Repairer creates an offer for that repair');
    const createOfferRes = await axios.post(`${BASE_URL}/repair-offers`, {
      repair_request_id: repairId,
      offered_price: 42.5,
      estimated_duration_hours: 2,
      message: 'Je peux réparer rapidement (smoke)'
    }, { headers: { Authorization: `Bearer ${repairerToken}` } });
    console.log('createOfferRes.data:', createOfferRes.data);
    const offerId = createOfferRes.data.offer.id;

    console.log('\n5) As client, fetch client-offers BEFORE acceptance');
    const beforeOffers = await axios.get(`${BASE_URL}/repair-offers/client-offers`, { headers: { Authorization: `Bearer ${clientToken}` } });
    console.log('beforeOffers.data:', JSON.stringify(beforeOffers.data, null, 2));

    console.log('\n6) As client, accept the offer');
    const acceptRes = await axios.patch(`${BASE_URL}/repair-offers/${offerId}/status`, { status: 'accepted' }, { headers: { Authorization: `Bearer ${clientToken}` } });
    console.log('acceptRes.data:', acceptRes.data);

    console.log('\n7) As client, fetch client-offers AFTER acceptance');
    const afterOffers = await axios.get(`${BASE_URL}/repair-offers/client-offers`, { headers: { Authorization: `Bearer ${clientToken}` } });
    console.log('afterOffers.data:', JSON.stringify(afterOffers.data, null, 2));

    console.log('\nSMOKE complete');
  } catch (err) {
    console.error('SMOKE error:', err.response ? err.response.data : err.message);
    process.exitCode = 1;
  }
}

main();
