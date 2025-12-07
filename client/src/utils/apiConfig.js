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
    
    // For subdomains of blueflagindy.com
    if (hostname.includes('.blueflagindy.com')) {
      console.log(`🌐 Using current subdomain for API: ${hostname}`);
      // Use the current subdomain for API calls
      return `${protocol}//${hostname}`;
    }
    
    // For render.com preview domain or main blueflagindy.com (which is on different server)
    if (hostname.includes('render.com') || hostname === 'blueflagindy.com') {
      console.log(`🌐 Using ${hostname} for API calls`);
      return `${protocol}//${hostname}`;
    }
    
    // For localhost development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('🌐 Using localhost API endpoint');
      // Try to handle potential API server connection failures
      try {
        // Check if we can access localhost:5000
        const testFetch = fetch('http://localhost:5000/api/health-check', { 
          method: 'HEAD',
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        }).catch(e => {
          console.warn('🔴 Cannot reach localhost API server, using static data fallback');
          return null;
        });
        
        // If we can connect, use localhost
        if (testFetch) {
          return 'http://localhost:5000/api';
        }
      } catch (err) {
        console.warn('🔴 Error testing API connection:', err);
      }
      
      // Fallback for static builds when no API is available
      console.warn('🔶 Using static fallback for APIs');
      return window.location.origin + '/api';
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

// Function to force use of appropriate base URL based on environment
export const forceBaseUrl = () => {
  // Try to detect current base domain
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // For subdomains, use the current subdomain for API calls
    if (hostname.includes('.blueflagindy.com')) {
      console.log(`[API Config] Using subdomain for API: ${hostname}`);
      updateApiUrl(`${protocol}//${hostname}`);
      return _apiUrl;
    }
    
    // For main domain, we can't use /api since it's on a different server
    if (hostname === 'blueflagindy.com') {
      console.log('[API Config] Using main domain without /api');
      updateApiUrl(`${protocol}//${hostname}`);
      return _apiUrl;
    }
  }
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
