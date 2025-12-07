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
const isSubdomainMode = hostname.includes('.blueflagindy.com');
const subdomain = isSubdomainMode ? hostname.split('.')[0] : 'none';

console.log(`API configured with baseURL: ${API_URL} (from ${hostname})`);
if (isSubdomainMode) {
  console.log(`[API Config] Running in subdomain mode: ${subdomain}`);
}

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

// Helper function to check image URLs in responses
const checkAndLogImageUrls = (response) => {
  try {
    // Only log in development or when explicitly enabled
    if (process.env.NODE_ENV !== 'production' || window.DEBUG_IMAGE_URLS) {
      const data = response.data;
      
      // Check for different response formats
      if (data) {
        // Check for common image paths in response
        const urlPaths = [];
        
        // Check for deal images
        if (data.deal && data.deal.images && data.deal.images.length > 0) {
          urlPaths.push(...data.deal.images.map(img => img.url || img.imageUrl || img.thumbnailUrl));
        }
        
        // Check for deals list
        if (data.deals && data.deals.length > 0) {
          data.deals.forEach(deal => {
            if (deal.thumbnailUrl) urlPaths.push(deal.thumbnailUrl);
            if (deal.images && deal.images.length > 0) {
              urlPaths.push(...deal.images.map(img => img.url || img.imageUrl || img.thumbnailUrl));
            }
          });
        }
        
        // Check for blogs
        if (data.blogs && data.blogs.length > 0) {
          data.blogs.forEach(blog => {
            if (blog.thumbnailUrl) urlPaths.push(blog.thumbnailUrl);
            if (blog.images && blog.images.length > 0) {
              urlPaths.push(...blog.images.map(img => img.url || img.imageUrl || img.thumbnailUrl));
            }
          });
        }
        
        // Log found URLs
        if (urlPaths.length > 0) {
          console.log('[API] Found image URLs in response:', urlPaths.filter(Boolean).slice(0, 3));
          
          // For subdomains, verify URL construction
          if (isSubdomainMode) {
            console.log('[API] URL construction for subdomain mode:');
            urlPaths.filter(Boolean).slice(0, 3).forEach(url => {
              if (url && typeof url === 'string') {
                // Check if URL is already absolute
                if (url.match(/^https?:\/\//)) {
                  console.log(`- Already absolute: ${url}`);
                } else {
                  // Construct absolute URL
                  const baseUrl = window.location.origin;
                  const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
                  console.log(`- Relative: ${url} → Absolute: ${fullUrl}`);
                }
              }
            });
          }
        }
      }
    }
  } catch (err) {
    // Don't fail on logging errors
    console.warn('[API] Error checking image URLs:', err);
  }
  
  return response;
};

// Add response interceptor for automatic retrying of 404 errors with path adjustments
api.interceptors.response.use(
  response => {
    // Check for image URLs in successful responses
    return checkAndLogImageUrls(response);
  },
  async error => {
    // Enhanced error logging
    const errorName = error.name || 'Unknown';
    const errorCode = error.code || 'No code';
    const errorMessage = error.message || 'No message';
    const url = error.config?.url || 'No URL';
    
    // Log more detailed information about network errors
    if (errorName === 'Error' && errorCode === 'ERR_NETWORK') {
      console.error(`[API] Network error accessing: ${url}`);
      console.error(`[API] Error details: ${errorCode} - ${errorMessage}`);
      console.error('[API] This typically means the API server is unreachable');
      
      // Add fallback for static builds when no API is available
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        console.warn('[API] Using static content fallback (no API server)'); 
        
        // For debugging only - remove in production
        const errorDetail = {
          endpoint: url,
          message: errorMessage,
          code: errorCode,
          name: errorName
        };
        console.log('[API] Full error details:', errorDetail);
        
        // Return mock successful response for static content
        if (url.includes('/api/off-market') || url.includes('/api/blogs')) {
          console.info('[API] Using static content fallback for off-market/blogs');
          return Promise.resolve({ data: { deals: [], blogs: [] }, status: 200, statusText: 'OK (Static Fallback)' });
        }
      }
    }
    
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
    
    // For all other errors, just pass through with improved logging
    return Promise.reject(error);
  }
);

// Properties API
export const getProperties = async (params = {}) => {
  try {
    const response = await api.get('/api/properties', { 
      params,
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error getting properties:', error);
    throw error;
  }
};

export const getFeaturedProperties = async (limit = 6) => {
  try {
    const response = await api.get('/api/properties/featured', { 
      params: { limit },
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    // Enhanced error logging with detailed information
    const errorName = error.name || 'Unknown';
    const errorCode = error.code || 'No code';
    const errorMessage = error.message || 'No message';
    const status = error.response?.status;
    
    console.error(`[API] Error getting featured properties: ${errorName} (${errorCode}) - ${errorMessage}`);
    if (status) console.error(`[API] HTTP Status: ${status}`);
    
    // Return fallback data for better UX
    console.warn('[API] Returning empty featured properties list as fallback');
    return { properties: [] };
  }
};

export const getPropertyById = async (id) => {
  try {
    const response = await api.get(`/api/properties/${id}`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`[API] Error getting property ${id}:`, error);
    throw error;
  }
};

export const getPropertyByIdSEO = async (id) => {
  try {
    const response = await api.get(`/api/properties/${id}/seo`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`[API] Error getting property SEO ${id}:`, error);
    throw error;
  }
};

export const getPropertyByMLS = async (mlsNumber) => {
  try {
    const response = await api.get(`/api/properties/mls/${mlsNumber}`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`[API] Error getting property by MLS number ${mlsNumber}:`, error);
    throw error;
  }
};

// Search API
export const searchProperties = async (searchParams) => {
  try {
    const response = await api.post('/api/search', searchParams, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error searching properties:', error);
    throw error;
  }
};

export const getSearchSuggestions = async (type, query) => {
  try {
    const response = await api.get('/api/search/suggestions', {
      params: { type, query },
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error getting search suggestions:', error);
    throw error;
  }
};

// MLS API
export const syncMLS = async () => {
  try {
    const response = await api.post('/api/mls/sync', {}, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error syncing MLS:', error);
    throw error;
  }
};

export const getMLSSyncStatus = async () => {
  try {
    const response = await api.get('/api/mls/sync/status', {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error getting MLS sync status:', error);
    throw error;
  }
};

// Auth API
export const signIn = async (credentials) => {
  try {
    console.log(`[API] Signing in user`);
    const response = await api.post('/api/auth/signin', credentials, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error signing in:', error);
    throw error;
  }
};

export const signUp = async (userData) => {
  try {
    const response = await api.post('/api/auth/signup', userData, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error signing up:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    const response = await api.post('/api/auth/signout', {}, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error signing out:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/api/auth/me', {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error getting current user:', error);
    throw error;
  }
};

// Update profile
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/api/auth/profile', profileData, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error updating profile:', error);
    throw error;
  }
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.put('/api/auth/change-password', {
      currentPassword,
      newPassword
    }, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error changing password:', error);
    throw error;
  }
};

// Agents API
export const getAgents = async (params = {}) => {
  try {
    const response = await api.get('/api/agents', { 
      params,
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    // Enhanced error logging with detailed information
    const errorName = error.name || 'Unknown';
    const errorCode = error.code || 'No code';
    const errorMessage = error.message || 'No message';
    const status = error.response?.status;
    
    console.error(`[API] Error getting agents: ${errorName} (${errorCode}) - ${errorMessage}`);
    if (status) console.error(`[API] HTTP Status: ${status}`);
    
    // Return fallback data for better UX
    console.warn('[API] Returning empty agents list as fallback');
    return { agents: [] };
  }
};

export const getAgentById = async (id) => {
  try {
    const response = await api.get(`/api/agents/${id}`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`[API] Error getting agent ${id}:`, error);
    throw error;
  }
};

// Inquiries API
export const submitInquiry = async (inquiryData) => {
  try {
    const response = await api.post('/api/inquiries', inquiryData, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error submitting inquiry:', error);
    throw error;
  }
};

// Off-Market Deals API (public)
export const getOffMarketDeals = async (params = {}) => {
  try {
    // Always use explicit API path to avoid HTML responses
    const normalParams = { ...params };
    delete normalParams.useExplicitApi;
    
    // IMPORTANT: Always use /api/off-market instead of /off-market to avoid conflicts
    const endpoint = '/api/off-market';
    
    console.log(`[API] Fetching off-market deals from: ${API_URL} with params:`, normalParams);
    console.log(`[API] Using endpoint: ${endpoint} (explicit API path)`);
    
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
    
    console.log(`[API] Got off-market deals: ${response.status} ${response.data?.deals?.length || 0} items`);
    return response.data;
  } catch (error) {
    console.error('[API] Error loading off-market deals:', error);
    
    // If we get a detailed error response, log it
    if (error.response) {
      console.error('[API] Error response:', error.response.status, error.response.data);
      // Check if we received HTML
      const contentType = error.response.headers?.['content-type'] || '';
      if (contentType.includes('text/html')) {
        console.error('[API] Server returned HTML instead of JSON!');
      }
    } else if (error.request) {
      console.error('[API] No response received');
      console.log('[API] Using baseURL:', api.defaults.baseURL);
      console.log('[API] Browser location:', typeof window !== 'undefined' ? window.location.href : 'Not in browser');
    } else {
      console.error('[API] Error:', error.message);
    }
    
    // Return empty data instead of throwing to avoid breaking UI
    return { deals: [] };
  }
};

export const getOffMarketDealById = async (id) => {
  try {
    // IMPORTANT: Always use /api/off-market instead of /off-market to avoid conflicts
    const endpoint = `/api/off-market/${id}`;
    console.log(`[API] Fetching off-market deal ${id} using endpoint: ${endpoint}`);
    
    const response = await api.get(endpoint, {
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
    
    return response.data;
  } catch (error) {
    console.error(`[API] Error loading off-market deal ${id}:`, error);
    
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

// Admin API
export const getAdminProperties = async (params = {}) => {
  try {
    const response = await api.get('/api/admin/properties', { 
      params,
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error getting admin properties:', error);
    throw error;
  }
};

export const togglePropertyFeatured = async (propertyId, featured) => {
  try {
    const response = await api.post(`/api/admin/properties/${propertyId}/featured`, { featured }, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`[API] Error toggling property ${propertyId} featured status:`, error);
    throw error;
  }
};

export const getAdminOffMarketDeals = async (params = {}) => {
  try {
    const response = await api.get('/api/admin/off-market-deals', { 
      params,
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error getting admin off-market deals:', error);
    throw error;
  }
};

export const getAdminOffMarketDeal = async (id) => {
  try {
    const response = await api.get(`/api/admin/off-market-deals/${id}`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`[API] Error getting admin off-market deal ${id}:`, error);
    throw error;
  }
};

export const getOffMarketDealOptions = async () => {
  try {
    const response = await api.get('/api/admin/off-market-deals/options', {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error getting off-market deal options:', error);
    throw error;
  }
};

export const createOffMarketDeal = async (dealData) => {
  try {
    const response = await api.post('/api/admin/off-market-deals', dealData, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error creating off-market deal:', error);
    throw error;
  }
};

export const updateOffMarketDeal = async (id, dealData) => {
  try {
    const response = await api.put(`/api/admin/off-market-deals/${id}`, dealData, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`[API] Error updating off-market deal ${id}:`, error);
    throw error;
  }
};

export const deleteOffMarketDeal = async (id) => {
  try {
    const response = await api.delete(`/api/admin/off-market-deals/${id}`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`[API] Error deleting off-market deal ${id}:`, error);
    throw error;
  }
};

// Seller Inquiries API
export const submitSellerInquiry = async (inquiryData) => {
  try {
    const response = await api.post('/api/seller-inquiries', inquiryData, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error submitting seller inquiry:', error);
    throw error;
  }
};

// Admin Seller Inquiries API
export const getSellerInquiries = async (params = {}) => {
  try {
    const response = await api.get('/api/seller-inquiries', { 
      params,
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error getting seller inquiries:', error);
    throw error;
  }
};

export const createSellerInquiry = async (data) => {
  try {
    const response = await api.post('/api/seller-inquiries', data, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error creating seller inquiry:', error);
    throw error;
  }
};

export const getSellerInquiry = async (id) => {
  try {
    const response = await api.get(`/api/seller-inquiries/${id}`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`[API] Error getting seller inquiry ${id}:`, error);
    throw error;
  }
};

export const updateSellerInquiry = async (id, updateData) => {
  try {
    const response = await api.put(`/api/seller-inquiries/${id}`, updateData, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`[API] Error updating seller inquiry ${id}:`, error);
    throw error;
  }
};

export const deleteSellerInquiry = async (id) => {
  try {
    const response = await api.delete(`/api/seller-inquiries/${id}`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`[API] Error deleting seller inquiry ${id}:`, error);
    throw error;
  }
};

// Blogs API (public)
export const getBlogs = async (params = {}) => {
  try {
    // Always use explicit API path to avoid HTML responses
    const normalParams = { ...params };
    delete normalParams.useExplicitApi;
    
    // IMPORTANT: Always use /api/blogs instead of /blogs to avoid conflicts
    const endpoint = '/api/blogs';
    
    console.log(`[API] Fetching blogs from: ${API_URL} with params:`, normalParams);
    console.log(`[API] Using endpoint: ${endpoint} (explicit API path)`);
    
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
    // IMPORTANT: Always use /api/blogs instead of /blogs to avoid conflicts
    const response = await api.get('/api/blogs/latest', { 
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
    // IMPORTANT: Always use /api/blogs instead of /blogs to avoid conflicts
    const response = await api.get(`/api/blogs/${id}`, {
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
export const getAdminBlogs = async (params = {}) => {
  try {
    const response = await api.get('/api/admin/blogs', { 
      params,
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error getting admin blogs:', error);
    throw error;
  }
};

export const getAdminBlog = async (id) => {
  try {
    const response = await api.get(`/api/admin/blogs/${id}`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`[API] Error getting admin blog ${id}:`, error);
    throw error;
  }
};

export const createBlog = async (blogData) => {
  try {
    const response = await api.post('/api/admin/blogs', blogData, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error('[API] Error creating blog:', error);
    throw error;
  }
};

export const updateBlog = async (id, blogData) => {
  try {
    const response = await api.put(`/api/admin/blogs/${id}`, blogData, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`[API] Error updating blog ${id}:`, error);
    throw error;
  }
};

export const deleteBlog = async (id) => {
  try {
    const response = await api.delete(`/api/admin/blogs/${id}`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`[API] Error deleting blog ${id}:`, error);
    throw error;
  }
};

// File Upload API
export const uploadFile = async (file, token = null) => {
  try {
    // If token is not provided, try to get it from localStorage
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('token');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_URL}/api/upload/file`, formData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        // Don't set Content-Type - let browser set it with boundary
      },
    });
    console.log('[API] File upload successful:', response.status);
    return response.data;
  } catch (error) {
    console.error('[API] Error uploading file:', error);
    throw error;
  }
};

export const uploadFiles = async (files, token = null) => {
  try {
    // If token is not provided, try to get it from localStorage
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('token');
    }
    
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    const response = await axios.post(`${API_URL}/api/upload/files`, formData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        // Don't set Content-Type - let browser set it with boundary
      },
    });
    console.log('[API] Multiple files upload successful:', response.status);
    return response.data;
  } catch (error) {
    console.error('[API] Error uploading files:', error);
    throw error;
  }
};

export default api;
