import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Properties API
export const getProperties = async (params = {}) => {
  const response = await api.get('/properties', { params });
  return response.data;
};

export const getFeaturedProperties = async (limit = 6) => {
  const response = await api.get('/properties/featured', { params: { limit } });
  return response.data;
};

export const getPropertyById = async (id) => {
  const response = await api.get(`/properties/${id}`);
  return response.data;
};

export const getPropertyByMLS = async (mlsNumber) => {
  const response = await api.get(`/properties/mls/${mlsNumber}`);
  return response.data;
};

// Search API
export const searchProperties = async (searchParams) => {
  const response = await api.post('/search', searchParams);
  return response.data;
};

export const getSearchSuggestions = async (type, query) => {
  const response = await api.get('/search/suggestions', {
    params: { type, query },
  });
  return response.data;
};

// MLS API
export const syncMLS = async () => {
  const response = await api.post('/mls/sync');
  return response.data;
};

export const getMLSSyncStatus = async () => {
  const response = await api.get('/mls/sync/status');
  return response.data;
};

// Auth API
export const signIn = async (credentials) => {
  const response = await api.post('/auth/signin', credentials);
  return response.data;
};

export const signUp = async (userData) => {
  const response = await api.post('/auth/signup', userData);
  return response.data;
};

export const signOut = async () => {
  const response = await api.post('/auth/signout');
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Update profile
export const updateProfile = async (profileData) => {
  const response = await api.put('/auth/profile', profileData);
  return response.data;
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.put('/auth/change-password', {
    currentPassword,
    newPassword
  });
  return response.data;
};

// Agents API
export const getAgents = async (params = {}) => {
  const response = await api.get('/agents', { params });
  return response.data;
};

export const getAgentById = async (id) => {
  const response = await api.get(`/agents/${id}`);
  return response.data;
};

// Inquiries API
export const submitInquiry = async (inquiryData) => {
  const response = await api.post('/inquiries', inquiryData);
  return response.data;
};

// Off-Market Deals API (public)
export const getOffMarketDeals = async (params = {}) => {
  const response = await api.get('/off-market', { params });
  return response.data;
};

export const getOffMarketDealById = async (id) => {
  const response = await api.get(`/off-market/${id}`);
  return response.data;
};

// Admin API
export const getAdminProperties = async (params = {}) => {
  const response = await api.get('/admin/properties', { params });
  return response.data;
};

export const togglePropertyFeatured = async (propertyId, featured) => {
  const response = await api.post(`/admin/properties/${propertyId}/featured`, { featured });
  return response.data;
};

export const getAdminOffMarketDeals = async (params = {}) => {
  const response = await api.get('/admin/off-market-deals', { params });
  return response.data;
};

export const getAdminOffMarketDeal = async (id) => {
  const response = await api.get(`/admin/off-market-deals/${id}`);
  return response.data;
};

export const getOffMarketDealOptions = async () => {
  const response = await api.get('/admin/off-market-deals/options');
  return response.data;
};

export const createOffMarketDeal = async (dealData) => {
  const response = await api.post('/admin/off-market-deals', dealData);
  return response.data;
};

export const updateOffMarketDeal = async (id, dealData) => {
  const response = await api.put(`/admin/off-market-deals/${id}`, dealData);
  return response.data;
};

export const deleteOffMarketDeal = async (id) => {
  const response = await api.delete(`/admin/off-market-deals/${id}`);
  return response.data;
};

// Seller Inquiries API
export const submitSellerInquiry = async (inquiryData) => {
  const response = await api.post('/seller-inquiries', inquiryData);
  return response.data;
};

// Admin Seller Inquiries API
export const getSellerInquiries = async (params = {}) => {
  const response = await api.get('/seller-inquiries', { params });
  return response.data;
};

export const getSellerInquiry = async (id) => {
  const response = await api.get(`/seller-inquiries/${id}`);
  return response.data;
};

export const updateSellerInquiry = async (id, updateData) => {
  const response = await api.put(`/seller-inquiries/${id}`, updateData);
  return response.data;
};

export const deleteSellerInquiry = async (id) => {
  const response = await api.delete(`/seller-inquiries/${id}`);
  return response.data;
};

export default api;

