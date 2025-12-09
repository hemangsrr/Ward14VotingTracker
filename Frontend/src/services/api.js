import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add CSRF token
api.interceptors.request.use(
  (config) => {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper function to get CSRF token from cookies
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Authentication APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: () => api.post('/auth/logout/'),
  getCurrentUser: () => api.get('/auth/user/'),
  getCSRFToken: () => api.get('/auth/csrf/'),
};

// Voters APIs
export const votersAPI = {
  getAll: (params) => api.get('/voters/', { params }),
  getById: (id) => api.get(`/voters/${id}/`),
  update: (id, data) => api.patch(`/voters/${id}/`, data),
  search: (query) => api.get('/voters/', { params: { search: query } }),
};

// Volunteers APIs
export const volunteersAPI = {
  getAll: (params) => api.get('/volunteers/', { params }),
  getById: (id) => api.get(`/volunteers/${id}/`),
  getVoters: (id, params) => api.get(`/volunteers/${id}/voters/`, { params }),
};

// Dashboard APIs
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats/'),
  getVolunteerStats: () => api.get('/dashboard/volunteer-stats/'),
  getPartyStats: () => api.get('/dashboard/party-stats/'),
};

// Settings APIs
export const settingsAPI = {
  getSettings: () => api.get('/settings/'),
};

export default api;
