import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  submitPasswordResetRequest: (reason) => api.post('/auth/request-password-reset', { reason }),
  getMyPasswordResetRequests: () => api.get('/auth/my-password-reset-requests'),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  createOrganizer: (data) => api.post('/admin/organizers', data),
  getAllOrganizers: (params = {}) => api.get('/admin/organizers', { params }),
  getOrganizer: (id) => api.get(`/admin/organizers/${id}`),
  updateOrganizer: (id, data) => api.put(`/admin/organizers/${id}`, data),
  deleteOrganizer: (id) => api.delete(`/admin/organizers/${id}`),
  resetPassword: (id, newPassword) => api.post(`/admin/organizers/${id}/reset-password`, { newPassword }),
  getPasswordResetRequests: (status) => api.get('/admin/password-resets', { params: { status } }),
  approvePasswordResetRequest: (id, data) => api.put(`/admin/password-resets/${id}/approve`, data),
  rejectPasswordResetRequest: (id, data) => api.put(`/admin/password-resets/${id}/reject`, data),
};

export const publicAPI = {
  getOrganizers: () => api.get('/public/organizers'),
};

export const attendanceAPI = {
  scanQR: (ticketId, eventId) => api.post('/attendance/scan', { ticketId, eventId }),
  manualOverride: (data) => api.post('/attendance/manual', data),
  getEventAttendance: (eventId) => api.get(`/attendance/event/${eventId}`),
  getAuditLog: (eventId) => api.get(`/attendance/event/${eventId}/audit`),
};

export const discussionAPI = {
  getMessages: (eventId, params = {}) => api.get(`/discussions/event/${eventId}`, { params }),
  postMessage: (eventId, data) => api.post(`/discussions/event/${eventId}`, data),
  deleteMessage: (id) => api.delete(`/discussions/${id}`),
  pinMessage: (id) => api.put(`/discussions/${id}/pin`),
  reactToMessage: (id, emoji) => api.post(`/discussions/${id}/react`, { emoji }),
};

export const paymentAPI = {
  uploadProof: (registrationId, formData) => api.post(`/payments/${registrationId}/upload-proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getPendingPayments: (eventId, status) => api.get(`/payments/event/${eventId}/pending`, { params: { status } }),
  approvePayment: (registrationId, adminNotes) => api.put(`/payments/${registrationId}/approve`, { adminNotes }),
  rejectPayment: (registrationId, adminNotes) => api.put(`/payments/${registrationId}/reject`, { adminNotes }),
};

export const feedbackAPI = {
  submitFeedback: (eventId, data) => api.post(`/feedback/event/${eventId}`, data),
  getEventFeedback: (eventId, rating) => api.get(`/feedback/event/${eventId}`, { params: { rating } }),
  getMyFeedback: (eventId) => api.get(`/feedback/event/${eventId}/my-feedback`),
};

export const calendarAPI = {
  getCalendarLinks: (eventId) => api.get(`/calendar/event/${eventId}/links`),
  downloadICS: (eventId) => `${API_BASE_URL}/calendar/event/${eventId}/ics`,
};

export default api;
