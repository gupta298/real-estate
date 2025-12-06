import { useState, useEffect } from 'react';
import { getOffMarketDeals } from '@/utils/api';
import { isSubdomain } from '@/utils/subdomainRouting';

/**
 * Simple off-market listing page with proper styling but minimal React dependencies
 * to troubleshoot React rendering issues
 */
export default function OffMarketSimplePage() {
  // Use a single state object to minimize hooks
  const [state, setState] = useState({
    deals: [],
    loading: true,
    error: null,
    isInIframe: false,
    expandedDeals: {}, // Track which deals are expanded
    expandedImages: {} // Track which images are expanded
  });
  
  // Check if we're on a subdomain
  const isOnSubdomain = isSubdomain('offmarket');
  
  useEffect(() => {
    // Flag to track component mount state
    let isActive = true;
    
    // Check if in iframe
    if (typeof window !== 'undefined') {
      setState(prev => ({
        ...prev,
        isInIframe: window.self !== window.top
      }));
    }
    
    // Set page title
    if (typeof document !== 'undefined') {
      document.title = 'Off-Market Deals | Blue Flag Indy';
    }
    
    // Load deals on component mount
    async function loadDeals() {
      try {
        console.log('Loading off-market deals via explicit API path...');
        const data = await getOffMarketDeals();
        console.log('Off-market data received:', data);
        
        if (isActive) {
          if (data?.deals) {
            setState(prev => ({
              ...prev,
              deals: data.deals,
              loading: false
            }));
          } else {
            setState(prev => ({
              ...prev,
              error: 'No deals found',
              loading: false
            }));
          }
        }
      } catch (err) {
        console.error('Error loading off-market deals:', err);
        if (isActive) {
          setState(prev => ({
            ...prev,
            error: err.message || 'Failed to load off-market deals',
            loading: false
          }));
        }
      }
    }
    
    loadDeals();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isActive = false;
    };
  }, []);
  
  // Handle retry
  function handleRetry() {
    setState(prev => ({ ...prev, loading: true, error: null }));
    getOffMarketDeals()
      .then(data => {
        if (data?.deals) {
          setState(prev => ({
            ...prev,
            deals: data.deals,
            loading: false
          }));
        } else {
          setState(prev => ({
            ...prev,
            error: 'No deals found',
            loading: false
          }));
        }
      })
      .catch(err => {
        setState(prev => ({
          ...prev,
          error: err.message || 'Failed to load off-market deals',
          loading: false
        }));
      });
  }

  // Toggle deal expansion
  function toggleDealExpansion(dealId) {
    setState(prev => ({
      ...prev,
      expandedDeals: {
        ...prev.expandedDeals,
        [dealId]: !prev.expandedDeals[dealId]
      }
    }));
  }
  
  // Toggle image expansion
  function toggleImageExpansion(imageId) {
    setState(prev => ({
      ...prev,
      expandedImages: {
        ...prev.expandedImages,
        [imageId]: !prev.expandedImages[imageId]
      }
    }));
  }
  
  // Destructure state for easier access
  const { deals, loading, error, isInIframe, expandedDeals, expandedImages } = state;
  
  // Custom CSS for content
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
    <div className="bg-white py-8">
      {/* Add custom CSS */}
      <style dangerouslySetInnerHTML={{ __html: contentStyle }} />
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
            <p>Simple version with minimal React hooks</p>
          </div>
        )}
        
        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bf-blue"></div>
            <p className="mt-4 text-gray-600">Loading off-market deals...</p>
          </div>
        )}
        
        {/* Error state */}
        {!loading && error && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">Error: {error}</p>
            <button 
              onClick={handleRetry}
              className="mt-4 px-4 py-2 bg-bf-blue text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Deal list */}
        {!loading && !error && deals.length > 0 ? (
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
                            src={image.thumbnailUrl || image.imageUrl}
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
        ) : (!loading && !error) ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">No off-market deals available at the moment.</p>
            <div className="mt-6">
              <a href="/off-market/" className="mt-4 px-4 py-2 bg-bf-blue text-white rounded hover:bg-blue-700 transition-colors">
                Back to Main Off-Market Deals
              </a>
            </div>
          </div>
        ) : null}
        
        {/* Footer navigation */}
        {!loading && deals.length > 0 && (
          <div className="mt-10 text-center border-t pt-6">
            <a href="/off-market/" className="px-4 py-2 bg-bf-blue text-white rounded hover:bg-blue-700 transition-colors">
              Back to Main Off-Market Deals
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
