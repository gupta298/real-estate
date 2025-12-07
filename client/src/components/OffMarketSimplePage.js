import { useState, useEffect, useRef, useMemo } from 'react';
import { getOffMarketDeals } from '@/utils/api';
import { isSubdomain } from '@/utils/subdomainRouting';
import Image from 'next/image';
import Link from 'next/link';
import { FiMapPin, FiHome, FiBriefcase, FiChevronDown, FiX } from 'react-icons/fi';
import { API_URL } from '@/utils/apiConfig';

/**
 * Helper function to ensure image URLs are absolute with error handling
 */
const getImageUrl = (url) => {
  try {
    // Log URL for debugging
    console.log('[Image] Processing URL:', url);
    
    // Handle null/undefined URLs
    if (!url) {
      console.log('[Image] Empty URL, using placeholder');
      return '/placeholder-property.jpg';
    }
    
    // Handle empty strings
    if (url.trim() === '') {
      console.log('[Image] Empty string URL, using placeholder');
      return '/placeholder-property.jpg';
    }
    
    // If it's already an absolute URL (starts with http:// or https://)
    if (url.match(/^https?:\/\//)) {
      console.log('[Image] URL is already absolute:', url);
      return url;
    }
    
    // If it's a relative URL, append it to the correct base URL
    if (url.startsWith('/')) {
      // For subdomains, use special handling
      if (typeof window !== 'undefined' && window.location.hostname.includes('.blueflagindy.com')) {
        const subdomain = window.location.hostname.split('.')[0];
        console.log(`[Image] Detected ${subdomain} subdomain, using subdomain-specific URL`);
        // Use the subdomain URL directly
        const baseUrl = window.location.origin;
        const fullUrl = `${baseUrl}${url}`;
        console.log('[Image] Constructed URL:', fullUrl);
        return fullUrl;
      } else {
        // For static exports or other environments, use the current origin or API URL
        const baseUrl = typeof window !== 'undefined' ? 
          // For browser: use window.location.origin
          window.location.origin : 
          // For SSR: use API_URL with /api removed
          API_URL.replace(/\/api$/, '');
        
        const fullUrl = `${baseUrl}${url}`;
        console.log('[Image] Constructed standard URL:', fullUrl);
        return fullUrl;
      }
    }
    
    // Check if URL might be a partial path missing the leading slash
    if (!url.startsWith('/') && !url.match(/^https?:\/\//)) {
      console.log('[Image] Adding leading slash to URL');
      // Add leading slash and try again
      return getImageUrl(`/${url}`);
    }
    
    // Default fallback
    console.log('[Image] Using URL as-is:', url);
    return url;
  } catch (err) {
    console.error('[Image] Error processing URL:', err);
    return '/placeholder-property.jpg';
  }
};

/**
 * Helper function to ensure video URLs are absolute (same logic as images)
 */
const getVideoUrl = getImageUrl;

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
    displayCount: 12, // For infinite scrolling, similar to main page
    isPropertyTypeOpen: false,
    isSubTypeOpen: false,
    isStatusOpen: false,
    selectedPropertyTypes: [], // Multiple selection filters
    selectedPropertySubTypes: [],
    selectedStatuses: [],
    availableFilters: {
      propertyTypes: [],
      propertySubTypes: [],
      statuses: []
    }
  });
  
  // Check if we're on a subdomain
  const isOnSubdomain = isSubdomain('offmarket');
  
  // Create a ref for infinite scrolling observer
  const loadMoreRef = useRef(null);
  
  // Zoom functionality removed

  // Ref for storing interval ID safely within React's lifecycle - no longer used, but kept for compatibility
  const slideshowIntervalRef = useRef(null);
  
  // Initialize images only - no slideshow on simple page
  function setupFirstImages() {
    // Skip if not in browser
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    // Find all image containers
    const slideshows = document.querySelectorAll('.swiper-wrapper');
    if (!slideshows || slideshows.length === 0) return;
    
    // For each image container, show only the first image
    slideshows.forEach(slideshow => {
      if (!slideshow) return;
      const slides = slideshow.querySelectorAll('.swiper-slide');
      if (!slides || slides.length === 0) return;
      
      // Make sure only the first slide is visible
      slides.forEach((slide, index) => {
        if (index === 0) {
          slide.classList.add('swiper-slide-active');
        } else {
          slide.classList.remove('swiper-slide-active');
        }
      });
      
      // Hide pagination since we're not using slideshow
      const paginationContainer = slideshow.closest('.swiper-horizontal')?.querySelector('.swiper-pagination');
      if (paginationContainer) {
        paginationContainer.style.display = 'none';
      }
    });
  }
  
  // Handle video play/pause when user navigates away
  function handleVisibilityChange() {
    if (typeof document === 'undefined') return;
    if (document.hidden) {
      // Page is hidden, pause all videos
      const videos = document.querySelectorAll('video');
      if (videos) {
        videos.forEach(video => {
          if (video && typeof video.pause === 'function') video.pause();
        });
      }
    }
  }
  
  // Toggle filter dropdown
  function toggleDropdown(dropdown) {
    setState(prev => ({
      ...prev,
      isPropertyTypeOpen: dropdown === 'propertyType' ? !prev.isPropertyTypeOpen : false,
      isSubTypeOpen: dropdown === 'subType' ? !prev.isSubTypeOpen : false,
      isStatusOpen: dropdown === 'status' ? !prev.isStatusOpen : false
    }));
  }

  // Close all dropdowns
  function closeAllDropdowns() {
    setState(prev => ({
      ...prev,
      isPropertyTypeOpen: false,
      isSubTypeOpen: false,
      isStatusOpen: false
    }));
  }
  
  // Toggle property type filter
  function togglePropertyType(type) {
    setState(prev => {
      const newSelectedTypes = prev.selectedPropertyTypes.includes(type) 
        ? prev.selectedPropertyTypes.filter(t => t !== type)
        : [...prev.selectedPropertyTypes, type];
      
      return {
        ...prev,
        selectedPropertyTypes: newSelectedTypes,
        displayCount: 12 // Reset pagination when changing filters
      };
    });
  }
  
  // Toggle sub-type filter
  function toggleSubType(subType) {
    setState(prev => {
      const newSelectedSubTypes = prev.selectedPropertySubTypes.includes(subType) 
        ? prev.selectedPropertySubTypes.filter(t => t !== subType)
        : [...prev.selectedPropertySubTypes, subType];
      
      return {
        ...prev,
        selectedPropertySubTypes: newSelectedSubTypes,
        displayCount: 12 // Reset pagination when changing filters
      };
    });
  }
  
  // Toggle status filter
  function toggleStatus(status) {
    setState(prev => {
      const newSelectedStatuses = prev.selectedStatuses.includes(status) 
        ? prev.selectedStatuses.filter(s => s !== status)
        : [...prev.selectedStatuses, status];
      
      return {
        ...prev,
        selectedStatuses: newSelectedStatuses,
        displayCount: 12 // Reset pagination when changing filters
      };
    });
  }
  
  // Remove individual filter
  function removePropertyType(type) {
    setState(prev => ({
      ...prev,
      selectedPropertyTypes: prev.selectedPropertyTypes.filter(t => t !== type),
      displayCount: 12 // Reset pagination when changing filters
    }));
  }
  
  function removeSubType(subType) {
    setState(prev => ({
      ...prev,
      selectedPropertySubTypes: prev.selectedPropertySubTypes.filter(t => t !== subType),
      displayCount: 12 // Reset pagination when changing filters
    }));
  }
  
  function removeStatus(status) {
    setState(prev => ({
      ...prev,
      selectedStatuses: prev.selectedStatuses.filter(s => s !== status),
      displayCount: 12 // Reset pagination when changing filters
    }));
  }
  
  // Clear all filters
  function clearAllFilters() {
    setState(prev => ({
      ...prev,
      selectedPropertyTypes: [],
      selectedPropertySubTypes: [],
      selectedStatuses: [],
      displayCount: 12 // Reset pagination when changing filters
    }));
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
  
  // Main effect for data loading
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
        
        if (isActive && data?.deals) {
          setState(prev => ({
            ...prev,
            deals: data.deals,
            allDeals: data.deals,
            loading: false
          }));
        } else if (isActive) {
          setState(prev => ({
            ...prev,
            error: 'No deals found',
            loading: false
          }));
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
    
    // Only load deals on server or first client render
    loadDeals();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isActive = false;
    };
  }, []);
  
  // Setup first images and DOM event handlers in a separate useEffect that only runs on client
  useEffect(() => {
    // Skip if not in browser
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    // Show first image for each property once data is loaded
    if (!state.loading && Array.isArray(state.allDeals) && state.allDeals.length > 0) {
      // Use setTimeout to ensure the DOM has been updated with all images
      setTimeout(() => {
        setupFirstImages();
      }, 100);
    }
    
    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.loading, state.allDeals]);
  
  // Infinite scroll observer effect - client-side only
  useEffect(() => {
    // Skip if not in browser
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    // Don't set up observer if all deals are already displayed or nothing to display
    // We're avoiding reference to filteredDeals here to prevent variable initialization issues
    if (!Array.isArray(state.allDeals) || state.allDeals.length === 0) return;
    
    // Create observer only if IntersectionObserver is available (client-side)
    if (!('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry?.isIntersecting) {
          // Load 12 more deals
          setState(prev => ({
            ...prev,
            displayCount: prev.displayCount + 12
          }));
        }
      },
      {
        threshold: 0.1,
        rootMargin: '200px' // Start loading before reaching the bottom
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef && observer) {
        observer.unobserve(currentRef);
      }
    };
  }, [state.displayCount, state.allDeals]);
  
  // Get unique property types from all deals using useMemo
  const availablePropertyTypes = useMemo(() => {
    if (!Array.isArray(state.allDeals)) return [];
    const types = new Set();
    state.allDeals.forEach(deal => {
      // Handle case sensitivity in API responses (propertytype vs propertyType)
      const propertyType = deal?.propertytype || deal?.propertyType;
      if (propertyType) types.add(propertyType);
    });
    return Array.from(types).sort();
  }, [state.allDeals]);

  // Get unique sub-types - filtered by selected property types if any
  const availableSubTypes = useMemo(() => {
    if (!Array.isArray(state.allDeals)) return [];
    const subTypes = new Set();
    state.allDeals.forEach(deal => {
      // Handle case sensitivity in API responses (propertysubtype vs propertySubType)
      const propertySubType = deal?.propertysubtype || deal?.propertySubType;
      const propertyType = deal?.propertytype || deal?.propertyType;
      
      if (propertySubType) {
        // If property types are selected, only show sub-types for those types
        if (state.selectedPropertyTypes.length === 0 || 
            state.selectedPropertyTypes.includes(propertyType)) {
          subTypes.add(propertySubType);
        }
      }
    });
    return Array.from(subTypes).sort();
  }, [state.allDeals, state.selectedPropertyTypes]);

  // Get unique statuses from all deals
  const availableStatuses = useMemo(() => {
    if (!Array.isArray(state.allDeals)) return [];
    const statuses = new Set();
    state.allDeals.forEach(deal => {
      // Handle case sensitivity in API responses (status vs Status)
      const status = deal?.status || deal?.Status;
      if (status) statuses.add(status);
    });
    return Array.from(statuses).sort();
  }, [state.allDeals]);

  // Moving filtering calculation into the render phase instead of using useMemo
  // This ensures we don't have any issues with variable initialization order
  
  // Handle retry
  function handleRetry() {
    setState(prev => ({ ...prev, loading: true, error: null }));
    getOffMarketDeals()
      .then(data => {
        if (data?.deals) {
          setState(prev => ({
            ...prev,
            deals: data.deals,
            allDeals: data.deals,
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
  
  // Destructure state for convenience and readability
  const {
    deals,
    allDeals,
    loading,
    error,
    expandedDeals,
    displayCount,
    isPropertyTypeOpen,
    isSubTypeOpen,
    isStatusOpen,
    selectedPropertyTypes,
    selectedPropertySubTypes,
    selectedStatuses,
    availableFilters
  } = state;
  
  // Custom CSS for deal content - simplified to only show first image
  const customStyles = `
    .swiper-pagination {
      display: none; /* Hide pagination since we're not using slideshow */
    }
    
    .swiper-slide {
      display: none; /* Hide all slides by default */
      width: 100%;
      height: 100%;
      position: relative;
    }
    
    .swiper-slide-active {
      display: block; /* Only show the active slide */
    }
  `;
  
  // Calculate filtered deals directly in the render function
  // This avoids any issues with variable initialization and timing
  const filteredDeals = (() => {
    if (!Array.isArray(allDeals)) return [];
    return allDeals.filter(deal => {
      if (!deal) return false;
      
      // Property type filter
      const propertyType = deal?.propertytype || deal?.propertyType;
      if (selectedPropertyTypes.length > 0 && 
          !selectedPropertyTypes.includes(propertyType)) {
        return false;
      }
      
      // Sub-type filter
      const propertySubType = deal?.propertysubtype || deal?.propertySubType;
      if (selectedPropertySubTypes.length > 0 && 
          !selectedPropertySubTypes.includes(propertySubType)) {
        return false;
      }
      
      // Status filter
      const status = deal?.status || deal?.Status;
      if (selectedStatuses.length > 0 && 
          !selectedStatuses.includes(status)) {
        return false;
      }
      
      return true;
    });
  })();

  // Get deals to display (paginated)
  const displayedDeals = filteredDeals.slice(0, displayCount);
  
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      {/* Add custom CSS */}
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 flex justify-between items-start flex-wrap">
          <div>
            <h1 className="text-4xl font-bold text-bf-blue mb-4">Off-Market Deals</h1>
            <p className="text-lg text-gray-600">
              Exclusive investment opportunities not available on the MLS
            </p>
          </div>
        </div>
        
        {/* Debug info */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="bg-gray-100 p-4 mb-6 rounded-lg text-xs">
            <p><strong>Debug Info:</strong></p>
            <p>Subdomain: {isInIframe ? 'In iframe' : 'Not in iframe'}</p>
            <p>URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
            <p>Simple version with minimal React hooks</p>
            <p>Filters: 
              {selectedPropertyTypes.length > 0 ? `Property Types (${selectedPropertyTypes.join(', ')})` : 'No property type filters'} | 
              {selectedPropertySubTypes.length > 0 ? `Sub-Types (${selectedPropertySubTypes.join(', ')})` : 'No sub-type filters'} | 
              {selectedStatuses.length > 0 ? `Statuses (${selectedStatuses.join(', ')})` : 'No status filters'}
            </p>
            <p>Deals: {allDeals.length} total, {filteredDeals?.length || 0} filtered, {displayedDeals?.length || 0} displayed</p>
          </div>
        )}
        
        {/* Filter section */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-wrap gap-4 mb-4">
            {/* Property Type Filter */}
            <div className="relative min-w-[200px]">
              <button
                onClick={() => toggleDropdown('propertyType')}
                className="w-full flex items-center justify-between bg-white border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-bf-blue"
              >
                <span>Property Type</span>
                <FiChevronDown className={`transition-transform ${isPropertyTypeOpen ? 'transform rotate-180' : ''}`} />
              </button>
              {isPropertyTypeOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-30 max-h-60 overflow-y-auto">
                  <div className="p-2 space-y-1">
                    {availablePropertyTypes.map(type => (
                      <div key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`type-${type}`}
                          checked={selectedPropertyTypes.includes(type)}
                          onChange={() => togglePropertyType(type)}
                          className="mr-2"
                        />
                        <label htmlFor={`type-${type}`} className="flex items-center cursor-pointer capitalize">
                          {getPropertyTypeIcon(type)}
                          <span className="ml-2">{type}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Sub-Type Filter */}
            <div className="relative min-w-[200px]">
              <button
                onClick={() => toggleDropdown('subType')}
                className="w-full flex items-center justify-between bg-white border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-bf-blue"
              >
                <span>Sub-Type</span>
                <FiChevronDown className={`transition-transform ${isSubTypeOpen ? 'transform rotate-180' : ''}`} />
              </button>
              {isSubTypeOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-30 max-h-60 overflow-y-auto">
                  <div className="p-2 space-y-1">
                    {availableSubTypes.length > 0 ? (
                      availableSubTypes.map(subType => (
                        <div key={subType} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`subtype-${subType}`}
                            checked={selectedPropertySubTypes.includes(subType)}
                            onChange={() => toggleSubType(subType)}
                            className="mr-2"
                          />
                          <label htmlFor={`subtype-${subType}`} className="cursor-pointer capitalize">
                            {formatPropertySubType(subType)}
                          </label>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-gray-500 italic">Select a property type first</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Status Filter */}
            <div className="relative min-w-[200px]">
              <button
                onClick={() => toggleDropdown('status')}
                className="w-full flex items-center justify-between bg-white border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-bf-blue"
              >
                <span>Status</span>
                <FiChevronDown className={`transition-transform ${isStatusOpen ? 'transform rotate-180' : ''}`} />
              </button>
              {isStatusOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-30 max-h-60 overflow-y-auto">
                  <div className="p-2 space-y-1">
                    {availableStatuses.map(status => (
                      <div key={status} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`status-${status}`}
                          checked={selectedStatuses.includes(status)}
                          onChange={() => toggleStatus(status)}
                          className="mr-2"
                        />
                        <label htmlFor={`status-${status}`} className="cursor-pointer capitalize">
                          {formatStatus(status)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Clear Filters */}
            {(selectedPropertyTypes.length > 0 || selectedPropertySubTypes.length > 0 || selectedStatuses.length > 0) && (
              <button
                onClick={clearAllFilters}
                className="bg-gray-200 text-gray-700 rounded px-4 py-2 hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-bf-blue flex items-center"
              >
                <FiX className="mr-1" />
                Clear All
              </button>
            )}
          </div>
          
          {/* Selected Filters */}
          {(selectedPropertyTypes.length > 0 || selectedPropertySubTypes.length > 0 || selectedStatuses.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedPropertyTypes.map(type => (
                <div key={`selected-${type}`} className="bg-bf-blue text-white rounded-full px-3 py-1 flex items-center">
                  <span className="capitalize">{type}</span>
                  <button 
                    onClick={() => removePropertyType(type)} 
                    className="ml-2 text-white hover:text-red-200"
                    aria-label={`Remove ${type} filter`}
                  >
                    <FiX />
                  </button>
                </div>
              ))}
              
              {selectedPropertySubTypes.map(subType => (
                <div key={`selected-${subType}`} className="bg-bf-blue text-white rounded-full px-3 py-1 flex items-center">
                  <span>{formatPropertySubType(subType)}</span>
                  <button 
                    onClick={() => removeSubType(subType)} 
                    className="ml-2 text-white hover:text-red-200"
                    aria-label={`Remove ${subType} filter`}
                  >
                    <FiX />
                  </button>
                </div>
              ))}
              
              {selectedStatuses.map(status => (
                <div key={`selected-${status}`} className="bg-bf-blue text-white rounded-full px-3 py-1 flex items-center">
                  <span className="capitalize">{formatStatus(status)}</span>
                  <button 
                    onClick={() => removeStatus(status)} 
                    className="ml-2 text-white hover:text-red-200"
                    aria-label={`Remove ${status} filter`}
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Loading state */}
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
        ) : (filteredDeals?.length || 0) > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedDeals.map(deal => {
                // Use thumbnail if available, otherwise fall back to first media item
                const hasThumbnail = deal.thumbnailUrl && deal.thumbnailType;
                
                // Collect all media (images + videos) for carousel, sorted by displayOrder
                const allMedia = [];
                
                // Account for case sensitivity in API response fields
                const thumbUrl = deal.thumbnailurl || deal.thumbnailUrl;
                const thumbType = deal.thumbnailtype || deal.thumbnailType;
                
                if (thumbUrl) {
                  if (thumbType === 'video') {
                    allMedia.push({
                      videourl: thumbUrl, // lowercase to match API response
                      videoUrl: thumbUrl, // Include uppercase too for compatibility
                      thumbnailurl: thumbUrl, // lowercase for API response
                      thumbnailUrl: thumbUrl, // Include uppercase too
                      caption: 'Thumbnail',
                      type: 'video',
                      displayorder: -1, // lowercase for API
                      displayOrder: -1 // uppercase for compatibility
                    });
                  } else {
                    allMedia.push({
                      imageurl: thumbUrl, // lowercase for API response
                      imageUrl: thumbUrl, // Include uppercase too
                      thumbnailurl: thumbUrl, // lowercase for API
                      thumbnailUrl: thumbUrl, // uppercase for compatibility
                      caption: 'Thumbnail',
                      type: 'image',
                      displayorder: -1, // lowercase for API
                      displayOrder: -1 // uppercase for compatibility
                    });
                  }
                }
                
                // Add images, filtering out duplicates
                if (deal.images && deal.images.length > 0) {
                  const uniqueImages = deal.images.filter(img => {
                    // Account for case sensitivity in API response
                    const imgUrl = img.imageurl || img.imageUrl || img.thumbnailurl || img.thumbnailUrl;
                    return !thumbUrl || imgUrl !== thumbUrl;
                  });
                  allMedia.push(...uniqueImages.map(img => ({
                    ...img,
                    type: 'image',
                    // Ensure both lowercase and uppercase variants exist for compatibility
                    imageurl: img.imageurl,
                    imageUrl: img.imageurl || img.imageUrl,
                    thumbnailurl: img.thumbnailurl,
                    thumbnailUrl: img.thumbnailurl || img.thumbnailUrl,
                    // Handle both versions of displayOrder
                    displayorder: img.displayorder || img.displayOrder || 0,
                    displayOrder: img.displayorder || img.displayOrder || 0
                  })));
                }
                
                // Add videos, filtering out duplicates
                if (deal.videos && deal.videos.length > 0) {
                  const uniqueVideos = deal.videos.filter(vid => {
                    // Account for case sensitivity in API response
                    const vidUrl = vid.videourl || vid.videoUrl;
                    return !thumbUrl || vidUrl !== thumbUrl;
                  });
                  allMedia.push(...uniqueVideos.map(vid => ({
                    ...vid,
                    type: 'video',
                    // Ensure both lowercase and uppercase variants exist for compatibility
                    videourl: vid.videourl,
                    videoUrl: vid.videourl || vid.videoUrl,
                    thumbnailurl: vid.thumbnailurl,
                    thumbnailUrl: vid.thumbnailurl || vid.thumbnailUrl,
                    // Handle both versions of displayOrder
                    displayorder: vid.displayorder || vid.displayOrder || 999,
                    displayOrder: vid.displayorder || vid.displayOrder || 999
                  })));
                }
                
                // Sort by displayOrder
                allMedia.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
                
                return (
                  <Link
                    key={deal.id}
                    href={`/off-market/${deal.id}`}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 block"
                  >
                    {/* Thumbnail or Media (Image or Video) */}
                    <div className="relative h-64 w-full">
                      {allMedia.length > 0 ? (
                        <div className="swiper swiper-initialized swiper-horizontal h-full w-full">
                          <div className="swiper-wrapper">
                            {/* Only show the first item from media array */}
                            {allMedia.slice(0, 1).map((item, index) => (
                              <div key={`${deal.id}-media-${index}`} className="swiper-slide swiper-slide-active">
                                <div className="w-full h-full">
                                  {item.type === 'video' ? (
                                    <div className="w-full h-full flex items-center justify-center bg-black">
                                      <video
                                        src={getVideoUrl(item.videourl || item.videoUrl)}
                                        className="w-full h-full object-contain"
                                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                                        muted
                                        loop
                                        playsInline
                                        autoPlay
                                        preload="auto"
                                      >
                                        Your browser does not support the video tag.
                                      </video>
                                    </div>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 relative">
                                      <Image
                                        src={getImageUrl(item.imageurl || item.imageUrl || item.thumbnailurl || item.thumbnailUrl)}
                                        alt={item.caption || deal.title || `Image ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        unoptimized={true}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
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
                      {(deal.propertytype || deal.propertyType) && (
                        <div className="flex items-center gap-2 mb-3">
                          {getPropertyTypeIcon(deal.propertytype || deal.propertyType)}
                          <span className="text-sm font-semibold text-bf-blue">
                            {(deal.propertytype || deal.propertyType) === 'home' ? 'Home' : 'Business'}
                          </span>
                          {(deal.propertysubtype || deal.propertySubType) && (
                            <span className="text-sm text-gray-500">
                              • {formatPropertySubType(deal.propertysubtype || deal.propertySubType)}
                            </span>
                          )}
                        </div>
                      )}

                    {/* Title */}
                    <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {deal.title}
                    </h2>

                    {/* Location */}
                    {(deal.area || deal.Area) && (
                      <p className="flex items-center text-gray-600 mb-3">
                        <FiMapPin className="mr-1" />
                        <span>{deal.area || deal.Area}</span>
                      </p>
                    )}

                      {/* View Details Link */}
                      <div className="text-bf-blue font-semibold text-sm hover:underline">
                        View Details →
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Infinite scroll trigger */}
            {displayCount < (filteredDeals?.length || 0) && (
              <div ref={loadMoreRef} className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bf-blue"></div>
                <p className="text-gray-500 text-sm mt-2">Loading more deals...</p>
              </div>
            )}

            {/* Show count if all deals are loaded */}
            {displayCount >= (filteredDeals?.length || 0) && (filteredDeals?.length || 0) > 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                Showing all {filteredDeals?.length || 0} deal{(filteredDeals?.length || 0) !== 1 ? 's' : ''}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500 text-lg">No deals match your filter criteria.</p>
            {(selectedPropertyTypes.length > 0 || selectedPropertySubTypes.length > 0 || selectedStatuses.length > 0) && (
              <button
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 bg-bf-blue text-white rounded hover:bg-blue-700 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal removed */}

      {/* Backdrop for dropdowns */}
      {(isPropertyTypeOpen || isSubTypeOpen || isStatusOpen) && (
        <div
          className="fixed inset-0 z-0"
          onClick={closeAllDropdowns}
        />
      )}
    </div>
  );
}
