import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    api.get('/repairs/pending-requests')
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

export const repairOfferService = {
  createOffer: (repairRequestId, offeredPrice, estimatedDurationHours, message) =>
    api.post('/repair-offers', { repair_request_id: repairRequestId, offered_price: offeredPrice, estimated_duration_hours: estimatedDurationHours, message }),
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
    api.patch(`/repair-offers/${offerId}/status`, { status: 'rejected' })
};

// Photo upload for repair requests (multipart)
export const repairPhotoService = {
  uploadPhotos: (repairRequestId, formData) =>
    api.post(`/repairs/${repairRequestId}/photos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
};

export default api;
