/**
 * API Configuration
 * Determines the correct API URL to use based on the current environment
 */

// Get API URL based on current domain or environment variables
const getApiUrl = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Extract current hostname and protocol
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // PRODUCTION LOGIC: Always use the main domain for API calls
    
    // For live blueflagindy.com domain or any of its subdomains
    if (hostname === 'blueflagindy.com' || hostname.includes('.blueflagindy.com')) {
      console.log('🌐 Using production API endpoint for blueflagindy.com');
      return `${protocol}//blueflagindy.com/api`;
    }
    
    // For render.com preview domain
    if (hostname.includes('render.com')) {
      console.log('🌐 Using Render preview domain for API');
      return `${protocol}//${hostname}/api`;
    }
    
    // For localhost development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('🌐 Using localhost API endpoint');
      return 'http://localhost:5000/api';
    }
    
    // Default case - use current domain
    console.log(`🌐 Using current domain for API: ${hostname}`);
    return `${protocol}//${hostname}/api`;
  }
  
  // For server-side rendering, first try the environment variable
  if (process.env && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Default fallback for SSR
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
