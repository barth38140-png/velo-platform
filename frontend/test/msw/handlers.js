import { http } from 'msw';

// Handlers match any host with /api/... paths using RegExp so they work regardless of VITE_API_URL
const api = '/api';

export const handlers = [
  // Profile
  http.get(new RegExp(`.*${api}/users/profile$`), (req, res, ctx) => {
    console.info('🟢 MSW: /api/users/profile appelé');
    return res(ctx.status(200), ctx.json({ user: { id: 1, name: 'Alice', email: 'alice@example.com', phone: '0123456789', role: 'repairer' } }));
  }),

  // Repairer profile GET
  http.get('/api/repairers/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        profile: {
          id,
          name: 'Alice',
          email: 'alice@example.com',
          phone: '0123456789',
          role: 'repairer',
          skills: 'Wheel repair',
          bio: 'I fix bikes',
          rating: 4.2,
          service_radius_km: 20,
          is_available: true
        }
      })
    );
  }),

  // Repairer profile POST
  http.post(new RegExp(`.*${api}/repairers/profile$`), (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ profile: { id: 1 } }));
  }),

  // Pending repairs
  http.get(new RegExp(`.*${api}/repairs/pending-requests$`), (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ repairs: [
      { id: 10, title: 'Chaîne cassée', description: 'La chaîne est cassée', bike_type: 'VTT', location_address: 'Paris', location_lat: 48.8566, location_lng: 2.3522, status: 'pending' }
    ] }));
  }),

  // Create repair-offer
  http.post(new RegExp(`.*${api}/repair-offers$`), (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ offer: { id: 1 } }));
  }),

  // Client offers list
  http.get(new RegExp(`.*${api}/repair-offers/client-offers$`), (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ offers: [
      { id: 5, repair_title: 'Flat tire', repairer_name: 'Bob', status: 'pending', price: 15, duration: 2, message: 'I can do it' }
    ] }));
  }),

  // Accept/reject offer (PATCH)
  http.patch(new RegExp(`.*${api}/repair-offers/(\d+)/status$`), (req, res, ctx) => {
    const offerId = req.params[0] || '1';
    return res(ctx.status(200), ctx.json({ ok: true, offerId }));
  })
];
