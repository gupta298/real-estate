/**
 * Utility functions to handle subdomain-based routing
 */

/**
 * Check if the current hostname is a specific subdomain
 * @param {string} subdomain - The subdomain to check (e.g., 'offmarket', 'blog')
 * @returns {boolean} - True if current hostname matches the subdomain
 */
export const isSubdomain = (subdomain) => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname === `${subdomain}.blueflagindy.com` || hostname.startsWith(`${subdomain}.`);
};

/**
 * Get the appropriate initial page path based on subdomain
 * @returns {string} - The path to redirect to based on subdomain
 */
export const getSubdomainPath = () => {
  if (typeof window === 'undefined') return null;
  
  if (isSubdomain('offmarket')) {
    return '/off-market';
  }
  
  if (isSubdomain('blog')) {
    return '/blogs';
  }
  
  return null;
};

/**
 * Check if we need to perform a client-side redirect based on subdomain
 * @param {string} currentPath - The current path
 * @returns {boolean} - True if a redirect is needed
 */
export const needsSubdomainRedirect = (currentPath) => {
  if (typeof window === 'undefined') return false;
  
  const targetPath = getSubdomainPath();
  if (!targetPath) return false;
  
  // Don't redirect if already on the right path
  return !currentPath.startsWith(targetPath);
};
