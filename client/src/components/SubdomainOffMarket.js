import { useState, useEffect } from 'react';
import { getOffMarketDeals } from '@/utils/api';
import SubdomainMeta from './SubdomainMeta';
import { useRouter } from 'next/router';
import { forceBaseUrl } from '@/utils/apiConfig';

/**
 * Helper function to ensure image URLs are absolute with error handling
 */
const getImageUrl = (url) => {
  try {
    // Handle null/undefined URLs
    if (!url) return '/placeholder-property.jpg';
    
    // Handle empty strings
    if (url.trim() === '') return '/placeholder-property.jpg';
    
    // If it's already an absolute URL (starts with http:// or https://)
    if (url.match(/^https?:\/\//)) {
      return url;
    }
    
    // If it's a relative URL, append it to the correct base URL
    if (url.startsWith('/')) {
      // For subdomains, use special handling
      if (typeof window !== 'undefined' && window.location.hostname.includes('.blueflagindy.com')) {
        // Use the subdomain URL directly
        const baseUrl = window.location.origin;
        return `${baseUrl}${url}`;
      } else {
        // For static exports or other environments, use the current origin
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        return `${baseUrl}${url}`;
      }
    }
    
    // Check if URL might be a partial path missing the leading slash
    if (!url.startsWith('/') && !url.match(/^https?:\/\//)) {
      // Add leading slash and try again
      return getImageUrl(`/${url}`);
    }
    
    // Default fallback
    return url;
  } catch (err) {
    console.error('[Image] Error processing URL:', err);
    return '/placeholder-property.jpg';
  }
};

/**
 * Simplified Off-Market component specifically for subdomain display
 * This removes many UI elements for a cleaner, more focused view
 */
export default function SubdomainOffMarket() {
  const router = useRouter();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInIframe, setIsInIframe] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [loadError, setLoadError] = useState(null);
  const [expandedDeals, setExpandedDeals] = useState({});
  const [expandedImages, setExpandedImages] = useState({});

  useEffect(() => {
    // Initial load
    loadDeals();
    
    // Detect if we're in an iframe
    setIsInIframe(window.self !== window.top);
    
    // Add automatic fallback if first load fails
    const fallbackTimer = setTimeout(() => {
      if (deals.length === 0 && loadAttempts === 1) {
        console.log('SubdomainOffMarket: No deals loaded on first attempt, trying fallback...');
        loadDeals(true); // Try with fallback URL
      }
    }, 3000); // Wait 3 seconds before trying fallback
    
    return () => clearTimeout(fallbackTimer);
  }, []);

  const loadDeals = async (tryFallback = false) => {
    try {
      console.log(`SubdomainOffMarket: Loading deals (attempt ${loadAttempts + 1})...`);
      setLoading(true);
      setLoadError(null);
      
      // Log attempt information
      if (tryFallback && loadAttempts > 0) {
        console.log('SubdomainOffMarket: Retry attempt with current configuration');
        // We're no longer forcing API URL changes here
      }
      
      const data = await getOffMarketDeals({});
      console.log('SubdomainOffMarket: API response:', data);
      
      if (data && data.deals && Array.isArray(data.deals)) {
        console.log(`SubdomainOffMarket: Successfully loaded ${data.deals.length} deals`);
        setDeals(data.deals);
      } else {
        console.error('SubdomainOffMarket: Invalid response format, deals array not found', data);
        setLoadError('Received invalid data format from server');
        setDeals([]);
      }
    } catch (error) {
      console.error('SubdomainOffMarket: Error loading off-market deals:', error);
      setLoadError(error.message || 'Failed to load deals');
      setDeals([]);
    } finally {
      setLoading(false);
      setLoadAttempts(prev => prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bf-blue"></div>
        <p className="mt-4 text-gray-600">Loading off-market deals...</p>
      </div>
    );
  }

  // Toggle deal expansion
  const toggleDealExpansion = (dealId) => {
    setExpandedDeals(prev => ({
      ...prev,
      [dealId]: !prev[dealId]
    }));
  };
  
  // Toggle image expansion
  const toggleImageExpansion = (imageId) => {
    setExpandedImages(prev => ({
      ...prev,
      [imageId]: !prev[imageId]
    }));
  };
  
  // Custom CSS for deal content
  const contentStyle = `
    .deal-content p {
      margin-bottom: 1rem;
    }
    .deal-content h2 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 1.5rem 0 1rem;
    }
    .deal-content h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 1.25rem 0 0.75rem;
    }
    .deal-content ul, .deal-content ol {
      margin-left: 1.5rem;
      margin-bottom: 1rem;
    }
    .deal-content li {
      margin-bottom: 0.5rem;
    }
    .deal-content img {
      max-width: 100%;
      height: auto;
      margin: 1rem 0;
    }
    .property-tag {
      display: inline-block;
      background-color: #f3f4f6;
      padding: 0.2rem 0.5rem;
      border-radius: 0.25rem;
      margin-right: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }
    .hot-deal-tag {
      background-color: #fee2e2;
      color: #dc2626;
      font-weight: 600;
    }
  `;
  
  return (
    <div className="bg-white py-8 subdomain-view">
      {/* Add custom CSS */}
      <style dangerouslySetInnerHTML={{ __html: contentStyle }} />
      <SubdomainMeta 
        title="Off-Market Deals | Blue Flag Indy" 
        description="Exclusive business opportunities and properties not listed on MLS" 
      />
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-bf-blue mb-6">Off-Market Deals</h1>
        <p className="text-lg text-gray-600 mb-8">
          Exclusive business opportunities and properties not listed on MLS
        </p>
        {/* Debug info */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="bg-gray-100 p-4 mb-6 rounded-lg text-xs">
            <p><strong>Debug Info:</strong></p>
            <p>Subdomain: {isInIframe ? 'In iframe' : 'Not in iframe'}</p>
            <p>URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
          </div>
        )}

        {deals && deals.length > 0 ? (
          <div className="space-y-8">
            {deals.map((deal) => (
              <div key={deal.id} className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow">
                {/* Deal header */}
                <div className="p-4 bg-gray-50 flex flex-col md:flex-row md:justify-between md:items-center cursor-pointer gap-2"
                  onClick={() => toggleDealExpansion(deal.id)}
                >
                  <h2 className="text-xl font-semibold">{deal.title}</h2>
                  <div className="flex items-center gap-2">
                    {deal.isHotDeal && (
                      <span className="property-tag hot-deal-tag">HOT DEAL</span>
                    )}
                    <span className="text-bf-blue">{expandedDeals[deal.id] ? '▲' : '▼'}</span>
                  </div>
                </div>
                
                {/* Deal content - expandable */}
                <div className={`p-4 transition-all duration-300 ${expandedDeals[deal.id] ? '' : 'max-h-48 overflow-hidden relative'}`}>
                  {!expandedDeals[deal.id] && (
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
                  )}
                  
                  {/* Deal images */}
                  {(deal.images && deal.images.length > 0) && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {deal.images.map((image, index) => (
                        <div 
                          key={`${deal.id}-img-${index}`} 
                          className="relative cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent deal toggle
                            toggleImageExpansion(`${deal.id}-img-${index}`);
                          }}
                        >
                          <img
                            src={getImageUrl(image.thumbnailurl || image.thumbnailUrl || image.imageurl || image.imageUrl)}
                            alt={image.caption || `Image ${index + 1}`}
                            className={`rounded border ${expandedImages[`${deal.id}-img-${index}`] ? 'w-full max-w-2xl mx-auto block' : 'w-24 h-24 object-cover'}`}
                          />
                          {image.caption && expandedImages[`${deal.id}-img-${index}`] && (
                            <p className="text-sm text-center text-gray-500 mt-1">{image.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Deal details */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-y-2 mb-4">
                      {deal.propertyType && (
                        <div className="w-full md:w-1/2 lg:w-1/3">
                          <span className="font-medium">Property Type:</span> {deal.propertyType}
                        </div>
                      )}
                      {deal.propertySubType && (
                        <div className="w-full md:w-1/2 lg:w-1/3">
                          <span className="font-medium">Sub Type:</span> {deal.propertySubType}
                        </div>
                      )}
                      {deal.area && (
                        <div className="w-full md:w-1/2 lg:w-1/3">
                          <span className="font-medium">Location:</span> {deal.area}
                        </div>
                      )}
                      {deal.status && (
                        <div className="w-full md:w-1/2 lg:w-1/3">
                          <span className="font-medium">Status:</span> {deal.status}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Deal description */}
                  <div className="deal-content text-gray-600">
                    <div dangerouslySetInnerHTML={{ __html: deal.content }} />
                  </div>
                  
                  {/* Contact information */}
                  {(deal.contactName || deal.contactEmail || deal.contactPhone) && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">Contact Information</h3>
                      {deal.contactName && (
                        <p className="mb-1">
                          <span className="font-medium">Name:</span> {deal.contactName}
                          {deal.contactTitle && ` (${deal.contactTitle})`}
                        </p>
                      )}
                      {deal.contactPhone && (
                        <p className="mb-1">
                          <span className="font-medium">Phone:</span>{' '}
                          <a href={`tel:${deal.contactPhone}`} className="text-bf-blue hover:underline">
                            {deal.contactPhone}
                          </a>
                        </p>
                      )}
                      {deal.contactEmail && (
                        <p className="mb-1">
                          <span className="font-medium">Email:</span>{' '}
                          <a href={`mailto:${deal.contactEmail}`} className="text-bf-blue hover:underline">
                            {deal.contactEmail}
                          </a>
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Toggle button */}
                  <div className="mt-4 text-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDealExpansion(deal.id);
                      }}
                      className="px-4 py-2 text-bf-blue hover:text-blue-700 font-medium border border-bf-blue rounded hover:bg-blue-50"
                    >
                      {expandedDeals[deal.id] ? 'Show Less' : 'Show More'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">
              {loading ? 'Loading...' : loadError ? `Error: ${loadError}` : 'No off-market deals available at the moment.'}
            </p>
            <button 
              onClick={() => loadDeals(loadAttempts > 0)}
              className="mt-4 px-4 py-2 bg-bf-blue text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <div className="mt-4">
              <a href="/off-market/index.simple" className="text-blue-500 underline">
                View Simple Version
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
