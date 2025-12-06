import { useState, useEffect } from 'react';
import { getOffMarketDeals } from '@/utils/api';
import { isSubdomain } from '@/utils/subdomainRouting';
import Link from 'next/link';
import { FiMapPin, FiHome, FiBriefcase, FiChevronDown, FiX } from 'react-icons/fi';

/**
 * Simple off-market listing page with proper styling but minimal React dependencies
 * to troubleshoot React rendering issues
 */
export default function OffMarketSimplePage() {
  // Use a single state object to minimize hooks
  const [state, setState] = useState({
    deals: [],
    allDeals: [], // Store all deals for filtering
    loading: true,
    error: null,
    isInIframe: false,
    expandedDeals: {}, // Track which deals are expanded
    expandedImages: {}, // Track which images are expanded
    filters: {
      propertyType: 'All Types',
      propertySubType: 'All Sub-Types',
      status: 'All Statuses'
    },
    availableFilters: {
      propertyTypes: ['All Types'],
      propertySubTypes: ['All Sub-Types'],
      statuses: ['All Statuses']
    }
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
            // Extract available filter options
            const propertyTypes = ['All Types'];
            const propertySubTypes = ['All Sub-Types'];
            const statuses = ['All Statuses'];
            
            data.deals.forEach(deal => {
              if (deal.propertyType && !propertyTypes.includes(deal.propertyType)) {
                propertyTypes.push(deal.propertyType);
              }
              
              if (deal.propertySubType && !propertySubTypes.includes(deal.propertySubType)) {
                propertySubTypes.push(deal.propertySubType);
              }
              
              if (deal.status && !statuses.includes(deal.status)) {
                statuses.push(deal.status);
              }
            });
            
            setState(prev => ({
              ...prev,
              deals: data.deals,
              allDeals: data.deals,
              loading: false,
              availableFilters: {
                propertyTypes,
                propertySubTypes,
                statuses
              }
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
          // Extract available filter options
          const propertyTypes = ['All Types'];
          const propertySubTypes = ['All Sub-Types'];
          const statuses = ['All Statuses'];
          
          data.deals.forEach(deal => {
            if (deal.propertyType && !propertyTypes.includes(deal.propertyType)) {
              propertyTypes.push(deal.propertyType);
            }
            
            if (deal.propertySubType && !propertySubTypes.includes(deal.propertySubType)) {
              propertySubTypes.push(deal.propertySubType);
            }
            
            if (deal.status && !statuses.includes(deal.status)) {
              statuses.push(deal.status);
            }
          });
          
          setState(prev => ({
            ...prev,
            deals: data.deals,
            allDeals: data.deals,
            loading: false,
            availableFilters: {
              propertyTypes,
              propertySubTypes,
              statuses
            }
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

  // Handle filter changes
  function handleFilterChange(filterType, value) {
    setState(prev => {
      const newFilters = {
        ...prev.filters,
        [filterType]: value
      };
      
      // Apply filters to allDeals
      const filteredDeals = filterDeals(prev.allDeals, newFilters);
      
      return {
        ...prev,
        filters: newFilters,
        deals: filteredDeals
      };
    });
  }
  
  // Filter deals based on selected filters
  function filterDeals(deals, filters) {
    return deals.filter(deal => {
      // Property Type filter
      if (filters.propertyType !== 'All Types' && deal.propertyType !== filters.propertyType) {
        return false;
      }
      
      // Property Sub-Type filter
      if (filters.propertySubType !== 'All Sub-Types' && deal.propertySubType !== filters.propertySubType) {
        return false;
      }
      
      // Status filter
      if (filters.status !== 'All Statuses' && deal.status !== filters.status) {
        return false;
      }
      
      return true;
    });
  }
  
  // Helper functions for formatting
  const formatPropertySubType = (subType) => {
    if (!subType) return '';
    return subType.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatStatus = (status) => {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  const getPropertyTypeIcon = (type) => {
    if (type === 'home') return <FiHome className="w-4 h-4" />;
    if (type === 'business') return <FiBriefcase className="w-4 h-4" />;
    return null;
  };
  
  // Destructure state for easier access
  const { 
    deals, 
    loading, 
    error, 
    isInIframe, 
    filters,
    availableFilters
  } = state;
  
  // Custom CSS
  const contentStyle = `
    .dropdown-menu {
      max-height: 250px;
      overflow-y: auto;
    }
    
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;  
      overflow: hidden;
    }
    
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;  
      overflow: hidden;
    }
  `;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add custom CSS */}
      <style dangerouslySetInnerHTML={{ __html: contentStyle }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-bf-blue mb-4">Off-Market Deals</h1>
          <p className="text-lg text-gray-600 mb-6">
            Exclusive business opportunities and properties not listed on MLS
          </p>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Property Type Filter */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
              <div className="relative">
                <select
                  id="propertyType"
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 appearance-none pr-8"
                  value={filters.propertyType}
                  onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                >
                  {availableFilters.propertyTypes.map(type => (
                    <option key={type} value={type}>{type === 'All Types' ? type : type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <FiChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            {/* Sub-Type Filter */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sub-Type</label>
              <div className="relative">
                <select
                  id="propertySubType"
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 appearance-none pr-8"
                  value={filters.propertySubType}
                  onChange={(e) => handleFilterChange('propertySubType', e.target.value)}
                >
                  {availableFilters.propertySubTypes.map(subType => (
                    <option key={subType} value={subType}>{subType === 'All Sub-Types' ? subType : formatPropertySubType(subType)}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <FiChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <div className="relative">
                <select
                  id="status"
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 appearance-none pr-8"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  {availableFilters.statuses.map(status => (
                    <option key={status} value={status}>{status === 'All Statuses' ? status : formatStatus(status)}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <FiChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(filters.propertyType !== 'All Types' || filters.propertySubType !== 'All Sub-Types' || filters.status !== 'All Statuses') && (
            <button
              onClick={() => {
                setState(prev => ({
                  ...prev,
                  filters: {
                    propertyType: 'All Types',
                    propertySubType: 'All Sub-Types',
                    status: 'All Statuses'
                  },
                  deals: prev.allDeals
                }));
              }}
              className="text-bf-blue hover:text-bf-gold text-sm font-semibold mb-4"
            >
              Clear All Filters
            </button>
          )}
        </div>
        
        {/* Debug info */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="bg-gray-100 p-4 mb-6 rounded-lg text-xs">
            <p><strong>Debug Info:</strong></p>
            <p>Subdomain: {isInIframe ? 'In iframe' : 'Not in iframe'}</p>
            <p>URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
            <p>Simple version with minimal React hooks</p>
            <p>Active filters: {JSON.stringify(filters)}</p>
          </div>
        )}
        
        {/* Content States */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bf-blue"></div>
            <p className="mt-4 text-gray-600">Loading off-market deals...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500 text-lg">Error: {error}</p>
            <button 
              onClick={handleRetry}
              className="mt-4 px-4 py-2 bg-bf-blue text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : deals.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deals.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/off-market/${deal.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 block"
                >
                  {/* Thumbnail or Media */}
                  <div className="relative h-64 w-full">
                    {deal.thumbnailUrl ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <img
                          src={deal.thumbnailUrl}
                          alt={deal.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : deal.images && deal.images[0] ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <img
                          src={deal.images[0].imageUrl || deal.images[0].thumbnailUrl}
                          alt={deal.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <FiBriefcase className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    {deal.isHotDeal && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        🔥 HOT
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Property Type Badge */}
                    {deal.propertyType && (
                      <div className="flex items-center gap-2 mb-3">
                        {getPropertyTypeIcon(deal.propertyType)}
                        <span className="text-sm font-semibold text-bf-blue">
                          {deal.propertyType === 'home' ? 'Home' : 'Business'}
                        </span>
                        {deal.propertySubType && (
                          <span className="text-sm text-gray-500">
                            • {formatPropertySubType(deal.propertySubType)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Title */}
                    <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {deal.title}
                    </h2>

                    {/* Area */}
                    {deal.area && (
                      <div className="flex items-center gap-2 text-gray-600 mb-4">
                        <FiMapPin className="w-4 h-4" />
                        <span className="text-sm">{deal.area}</span>
                      </div>
                    )}

                    {/* Preview Content */}
                    <p className="text-gray-700 text-sm line-clamp-3 mb-4">
                      {deal.content ? deal.content.replace(/\n/g, ' ').substring(0, 150) + '...' : 'No description available.'}
                    </p>

                    {/* View Details Link */}
                    <div className="text-bf-blue font-semibold text-sm hover:underline">
                      View Details →
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Show count of deals */}
            <div className="text-center py-8 text-gray-500 text-sm">
              Showing all {deals.length} deal{deals.length !== 1 ? 's' : ''}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <FiBriefcase className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              No off-market deals match your filters.
            </p>
            {filters.propertyType !== 'All Types' || filters.propertySubType !== 'All Sub-Types' || filters.status !== 'All Statuses' ? (
              <button
                onClick={() => {
                  setState(prev => ({
                    ...prev,
                    filters: {
                      propertyType: 'All Types',
                      propertySubType: 'All Sub-Types',
                      status: 'All Statuses'
                    },
                    deals: prev.allDeals
                  }));
                }}
                className="mt-4 px-4 py-2 bg-bf-blue text-white rounded hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <div className="mt-6">
                <a href="/off-market/" className="mt-4 px-4 py-2 bg-bf-blue text-white rounded hover:bg-blue-700 transition-colors">
                  Back to Main Page
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
