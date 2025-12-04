import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const adminService = {
  // Gestion des utilisateurs
  getAllUsers: async (page = 1, filters = {}) => {
    const params = new URLSearchParams({
      page,
      ...(filters.role && { role: filters.role }),
      ...(filters.status && { status: filters.status }),
      ...(filters.search && { search: filters.search })
    });
    return axios.get(`${API_URL}/admin/users?${params}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  },

  toggleUserStatus: async (userId, action) => {
    return axios.put(`${API_URL}/admin/users/${userId}`, { action }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  },

  verifyRepairer: async (userId) => {
    return axios.post(`${API_URL}/admin/users/${userId}/verify`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  },

  getPendingVerifications: async () => {
    return axios.get(`${API_URL}/admin/users/pending-verifications`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  },

  // Modération
  getFlaggedReviews: async () => {
    return axios.get(`${API_URL}/admin/reviews/flagged`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  },

  moderateReview: async (reviewId, data) => {
    return axios.post(`${API_URL}/admin/reviews/${reviewId}/moderate`, data, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  },

  getFlaggedMessages: async () => {
    return axios.get(`${API_URL}/admin/messages/flagged`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  },

  moderateMessage: async (messageId, data) => {
    return axios.post(`${API_URL}/admin/messages/${messageId}/moderate`, data, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  },

  // Statistiques
  getGlobalStats: async (period = '7d') => {
    return axios.get(`${API_URL}/admin/stats/global?period=${period}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  },

  getRevenueStats: async (period = '7d') => {
    return axios.get(`${API_URL}/admin/stats/revenue?period=${period}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  },

  getAuditLogs: async (page = 1, filters = {}) => {
    const params = new URLSearchParams({
      page,
      ...(filters.action && { action: filters.action }),
      ...(filters.user_id && { user_id: filters.user_id })
    });
    return axios.get(`${API_URL}/admin/stats/audit-logs?${params}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  },

  getActivityCharts: async (period = '7d') => {
    return axios.get(`${API_URL}/admin/stats/activity-charts?period=${period}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  }
};
