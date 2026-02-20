import axios from 'axios';

// Use environment variable in production, fallback to localhost in development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  createOrganizer: (data) => api.post('/admin/organizers', data),
  getAllOrganizers: (params = {}) => api.get('/admin/organizers', { params }),
  getOrganizer: (id) => api.get(`/admin/organizers/${id}`),
  updateOrganizer: (id, data) => api.put(`/admin/organizers/${id}`, data),
  deleteOrganizer: (id) => api.delete(`/admin/organizers/${id}`),
  toggleOrganizerActive: (id) => api.put(`/admin/organizers/${id}/toggle-active`),
  permanentlyDeleteOrganizer: (id) => api.delete(`/admin/organizers/${id}/permanent`),
  resetPassword: (id, newPassword) => api.post(`/admin/organizers/${id}/reset-password`, { newPassword }),
  getPasswordResetRequests: (status = 'pending') => api.get('/admin/password-resets', { params: { status } }),
  approvePasswordResetRequest: (id, newPassword, adminNotes) => api.put(`/admin/password-resets/${id}/approve`, { newPassword, adminNotes }),
  rejectPasswordResetRequest: (id, adminNotes) => api.put(`/admin/password-resets/${id}/reject`, { adminNotes }),
};

export const publicAPI = {
  getOrganizers: () => api.get('/public/organizers'),
};

export default api;
