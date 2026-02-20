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
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  createOrganizer: (data) => api.post('/admin/organizers', data),
  getAllOrganizers: (params = {}) => api.get('/admin/organizers', { params }),
  getOrganizer: (id) => api.get(`/admin/organizers/${id}`),
  updateOrganizer: (id, data) => api.put(`/admin/organizers/${id}`, data),
  deleteOrganizer: (id) => api.delete(`/admin/organizers/${id}`),
  resetPassword: (id, newPassword) => api.post(`/admin/organizers/${id}/reset-password`, { newPassword }),
};

export const publicAPI = {
  getOrganizers: () => api.get('/public/organizers'),
};

export default api;
