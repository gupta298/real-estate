import { useEffect, useState, useRef, useMemo } from 'react';
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
    lightboxMedia: null, // For media modal view
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
  
  // Open lightbox for media
  function openLightbox(media, dealTitle, e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setState(prev => ({
      ...prev,
      lightboxMedia: { media, dealTitle }
    }));
    // Prevent scrolling when lightbox is open
    if (typeof window !== 'undefined' && typeof document !== 'undefined' && document.body) {
      document.body.style.overflow = 'hidden';
    }
  }

  // Close lightbox
  function closeLightbox() {
    // Pause all videos when closing
    if (typeof document !== 'undefined') {
      const videos = document.querySelectorAll('video');
      if (videos) {
        videos.forEach(video => {
          if (video && typeof video.pause === 'function') video.pause();
        });
      }
    }
    
    setState(prev => ({
      ...prev,
      lightboxMedia: null
    }));
    
    // Restore scrolling
    if (typeof window !== 'undefined' && typeof document !== 'undefined' && document.body) {
      document.body.style.overflow = 'unset';
    }
  }

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
      if (document.body) document.body.style.overflow = 'unset'; // Ensure scrolling is restored on unmount
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
      if (deal && deal.propertyType) types.add(deal.propertyType);
    });
    return Array.from(types).sort();
  }, [state.allDeals]);

  // Get unique sub-types - filtered by selected property types if any
  const availableSubTypes = useMemo(() => {
    if (!Array.isArray(state.allDeals)) return [];
    const subTypes = new Set();
    state.allDeals.forEach(deal => {
      if (deal && deal.propertySubType) {
        // If property types are selected, only show sub-types for those types
        if (state.selectedPropertyTypes.length === 0 || 
            state.selectedPropertyTypes.includes(deal.propertyType)) {
          subTypes.add(deal.propertySubType);
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
      if (deal && deal.status) statuses.add(deal.status);
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
  
  // Destructure state for easier access - this ensures we have direct access to state properties
  // without any issues with variable hoisting or initialization order
  const {
    deals,
    allDeals,
    loading,
    error,
    isInIframe,
    expandedDeals,
    lightboxMedia,
    displayCount,
    isPropertyTypeOpen,
    isSubTypeOpen,
    isStatusOpen,
    selectedPropertyTypes,
    selectedPropertySubTypes,
    selectedStatuses
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
      if (selectedPropertyTypes.length > 0 && 
          !selectedPropertyTypes.includes(deal.propertyType)) {
        return false;
      }
      
      // Sub-type filter
      if (selectedPropertySubTypes.length > 0 && 
          !selectedPropertySubTypes.includes(deal.propertySubType)) {
        return false;
      }
      
      // Status filter
      if (selectedStatuses.length > 0 && 
          !selectedStatuses.includes(deal.status)) {
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
                
                if (deal.thumbnailUrl) {
                  if (deal.thumbnailType === 'video') {
                    allMedia.push({
                      videoUrl: deal.thumbnailUrl,
                      thumbnailUrl: deal.thumbnailUrl,
                      caption: 'Thumbnail',
                      type: 'video',
                      displayOrder: -1 // Thumbnail first
                    });
                  } else {
                    allMedia.push({
                      imageUrl: deal.thumbnailUrl,
                      thumbnailUrl: deal.thumbnailUrl,
                      caption: 'Thumbnail',
                      type: 'image',
                      displayOrder: -1 // Thumbnail first
                    });
                  }
                }
                
                // Add images, filtering out duplicates
                if (deal.images && deal.images.length > 0) {
                  const uniqueImages = deal.images.filter(img => {
                    const imgUrl = img.imageUrl || img.thumbnailUrl;
                    return !deal.thumbnailUrl || imgUrl !== deal.thumbnailUrl;
                  });
                  allMedia.push(...uniqueImages.map(img => ({ ...img, type: 'image' })));
                }
                
                // Add videos, filtering out duplicates
                if (deal.videos && deal.videos.length > 0) {
                  const uniqueVideos = deal.videos.filter(vid => {
                    return !deal.thumbnailUrl || vid.videoUrl !== deal.thumbnailUrl;
                  });
                  allMedia.push(...uniqueVideos.map(vid => ({ ...vid, type: 'video' })));
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
                                        src={item.videoUrl}
                                        className="w-full h-full object-contain"
                                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                                        muted
                                        loop
                                        playsInline
                                        autoPlay
                                        preload="auto"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          openLightbox(item, deal.title, e);
                                        }}
                                      >
                                        Your browser does not support the video tag.
                                      </video>
                                    </div>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                      <img
                                        src={item.imageUrl || item.thumbnailUrl}
                                        alt={item.caption || deal.title || `Image ${index + 1}`}
                                        className="h-full w-full object-cover cursor-pointer"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          openLightbox(item, deal.title, e);
                                        }}
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

      {/* Lightbox Modal */}
      {lightboxMedia && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <div 
            className="relative w-full h-full max-w-7xl mx-auto px-4 py-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2"
              aria-label="Close lightbox"
            >
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Deal Title */}
            {lightboxMedia.dealTitle && (
              <div className="text-center mb-4">
                <h3 className="text-white text-xl font-semibold">{lightboxMedia.dealTitle}</h3>
              </div>
            )}

            {/* Media Content */}
            <div className="relative h-[calc(100vh-120px)] w-full flex items-center justify-center">
              {lightboxMedia.media.type === 'video' ? (
                <video
                  src={lightboxMedia.media.videoUrl}
                  controls
                  className="max-w-full max-h-full object-contain"
                  autoPlay
                  preload="auto"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={lightboxMedia.media.imageUrl || lightboxMedia.media.thumbnailUrl}
                  alt={lightboxMedia.media.caption || lightboxMedia.dealTitle || 'Expanded image'}
                  className="max-w-full max-h-full object-contain"
                />
              )}
              
              {lightboxMedia.media.caption && (
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-white bg-black bg-opacity-50 px-4 py-2 rounded inline-block">
                    {lightboxMedia.media.caption}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
