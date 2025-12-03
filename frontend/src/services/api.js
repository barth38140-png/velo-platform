import axios from 'axios';

// Utiliser un chemin relatif pour profiter du proxy Vite en dev
// En production, VITE_API_URL sera défini pour pointer vers l'API backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur de réponse pour supprimer les logs d'erreurs 404
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ne pas logger les 404 en console (erreurs attendues pour données non créées)
    if (error?.response?.status !== 404) {
      console.error('API Error:', error);
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (email, password, name, phone, role) =>
    api.post('/users/register', { email, password, name, phone, role }),
  login: (email, password) =>
    api.post('/users/login', { email, password }),
  getProfile: () =>
    api.get('/users/profile')
};

export const repairService = {
  createRepair: (title, description, bikeType, locationLat, locationLng, locationAddress, metadata = {}) =>
    api.post('/repairs', { title, description, bike_type: bikeType, location_lat: locationLat, location_lng: locationLng, location_address: locationAddress, metadata }),
  getMyRepairs: () =>
    api.get('/repairs'),
  getRepairDetail: (repairId) =>
    api.get(`/repairs/detail/${repairId}`),
  updateRepairStatus: (repairId, status) =>
    api.patch(`/repairs/${repairId}/status`, { status }),
  getPendingRepairs: () =>
    api.get('/repairs/pending-requests'),
  startRepair: (repairId) =>
    api.post(`/repairs/${repairId}/start`),
  completeRepair: (repairId) =>
    api.post(`/repairs/${repairId}/complete`)
};

export const repairerService = {
  createProfile: (skills, bio, serviceRadiusKm, isAvailable) =>
    api.post('/repairers/profile', { skills, bio, service_radius_km: serviceRadiusKm, is_available: isAvailable }),
  getRepairerProfile: (repairerId) =>
    api.get(`/repairers/${repairerId}`),
  getAllRepairers: () =>
    api.get('/repairers/all')
};

export const locationService = {
  updateLocation: (latitude, longitude, address) =>
    api.post('/locations', { latitude, longitude, address }),
  getLocation: (userId) =>
    api.get(`/locations/${userId}`),
  getNearbyRepairers: (latitude, longitude, radiusKm = 10) =>
    api.get(`/locations/nearby-repairers?latitude=${latitude}&longitude=${longitude}&radius_km=${radiusKm}`)
};

export const messageService = {
  sendMessage: (receiverId, content, repairRequestId) =>
    api.post('/messages', { receiver_id: receiverId, content, repair_request_id: repairRequestId }),
  getConversations: () =>
    api.get('/messages/conversations'),
  getConversation: (userId) =>
    api.get(`/messages/${userId}`)
};

// Nouveau service de conversations (messagerie structurée)
export const conversationService = {
  createConversation: (repairerId, repairRequestId) =>
    api.post('/conversations', { repairerId, repairRequestId }),
  getConversations: () =>
    api.get('/conversations'),
  getMessages: (conversationId) =>
    api.get(`/conversations/${conversationId}/messages`),
  sendMessage: (conversationId, content) =>
    api.post(`/conversations/${conversationId}/messages`, { content })
};

export const repairOfferService = {
  createOffer: (repairRequestId, offeredPrice, estimatedDurationHours, message, scheduledFrom = null, scheduledTo = null) => {
    const payload = { 
      repair_request_id: repairRequestId, 
      offered_price: offeredPrice, 
      estimated_duration_hours: estimatedDurationHours, 
      message 
    };
    if (scheduledFrom) payload.scheduled_from = scheduledFrom;
    if (scheduledTo) payload.scheduled_to = scheduledTo;
    return api.post('/repair-offers', payload);
  },
  getRepairerOffers: () =>
    api.get('/repair-offers/my-offers'),
  getClientOffers: () =>
    api.get('/repair-offers/client-offers'),
  getOffersForRepair: (repairId) =>
    api.get(`/repair-offers/${repairId}/offers`),
  getOfferDetail: (offerId) =>
    api.get(`/repair-offers/${offerId}`),
  updateOfferStatus: (offerId, status) =>
    api.patch(`/repair-offers/${offerId}/status`, { status }),
  acceptOffer: (offerId) =>
    api.patch(`/repair-offers/${offerId}/status`, { status: 'accepted' }),
  rejectOffer: (offerId) =>
    api.patch(`/repair-offers/${offerId}/status`, { status: 'rejected' }),
  proposeDate: (offerId, scheduledFrom, scheduledTo = null) =>
    api.post(`/repair-offers/${offerId}/propose-date`, { 
      scheduled_from: scheduledFrom, 
      scheduled_to: scheduledTo 
    }),
  confirmDate: (offerId) =>
    api.post(`/repair-offers/${offerId}/confirm-date`)
};

// Disponibilités réparateur
export const availabilityService = {
  async list(repairerId, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = `/api/availability/${repairerId}${query ? `?${query}` : ''}`;
    const res = await api.get(url);
    return res.data;
  },
  async create(startsAt, endsAt) {
    const res = await api.post(`/api/availability`, { startsAt, endsAt });
    return res.data;
  },
  async remove(slotId) {
    const res = await api.delete(`/api/availability/${slotId}`);
    return res.data;
  },
  async reserve(slotId, repairerId, repairRequestId) {
    const res = await api.post(`/api/availability/${slotId}/reserve`, { repairerId, repairRequestId });
    return res.data;
  }
};

export const bikeService = {
  getMyBikes: () => api.get('/bikes').then(r => r.data),
  createBike: (payload) => api.post('/bikes', payload).then(r => r.data),
  getBike: (id) => api.get(`/bikes/${id}`).then(r => r.data),
  updateBike: (id, payload) => api.patch(`/bikes/${id}`, payload).then(r => r.data),
  // Update technical metadata + unknown attributes, returns updated bike with confidence_score
  updateBikeTech: (id, tech, unknownAttributes = []) => api.patch(`/bikes/${id}/tech`, { tech, unknown_attributes: unknownAttributes }).then(r => r.data),
  updateComponent: (componentId, payload) => api.patch(`/bikes/component/${componentId}`, payload).then(r => r.data),
  async getBrands() {
    const res = await fetch(`${API_BASE_URL}/brands`);
    if (!res.ok) throw new Error('Failed to fetch brands');
    const data = await res.json();
    return Array.isArray(data.brands) ? data.brands : [];
  },
  async addBrand(name) {
    const res = await fetch(`${API_BASE_URL}/brands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to add brand');
    return res.json();
  },
  async getModels(brand) {
    const url = brand ? `${API_BASE_URL}/bike-models?brand=${encodeURIComponent(brand)}` : `${API_BASE_URL}/bike-models`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch models');
    const data = await res.json();
    return Array.isArray(data.models) ? data.models : [];
  },
  async addModel(brand, model) {
    const res = await fetch(`${API_BASE_URL}/bike-models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, model }),
    });
    if (!res.ok) throw new Error('Failed to add model');
    return res.json();
  },
  async getWheelSizes() {
    const res = await fetch(`${API_BASE_URL}/wheel-sizes`);
    if (!res.ok) throw new Error('Failed to fetch wheel sizes');
    const data = await res.json();
    return Array.isArray(data.sizes) ? data.sizes : [];
  },
  async addWheelSize(size) {
    const res = await fetch(`${API_BASE_URL}/wheel-sizes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ size }),
    });
    if (!res.ok) throw new Error('Failed to add wheel size');
    return res.json();
  },
};

// Component management
bikeService.createComponent = (bikeId, payload) => api.post(`/bikes/${bikeId}/components`, payload).then(r => r.data);
bikeService.deleteComponent = (componentId) => api.delete(`/bikes/component/${componentId}`).then(r => r.data);
bikeService.deleteBike = (bikeId) => api.delete(`/bikes/${bikeId}`).then(r => r.data);

// Photo upload for repair requests (multipart)
export const repairPhotoService = {
  uploadPhotos: (repairRequestId, formData) =>
    api.post(`/repairs/${repairRequestId}/photos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
};

// Review service for rating system
export const reviewService = {
  createReview: (repairRequestId, rating, comment) =>
    api.post('/reviews', { repair_request_id: repairRequestId, rating, comment }),
  getReviewByRepairId: (repairId) =>
    api.get(`/reviews/repair/${repairId}`),
  getRepairerReviews: (repairerId, limit = 10, offset = 0) =>
    api.get(`/reviews/repairer/${repairerId}?limit=${limit}&offset=${offset}`),
  getRepairerStats: (repairerId) =>
    api.get(`/reviews/repairer/${repairerId}/stats`)
};

export default api;
