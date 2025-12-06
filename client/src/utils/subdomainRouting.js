/**
 * Simple utility to detect subdomain access
 */

/**
 * Check if the current hostname is a specific subdomain
 * @param {string} subdomain - The subdomain to check (e.g., 'offmarket', 'blog')
 * @returns {boolean} - True if current hostname matches the subdomain
 */
export const isSubdomain = (subdomain) => {
  // Handle server-side rendering
  if (typeof window === 'undefined') return false;
  
  try {
    const hostname = window.location.hostname;
    
    // Check for exact subdomain match
    if (hostname === `${subdomain}.blueflagindy.com`) return true;
    
    // Check for subdomain match with any domain
    if (hostname.startsWith(`${subdomain}.`)) return true;
    
    // Special case for localhost testing
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('subdomain') === subdomain) {
      console.log(`🔍 Detected ${subdomain} subdomain via query parameter for testing`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error detecting subdomain:', error);
    return false;
  }
};
