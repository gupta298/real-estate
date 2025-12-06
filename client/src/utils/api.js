import axios from 'axios';
import { API_URL } from './apiConfig';

// Create API instance with robust error handling
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout
  timeout: 10000,
});

// Log API configuration with more details
const hostname = typeof window !== 'undefined' ? window.location.hostname : 'SSR';
console.log(`API configured with baseURL: ${API_URL} (from ${hostname})`);

// Allow inspecting the API config in browser console
if (typeof window !== 'undefined') {
  window.DEBUG_API_URL = API_URL;
  
  // Add a global error handler for failed API requests
  window.addEventListener('unhandledrejection', event => {
    if (event.reason && event.reason.isAxiosError) {
      console.error('[API] Unhandled API error:', event.reason);
      // If the error is 404 and has /api/ in the URL, try without /api/
      if (event.reason.response && event.reason.response.status === 404) {
        const failedUrl = event.reason.config.url;
        console.warn('[API] 404 error for URL:', failedUrl);
      }
    }
  });
}

// Add auth token to requests
api.interceptors.request.use((config) => {
  // Add auth token if available
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add origin information to help with debugging
  if (typeof window !== 'undefined') {
    config.headers['X-Request-Origin'] = window.location.hostname;
  }
  
  // Log outgoing requests in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[API Request] ${config.method?.toUpperCase() || 'GET'} ${config.baseURL}${config.url}`);
  }
  
  return config;
});

// Add response interceptor for automatic retrying of 404 errors with path adjustments
api.interceptors.response.use(
  response => response,
  async error => {
    // Only retry for configured cases and if we haven't tried already
    if (error.response && 
        error.response.status === 404 && 
        error.config && 
        !error.config._retry) {
      
      // Mark as retried to prevent infinite loops
      error.config._retry = true;
      
      let newUrl = error.config.url;
      let retryReason = '';
      
      // Case 1: If URL contains /api/, try without it
      if (error.config.url.includes('/api/')) {
        newUrl = error.config.url.replace('/api/', '/');
        retryReason = 'removing /api prefix';
      }
      // Case 2: If URL doesn't have /api/ but we're on a subdomain, try adding it
      else if (typeof window !== 'undefined' && 
               window.location.hostname.includes('.blueflagindy.com') &&
               !error.config.url.includes('/api/')) {
        newUrl = error.config.url.replace(/^\//, '/api/');
        retryReason = 'adding /api prefix';
      }
      
      console.log(`[API] Retrying 404 request by ${retryReason}: ${newUrl}`);
      
      try {
        // Create a new request with the modified URL
        const newConfig = { ...error.config, url: newUrl };
        return await axios(newConfig);
      } catch (retryError) {
        console.error(`[API] Retry also failed:`, retryError);
        return Promise.reject(retryError);
      }
    }
    
    // For all other errors, just pass through
    return Promise.reject(error);
  }
);

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
  console.log('[API] Fetching off-market deals from:', API_URL, 'with params:', params);
  try {
    // Force absolute URL for debugging
    const fullUrl = `${API_URL}/off-market`;
    console.log('[API] Full URL being used:', fullUrl);
    
    const response = await api.get('/off-market', { params });
    console.log('[API] Got off-market deals:', response.status, response.data?.deals?.length || 0, 'items');
    return response.data;
  } catch (error) {
    console.error('[API] Error loading off-market deals:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('[API] Error response:', error.response.status, error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('[API] No response received for URL:', `${API_URL}/off-market`);
      console.log('[API] Using baseURL:', api.defaults.baseURL);
      console.log('[API] Browser location:', typeof window !== 'undefined' ? window.location.href : 'Not in browser');
    } else {
      // Something happened in setting up the request
      console.error('[API] Error:', error.message);
    }
    // Return empty data instead of throwing to avoid breaking UI
    return { deals: [] };
  }
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

// Blogs API (public)
export const getBlogs = async (params = {}) => {
  try {
    // Extract special flag then remove it from params
    const useExplicitApi = params.useExplicitApi === true;
    const normalParams = { ...params };
    delete normalParams.useExplicitApi;
    
    // Use explicit API path on retry
    const endpoint = useExplicitApi ? '/api/blogs' : '/blogs';
    
    console.log(`[API] Fetching blogs from: ${API_URL} with params:`, normalParams);
    console.log(`[API] Using endpoint: ${endpoint} (explicit: ${useExplicitApi})`);
    
    const response = await api.get(endpoint, { 
      params: normalParams,
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-API-Request': 'true'
      } 
    });
    
    // Check if we received HTML instead of JSON (common error)
    const contentType = response.headers?.['content-type'] || '';
    if (contentType.includes('text/html')) {
      console.error('[API] Received HTML instead of JSON!');
      throw new Error('Received HTML instead of JSON response');
    }
    
    console.log(`[API] Got blogs: ${response.status} ${response.data?.blogs?.length || 0} items`);
    return response.data;
  } catch (error) {
    console.error('[API] Error loading blogs:', error);
    
    // If we get a detailed error response, log it
    if (error.response) {
      console.error('[API] Error response:', error.response.status, error.response.data);
      // Check if we received HTML
      const contentType = error.response.headers?.['content-type'] || '';
      if (contentType.includes('text/html')) {
        console.error('[API] Server returned HTML instead of JSON!');
      }
    }
    
    throw error;
  }
};

export const getLatestBlogs = async (limit = 5) => {
  try {
    console.log(`[API] Fetching latest blogs from: ${API_URL} with limit: ${limit}`);
    const response = await api.get('/blogs/latest', { 
      params: { limit },
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    // Check if we received HTML instead of JSON
    const contentType = response.headers?.['content-type'] || '';
    if (contentType.includes('text/html')) {
      console.error('[API] Received HTML instead of JSON!');
      throw new Error('Received HTML instead of JSON response');
    }
    
    console.log(`[API] Got latest blogs: ${response.status} ${response.data?.blogs?.length || 0} items`);
    return response.data;
  } catch (error) {
    console.error('[API] Error loading latest blogs:', error);
    
    // If we get a detailed error response, log it
    if (error.response) {
      console.error('[API] Error response:', error.response.status, error.response.data);
    }
    
    throw error;
  }
};

export const getBlogById = async (id) => {
  try {
    console.log(`[API] Fetching blog ${id} from: ${API_URL}`);
    const response = await api.get(`/blogs/${id}`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    // Check if we received HTML instead of JSON
    const contentType = response.headers?.['content-type'] || '';
    if (contentType.includes('text/html')) {
      console.error('[API] Received HTML instead of JSON!');
      throw new Error('Received HTML instead of JSON response');
    }
    
    console.log(`[API] Got blog: ${response.status}`, response.data?.blog?.title || 'no blog');
    return response.data;
  } catch (error) {
    console.error(`[API] Error loading blog ${id}:`, error);
    
    // If we get a detailed error response, log it
    if (error.response) {
      console.error('[API] Error response:', error.response.status, error.response.data);
    }
    
    throw error;
  }
};

// Admin Blogs API
export const getAdminBlogs = async () => {
  const response = await api.get('/admin/blogs');
  return response.data;
};

export const getAdminBlog = async (id) => {
  const response = await api.get(`/admin/blogs/${id}`);
  return response.data;
};

export const createBlog = async (blogData) => {
  const response = await api.post('/admin/blogs', blogData);
  return response.data;
};

export const updateBlog = async (id, blogData) => {
  const response = await api.put(`/admin/blogs/${id}`, blogData);
  return response.data;
};

export const deleteBlog = async (id) => {
  const response = await api.delete(`/admin/blogs/${id}`);
  return response.data;
};

// File Upload API
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  // Create a custom axios instance for file uploads to avoid Content-Type header issues
  const token = localStorage.getItem('token');
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  const response = await axios.post(`${API_URL}/upload/file`, formData, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      // Don't set Content-Type - let browser set it with boundary
    },
  });
  return response.data;
};

export const uploadFiles = async (files) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  // Create a custom axios instance for file uploads to avoid Content-Type header issues
  const token = localStorage.getItem('token');
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  const response = await axios.post(`${API_URL}/upload/files`, formData, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      // Don't set Content-Type - let browser set it with boundary
    },
  });
  return response.data;
};

export default api;

