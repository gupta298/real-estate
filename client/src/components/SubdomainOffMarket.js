import { useState, useEffect } from 'react';
import { getOffMarketDeals } from '@/utils/api';
import SubdomainMeta from './SubdomainMeta';
import { useRouter } from 'next/router';
import { forceBaseUrl } from '@/utils/apiConfig';

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

  return (
    <div className="bg-white py-8 subdomain-view">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal) => (
              <div key={deal.id} className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                {/* Deal image or placeholder */}
                <div className="h-48 bg-gray-100 relative">
                  {deal.thumbnailUrl ? (
                    <img 
                      src={deal.thumbnailUrl}
                      alt={deal.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                      </svg>
                    </div>
                  )}
                  {deal.isHotDeal && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">HOT DEAL</div>
                  )}
                </div>
                
                {/* Deal details */}
                <div className="p-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{deal.title}</h2>
                  {deal.area && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Location:</span> {deal.area}
                    </p>
                  )}
                  {deal.propertyType && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Type:</span> {deal.propertyType} 
                      {deal.propertySubType && ` • ${deal.propertySubType}`}
                    </p>
                  )}
                  <div className="mt-4">
                    <button 
                      onClick={() => {
                        if (isInIframe) {
                          // When in an iframe, use client-side routing
                          router.push(`/off-market/${deal.id}`);
                        } else {
                          // Regular navigation when not in iframe
                          window.location.href = `/off-market/${deal.id}`;
                        }
                      }}
                      className="inline-block bg-bf-blue hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded cursor-pointer"
                    >
                      View Details
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
              {loadAttempts > 0 ? 'Try Again with Fallback' : 'Retry'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
