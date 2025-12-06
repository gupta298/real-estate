/**
 * API Configuration
 * Determines the correct API URL to use based on the current environment
 */

// Get API URL based on current domain or environment variables
const getApiUrl = () => {
  // Use environment variable if available
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Otherwise, derive from current location in browser environment
  if (typeof window !== 'undefined') {
    // Extract base domain
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // For subdomains, use the main domain for API
    if (hostname.includes('.blueflagindy.com')) {
      // Since we're on a subdomain, we need to target the main site's API
      return `${protocol}//blueflagindy.com/api`;
    }
    
    // For localhost development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    
    // For production (main domain)
    return `${protocol}//${hostname}/api`;
  }
  
  // Fallback for SSR or other environments
  return 'http://localhost:5000/api';
};

// Initially set the API URL
let _apiUrl = getApiUrl();

// Export the API URL
export const API_URL = _apiUrl;

// Function to update API URL at runtime (useful for debugging or fallbacks)
export const updateApiUrl = (newUrl) => {
  console.log(`[API Config] Updating API URL from: ${_apiUrl} to: ${newUrl}`);
  _apiUrl = newUrl;
  
  // Return the new URL for chaining
  return _apiUrl;
};

// Function to force use of specific base URL (for testing/fallbacks)
export const forceBaseUrl = () => {
  // Try to detect current base domain
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // Force use of the hostname that's actually working
    if (hostname.includes('blueflagindy.com')) {
      // For any blueflagindy subdomain, use the main domain
      updateApiUrl(`${protocol}//blueflagindy.com/api`);
    }
  }
  
  return _apiUrl;
};

// Log the API URL for debugging
if (typeof window !== 'undefined') {
  console.log('[API Config] Using API URL:', _apiUrl);
  
  // Attach to window for debugging
  window.__apiConfig = {
    getApiUrl,
    updateApiUrl,
    forceBaseUrl,
    currentUrl: _apiUrl
  };
}
