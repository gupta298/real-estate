import { useState, useEffect, useRef, useMemo } from 'react';
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

  // Set up slideshow for images - only runs in browser context
  function setupSlideshow() {
    // Skip if not in browser
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    // Clear any existing interval
    if (slideshowInterval) clearInterval(slideshowInterval);
    
    // Create slideshow interval - advance slides every 5 seconds
    slideshowInterval = setInterval(() => {
      try {
        // Don't advance slides if a video is playing
        const anyVideoPlaying = document.querySelector('video')?.paused === false;
        if (anyVideoPlaying) return;
        
        // Get all slideshow containers
        const slideshows = document.querySelectorAll('.swiper-wrapper');
        if (!slideshows || slideshows.length === 0) return;
        
        slideshows.forEach(slideshow => {
          if (!slideshow) return;
          const slides = slideshow.querySelectorAll('.swiper-slide');
          if (!slides || slides.length <= 1) return; // Skip if only one slide
          
          // Find active slide
          let activeIndex = -1;
          slides.forEach((slide, index) => {
            if (!slide) return;
            if (slide.classList?.contains('swiper-slide-active')) {
              activeIndex = index;
            }
          });
          
          if (activeIndex === -1) activeIndex = 0;
          
          // Move to next slide
          const nextIndex = (activeIndex + 1) % slides.length;
          slides.forEach(s => {
            if (s && s.classList) s.classList.remove('swiper-slide-active');
          });
          
          if (slides[nextIndex] && slides[nextIndex].classList) {
            slides[nextIndex].classList.add('swiper-slide-active');
          }
          
          // Update pagination bullets
          const paginationContainer = slideshow.closest('.swiper-horizontal')?.querySelector('.swiper-pagination');
          if (paginationContainer) {
            const bullets = paginationContainer.querySelectorAll('.swiper-pagination-bullet');
            if (bullets && bullets.length) {
              bullets.forEach(b => {
                if (b && b.classList) b.classList.remove('swiper-pagination-bullet-active');
              });
              if (bullets[nextIndex] && bullets[nextIndex].classList) {
                bullets[nextIndex].classList.add('swiper-pagination-bullet-active');
              }
            }
          }
        });
      } catch (e) {
        console.error('Error in slideshow:', e);
      }
    }, 5000); // Change slide every 5 seconds
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
  
  // Variables for slideshow - must be declared at top level to avoid variable reference errors
  let slideshowInterval;

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

  
  // Setup slideshow and DOM event handlers in a separate useEffect that only runs on client
  useEffect(() => {
    // Skip if not in browser
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    // Set up slideshow once data is loaded
    if (!loading && filteredDeals.length > 0) {
      setupSlideshow();
    }
    
    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup function
    return () => {
      if (slideshowInterval) clearInterval(slideshowInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (document.body) document.body.style.overflow = 'unset'; // Ensure scrolling is restored on unmount
    };
  }, [loading, filteredDeals.length]);
  
  // Infinite scroll observer effect - client-side only
  useEffect(() => {
    // Skip if not in browser
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    // Don't set up observer if all deals are already displayed or nothing to display
    if (displayCount >= filteredDeals.length || filteredDeals.length === 0) return;
    
    // Create observer only if IntersectionObserver is available (client-side)
    if (!('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry?.isIntersecting && displayCount < filteredDeals.length) {
          // Load 12 more deals
          setState(prev => ({
            ...prev,
            displayCount: Math.min(prev.displayCount + 12, filteredDeals.length)
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
  }, [displayCount, filteredDeals.length]);
  
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
  
  // Create a ref for infinite scrolling observer
  const loadMoreRef = useRef(null);

  // Destructure state for easier access
  const { 
    deals, 
    allDeals,
    loading, 
    error, 
    isInIframe,
    lightboxMedia,
    displayCount,
    isPropertyTypeOpen,
    isSubTypeOpen,
    isStatusOpen,
    selectedPropertyTypes,
    selectedPropertySubTypes,
    selectedStatuses,
    availableFilters
  } = state;
  
  // Get unique property types from all deals using useMemo
  const availablePropertyTypes = useMemo(() => {
    const types = new Set();
    allDeals.forEach(deal => {
      if (deal.propertyType) types.add(deal.propertyType);
    });
    return Array.from(types).sort();
  }, [allDeals]);

  // Get unique sub-types - filtered by selected property types if any
  const availableSubTypes = useMemo(() => {
    const subTypes = new Set();
    allDeals.forEach(deal => {
      if (deal.propertySubType) {
        // If property types are selected, only show sub-types for those types
        if (selectedPropertyTypes.length === 0 || selectedPropertyTypes.includes(deal.propertyType)) {
          subTypes.add(deal.propertySubType);
        }
      }
    });
    return Array.from(subTypes).sort();
  }, [allDeals, selectedPropertyTypes]);

  // Get unique statuses from all deals
  const availableStatuses = useMemo(() => {
    const statuses = new Set();
    allDeals.forEach(deal => {
      if (deal.status) statuses.add(deal.status);
    });
    return Array.from(statuses).sort();
  }, [allDeals]);

  // Filter deals based on selected filters using useMemo
  const filteredDeals = useMemo(() => {
    return allDeals.filter(deal => {
      // Property type filter
      if (selectedPropertyTypes.length > 0 && !selectedPropertyTypes.includes(deal.propertyType)) {
        return false;
      }
      
      // Sub-type filter
      if (selectedPropertySubTypes.length > 0 && !selectedPropertySubTypes.includes(deal.propertySubType)) {
        return false;
      }
      
      // Status filter
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(deal.status)) {
        return false;
      }
      
      return true;
    });
  }, [allDeals, selectedPropertyTypes, selectedPropertySubTypes, selectedStatuses]);

  // Get deals to display (paginated)
  const displayedDeals = useMemo(() => {
    return filteredDeals.slice(0, displayCount);
  }, [filteredDeals, displayCount]);

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

    .swiper-pagination {
      position: absolute;
      text-align: center;
      transition: opacity 0.3s;
      transform: translateZ(0);
      z-index: 10;
      bottom: 8px;
      left: 0;
      width: 100%;
    }
    
    .swiper-pagination-bullet {
      width: 8px;
      height: 8px;
      display: inline-block;
      border-radius: 50%;
      background: #000;
      opacity: 0.2;
      margin: 0 4px;
    }
    
    .swiper-pagination-bullet-active {
      opacity: 1;
      background: var(--swiper-theme-color,#007aff);
    }
    
    .swiper-slide {
      flex-shrink: 0;
      width: 100%;
      height: 100%;
      position: relative;
      transition-property: transform;
      display: block;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .swiper-slide-active {
      opacity: 1;
    }
    
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 50;
    }
    
    .modal-content {
      background-color: white;
      border-radius: 8px;
      width: 95%;
      max-width: 900px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      position: relative;
    }
    
    .modal-close-button {
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: white;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      z-index: 2;
    }
    
    video:focus {
      outline: none;
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
            {/* Property Type Dropdown */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('propertyType')}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-bf-blue transition duration-200"
                >
                  <span className="text-gray-700">
                    {selectedPropertyTypes.length === 0 
                      ? 'All Types' 
                      : `${selectedPropertyTypes.length} selected`}
                  </span>
                  <FiChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isPropertyTypeOpen ? 'transform rotate-180' : ''}`} />
                </button>
                
                {isPropertyTypeOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                      {availablePropertyTypes.map(type => (
                        <label
                          key={type}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPropertyTypes.includes(type)}
                            onChange={() => togglePropertyType(type)}
                            className="w-4 h-4 text-bf-blue border-gray-300 rounded focus:ring-bf-blue"
                          />
                          <span className="flex items-center gap-2 text-gray-700">
                            {getPropertyTypeIcon(type)}
                            <span className="capitalize">{type}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Selected Property Types */}
              {selectedPropertyTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedPropertyTypes.map(type => (
                    <span
                      key={type}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-bf-blue text-white text-sm rounded-full"
                    >
                      <span className="capitalize">{type}</span>
                      <button
                        onClick={() => removePropertyType(type)}
                        className="hover:text-gray-200"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Sub-Type Dropdown */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sub-Type</label>
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('subType')}
                  disabled={selectedPropertyTypes.length === 0 && availableSubTypes.length === 0}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-bf-blue transition duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <span className="text-gray-700">
                    {selectedPropertySubTypes.length === 0 
                      ? 'All Sub-Types' 
                      : `${selectedPropertySubTypes.length} selected`}
                  </span>
                  <FiChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isSubTypeOpen ? 'transform rotate-180' : ''}`} />
                </button>
                
                {isSubTypeOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                      {availableSubTypes.length > 0 ? (
                        availableSubTypes.map(subType => (
                          <label
                            key={subType}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPropertySubTypes.includes(subType)}
                              onChange={() => toggleSubType(subType)}
                              className="w-4 h-4 text-bf-blue border-gray-300 rounded focus:ring-bf-blue"
                            />
                            <span className="text-gray-700">{formatPropertySubType(subType)}</span>
                          </label>
                        ))
                      ) : (
                        <div className="p-2 text-gray-500 text-sm">No sub-types available</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Selected Sub-Types */}
              {selectedPropertySubTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedPropertySubTypes.map(subType => (
                    <span
                      key={subType}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-bf-gold text-white text-sm rounded-full"
                    >
                      <span>{formatPropertySubType(subType)}</span>
                      <button
                        onClick={() => removeSubType(subType)}
                        className="hover:text-gray-200"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('status')}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-bf-blue transition duration-200"
                >
                  <span className="text-gray-700">
                    {selectedStatuses.length === 0 
                      ? 'All Statuses' 
                      : `${selectedStatuses.length} selected`}
                  </span>
                  <FiChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isStatusOpen ? 'transform rotate-180' : ''}`} />
                </button>
                
                {isStatusOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                      {availableStatuses.map(status => (
                        <label
                          key={status}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStatuses.includes(status)}
                            onChange={() => toggleStatus(status)}
                            className="w-4 h-4 text-bf-blue border-gray-300 rounded focus:ring-bf-blue"
                          />
                          <span className="text-gray-700">{formatStatus(status)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Selected Statuses */}
              {selectedStatuses.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedStatuses.map(status => (
                    <span
                      key={status}
                      className={`inline-flex items-center gap-1 px-3 py-1 text-white text-sm rounded-full ${
                        status === 'open' ? 'bg-green-500' :
                        status === 'pending' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`}
                    >
                      <span>{formatStatus(status)}</span>
                      <button
                        onClick={() => removeStatus(status)}
                        className="hover:text-gray-200"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Clear Filters Button */}
          {(selectedPropertyTypes.length > 0 || selectedPropertySubTypes.length > 0 || selectedStatuses.length > 0) && (
            <button
              onClick={clearAllFilters}
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
            <p>Active filters: Property Types: {selectedPropertyTypes.join(', ')}, SubTypes: {selectedPropertySubTypes.join(', ')}, Statuses: {selectedStatuses.join(', ')}</p>
            <p>Filtered: {filteredDeals.length} / Total: {allDeals.length} / Displayed: {displayCount}</p>
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
        ) : filteredDeals.length > 0 ? (
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
                            {allMedia.map((item, index) => (
                              <div key={`${deal.id}-media-${index}`} className={`swiper-slide ${index === 0 ? 'swiper-slide-active' : ''}`} style={{ width: '100%' }}>
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
                          {allMedia.length > 1 && (
                            <div className="swiper-pagination swiper-pagination-clickable swiper-pagination-bullets swiper-pagination-horizontal">
                              {allMedia.map((_, index) => (
                                <span key={index} className={`swiper-pagination-bullet ${index === 0 ? 'swiper-pagination-bullet-active' : ''}`}></span>
                              ))}
                            </div>
                          )}
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
            {displayCount < filteredDeals.length && (
              <div ref={loadMoreRef} className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bf-blue"></div>
                <p className="text-gray-500 text-sm mt-2">Loading more deals...</p>
              </div>
            )}

            {/* Show count if all deals are loaded */}
            {displayCount >= filteredDeals.length && filteredDeals.length > 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                Showing all {filteredDeals.length} deal{filteredDeals.length !== 1 ? 's' : ''}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <FiBriefcase className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              No off-market deals match your filters.
            </p>
            {(selectedPropertyTypes.length > 0 || selectedPropertySubTypes.length > 0 || selectedStatuses.length > 0) ? (
              <button
                onClick={clearAllFilters}
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
              <FiX className="w-6 h-6" />
            </button>

            {/* Deal Title */}
            <div className="text-center mb-4">
              <h3 className="text-white text-xl font-semibold">{lightboxMedia.dealTitle}</h3>
            </div>

            {/* Media Content */}
            <div className="relative h-[calc(100vh-120px)] w-full flex items-center justify-center">
              {lightboxMedia.media.type === 'video' ? (
                <video
                  src={lightboxMedia.media.videoUrl}
                  controls
                  className="max-w-full max-h-full object-contain"
                  autoPlay
                  loop
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

      {/* Click outside to close dropdowns */}
      {(isPropertyTypeOpen || isSubTypeOpen || isStatusOpen) && (
        <div
          className="fixed inset-0 z-0"
          onClick={closeAllDropdowns}
        />
      )}
    </div>
  );
}
