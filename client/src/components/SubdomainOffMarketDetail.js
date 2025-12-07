import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { getOffMarketDealById } from '@/utils/api';
import SubdomainMeta from './SubdomainMeta';
import { isSubdomain } from '@/utils/subdomainRouting';
import Image from 'next/image';

/**
 * Simplified Off-Market Deal Detail component for iframe embedding
 */
export default function SubdomainOffMarketDetail({ id }) {
  const router = useRouter();
  const dealId = id || router.query.id;
  
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInIframe, setIsInIframe] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    // Detect if we're in an iframe
    setIsInIframe(window.self !== window.top);
    
    if (dealId) {
      loadDeal(dealId);
    }
  }, [dealId]);

  const loadDeal = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOffMarketDealById(id);
      
      if (!data.deal) {
        console.log('Deal not found in SubdomainOffMarketDetail, redirecting');
        // Redirect to off-market index page
        handleBackToListing();
        return;
      }
      
      setDeal(data.deal);
    } catch (error) {
      console.error('Error loading off-market deal:', error);
      setError('Failed to load deal details. Please try again later.');
      // On error, also redirect after a short delay
      setTimeout(() => handleBackToListing(), 2000);
    } finally {
      setLoading(false);
    }
  };

  // Previous focus element reference to restore focus when closing lightbox
  const previousFocusRef = useRef(null);
  
  // Lightbox close button ref for auto-focusing
  const closeButtonRef = useRef(null);
  
  // Lightbox open handler
  const openLightbox = (index) => {
    // Store current active element to restore focus later
    if (typeof document !== 'undefined') {
      previousFocusRef.current = document.activeElement;
    }
    
    setCurrentSlideIndex(index);
    setLightboxOpen(true);
    
    // Prevent scrolling when lightbox is open
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
      
      // Focus close button after a short delay to ensure it's rendered
      setTimeout(() => {
        if (closeButtonRef.current) {
          closeButtonRef.current.focus();
        }
      }, 50);
    }
  };

  // Lightbox close handler
  const closeLightbox = () => {
    setLightboxOpen(false);
    
    // Restore scrolling
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'unset';
      
      // Restore focus to previous element
      setTimeout(() => {
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      }, 50);
    }
  };

  // Create mediaItems from deal images and videos
  // Move this up before functions that depend on it
  const mediaItems = deal ? [
    ...(deal.images || []).map(img => ({ ...img, type: 'image', url: img.imageUrl, displayOrder: img.displayOrder || 0 })),
    ...(deal.videos || []).map(vid => ({ ...vid, type: 'video', url: vid.videoUrl, displayOrder: vid.displayOrder || 999 }))
  ].sort((a, b) => a.displayOrder - b.displayOrder) : [];

  // Navigate to next image in lightbox
  const nextImage = () => {
    if (!mediaItems || mediaItems.length === 0) return;
    setCurrentSlideIndex((prev) => (prev + 1) % mediaItems.length);
  };

  // Navigate to previous image in lightbox
  const prevImage = () => {
    if (!mediaItems || mediaItems.length === 0) return;
    setCurrentSlideIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  // Focus trap for the lightbox
  useEffect(() => {
    if (!lightboxOpen || typeof document === 'undefined') return;
    
    // Handle tab key to create a focus trap
    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      
      // Get all focusable elements in the lightbox
      const lightbox = document.querySelector('[role="dialog"]');
      if (!lightbox) return;
      
      const focusableElements = lightbox.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      // Handle tab and shift+tab to create the focus trap
      if (e.shiftKey) { // Shift+Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else { // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    
    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [lightboxOpen]);

  // Enhanced keyboard navigation for both lightbox and main gallery
  useEffect(() => {
    // Skip if not in browser or no media items
    if (typeof window === 'undefined' || !mediaItems || mediaItems.length === 0) return;
    
    const handleKeyPress = (e) => {
      // Process keyboard events based on context
      if (lightboxOpen) {
        // Lightbox is open - handle navigation there
        if (e.key === 'Escape') {
          closeLightbox();
        } else if (e.key === 'ArrowLeft') {
          prevImage();
          e.preventDefault(); // Prevent page scrolling
        } else if (e.key === 'ArrowRight') {
          nextImage();
          e.preventDefault(); // Prevent page scrolling
        } else if (e.key === ' ' || e.key === 'Enter') {
          // Space or Enter toggles play/pause for videos
          const activeVideo = document.querySelector('.lightbox-media video');
          if (activeVideo) {
            if (activeVideo.paused) {
              activeVideo.play();
            } else {
              activeVideo.pause();
            }
            e.preventDefault();
          }
        }
      } else {
        // Regular view - navigate the main gallery
        if (mediaItems.length > 1) {
          if (e.key === 'ArrowLeft') {
            setCurrentSlideIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
            e.preventDefault(); // Prevent page scrolling
          } else if (e.key === 'ArrowRight') {
            setCurrentSlideIndex((prev) => (prev + 1) % mediaItems.length);
            e.preventDefault(); // Prevent page scrolling
          } else if (e.key === 'Enter' || e.key === ' ') {
            // Enter or Space opens the lightbox with current image
            openLightbox(currentSlideIndex);
            e.preventDefault();
          } else if (e.key === 'Escape') {
            // Escape can be used to go back to listing
            handleBackClick();
          }
        }
      }
    };

    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyPress);
    
    // Cleanup on unmount
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [lightboxOpen, mediaItems, currentSlideIndex]);
  
  // No need for Swiper sync effect anymore since we're using a custom gallery
  
  // Pause videos when closing lightbox
  useEffect(() => {
    if (!lightboxOpen && typeof document !== 'undefined') {
      // When lightbox closes, pause any playing videos
      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        if (video && !video.paused) {
          video.pause();
        }
      });
    }
  }, [lightboxOpen]);

  // Format date if available
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handler for back button click and automatic redirects
  const handleBackClick = () => {
    handleBackToListing();
  };
  
  // Common function for handling navigation back to the listing page
  const handleBackToListing = () => {
    if (isInIframe) {
      // In iframe, use client-side routing
      router.push('/off-market/index.simple');
      
      // Also notify the parent frame that we're navigating back, in case they need to handle it
      try {
        window.parent.postMessage({ type: 'navigate-back', destination: '/off-market/index.simple' }, '*');
      } catch (e) {
        console.log('Could not send message to parent frame');
      }
    } else if (isSubdomain('offmarket')) {
      // On subdomain, navigate to the subdomain root
      window.location.href = '/off-market/index.simple';
    } else {
      // Regular navigation
      window.location.href = '/off-market/index.simple';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bf-blue"></div>
        <p className="mt-4 text-gray-600">Loading deal details...</p>
      </div>
    );
  }

  // If there's an error or no deal, show a message briefly before redirecting
  // We're already initiating redirect in loadDeal function
  if (error || !deal) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bf-blue mb-4"></div>
        <p className="text-gray-500 text-lg">{error || 'Deal not found'}</p>
        <p className="text-gray-400 mt-2">Redirecting to Off-Market Deals...</p>
      </div>
    );
  }

  // The mediaItems are already defined above

  return (
    <div className="bg-white">
      <SubdomainMeta
        title={`${deal.title} | Off-Market Deal | Blue Flag Indy`}
        description={deal.content?.substring(0, 160) || 'Exclusive off-market deal from Blue Flag Indy'}
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={handleBackClick}
          className="inline-flex items-center mb-6 text-bf-blue hover:text-blue-700"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Off-Market Deals
        </button>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{deal.title}</h1>
        
        {/* Property type badge */}
        {deal.propertyType && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-block bg-bf-blue text-white px-3 py-1 rounded-full text-sm font-medium capitalize">
              {deal.propertyType}
            </span>
            {deal.propertySubType && (
              <span className="inline-block bg-bf-gold text-white px-3 py-1 rounded-full text-sm font-medium capitalize">
                {deal.propertySubType}
              </span>
            )}
            {deal.status && (
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-white capitalize ${
                deal.status === 'open' ? 'bg-green-500' : 
                deal.status === 'pending' ? 'bg-yellow-500' : 
                'bg-gray-500'
              }`}>
                {deal.status}
              </span>
            )}
            {deal.isHotDeal && (
              <span className="inline-block bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                🔥 HOT DEAL
              </span>
            )}
          </div>
        )}
        
        {/* Location */}
        {deal.area && (
          <p className="text-gray-600 mb-6">
            <span className="font-medium">Location:</span> {deal.area}
          </p>
        )}

        {/* Media Gallery */}
        {mediaItems.length > 0 && (
          <div className="mb-8">
            {/* Add gallery instruction message */}
            <div className="mb-2 text-center text-sm text-gray-500 flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Click on any image to view in fullscreen gallery</span>
              </div>
              <div className="flex items-center gap-2 text-xs mt-1">
                <span>Keyboard: Use ← → arrows to navigate, Enter/Space to open, Esc to close</span>
              </div>
            </div>
            
            {/* Main Large Image */}
            <div className="relative rounded-lg overflow-hidden bg-gray-100 mb-2" style={{ height: '400px', maxWidth: '100%' }}>
              <div 
                className="w-full h-full flex items-center justify-center relative group cursor-pointer"
                style={{ maxHeight: '100%' }}
                onClick={() => openLightbox(currentSlideIndex)}
              >
                {/* Main Content - Image or Video */}
                {mediaItems[currentSlideIndex].type === 'video' ? (
                  <video 
                    src={mediaItems[currentSlideIndex].url}
                    className="max-w-full max-h-full object-contain"
                    style={{ width: 'auto', height: 'auto', maxHeight: '100%' }}
                    controls
                    playsInline
                    preload="metadata"
                    onClick={(e) => e.stopPropagation()} // Prevent opening lightbox when clicking on video controls
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <>
                    <div className="relative w-full h-full">
                      <Image 
                        src={mediaItems[currentSlideIndex].url || '/placeholder-property.jpg'}
                        alt={`Image ${currentSlideIndex + 1} for ${deal.title}`}
                        fill
                        className="object-contain"
                        unoptimized={true}
                      />
                    </div>
                    {/* Hover overlay with zoom icon */}
                    <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
                      </svg>
                    </div>
                  </>
                )}
                
                {/* Navigation Buttons (only if more than 1 image) */}
                {mediaItems.length > 1 && (
                  <>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentSlideIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
                      }}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 focus:outline-none focus:ring-2 focus:ring-white"
                      aria-label="Previous image"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                      </svg>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentSlideIndex((prev) => (prev + 1) % mediaItems.length);
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 focus:outline-none focus:ring-2 focus:ring-white"
                      aria-label="Next image"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </button>
                  </>
                )}
                
                {/* Image Counter */}
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                  {currentSlideIndex + 1} / {mediaItems.length}
                </div>
              </div>
            </div>
            
            {/* Thumbnail Gallery */}
            {mediaItems.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {mediaItems.map((item, index) => (
                  <div 
                    key={`thumb-${index}`}
                    className={`relative h-16 sm:h-20 cursor-pointer rounded overflow-hidden border-2 ${index === currentSlideIndex ? 'border-blue-500' : 'border-transparent hover:border-gray-300'}`}
                    style={{ aspectRatio: '1/1' }}
                    onClick={() => setCurrentSlideIndex(index)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setCurrentSlideIndex(index);
                        e.preventDefault();
                      }
                    }}
                    tabIndex="0"
                    aria-label={`View image ${index + 1}`}
                    role="button"
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full bg-gray-100 relative">
                        {/* Video Thumbnail */}
                        <div className="relative w-full h-full">
                          <Image 
                            src={item.thumbnailUrl || '/placeholder-property.jpg'}
                            alt={`Video thumbnail ${index + 1}`}
                            fill
                            className="object-cover"
                            unoptimized={true}
                          />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 5v14l11-7z"></path>
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-full">
                        <Image 
                          src={item.url || '/placeholder-property.jpg'}
                          alt={`Thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                          unoptimized={true}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="prose max-w-none mb-8">
          {deal.content?.split('\n').map((paragraph, index) => (
            paragraph ? <p key={index} className="mb-4">{paragraph}</p> : <br key={index} />
          ))}
        </div>

        {/* Contact section */}
        <div className="bg-gray-50 p-6 rounded-lg mt-8">
          <h2 className="text-2xl font-bold text-bf-blue mb-4">Interested in this opportunity?</h2>
          <p className="text-gray-700 mb-4">
            Contact us for more details about this off-market deal. Our team is ready to assist you with any questions.
          </p>
          <a 
            href="tel:317-218-1650"
            className="inline-block bg-bf-blue hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded mr-4"
          >
            Call (317) 218-1650
          </a>
          <a 
            href="mailto:info@blueflagindy.com?subject=Off-Market Deal Inquiry: {deal.title}"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-bf-gold hover:bg-yellow-600 text-white font-semibold py-2 px-6 rounded"
          >
            Email Us
          </a>
        </div>
      </div>

      {/* Lightbox Modal - Full Screen */}
      {lightboxOpen && mediaItems.length > 0 && (
        <div 
          className="fixed inset-0 bg-black z-50 flex items-center justify-center" 
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-title"
          style={{ height: '100vh', width: '100vw' }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Hidden title for screen readers */}
            <h2 id="lightbox-title" className="sr-only">{deal.title} - Image Gallery</h2>
            {/* Close Button */}
            <button
              ref={closeButtonRef}
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Close lightbox"
            >
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Previous Button */}
            {mediaItems.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Previous image"
              >
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
            )}

            {/* Main Media Content */}
            <div 
              className="relative w-full h-full max-h-[90vh] flex items-center justify-center lightbox-media" 
              onClick={(e) => {
                e.stopPropagation();
                // Clicking on the image area (when not a video) advances to next image
                if (mediaItems[currentSlideIndex].type !== 'video') {
                  nextImage();
                }
              }}
            >
              {mediaItems[currentSlideIndex].type === 'video' ? (
                <div className="w-full h-full flex items-center justify-center">
                  <video
                    src={mediaItems[currentSlideIndex].url}
                    className="object-contain"
                    style={{ 
                      width: 'auto',
                      height: 'auto',
                      maxWidth: '100vw',
                      maxHeight: '100vh',
                      objectFit: 'contain'
                    }}
                    controls
                    autoPlay
                    onClick={(e) => e.stopPropagation()} // Don't advance when clicking video
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : (
                <div className="relative h-full w-full">
                  <Image
                    src={mediaItems[currentSlideIndex].url || '/placeholder-property.jpg'}
                    alt={`${deal.title} - Image ${currentSlideIndex + 1}`}
                    fill
                    className="object-contain cursor-pointer"
                    onClick={nextImage} /* Click to navigate forward */
                    unoptimized={true}
                  />
                </div>
              )}
            </div>

            {/* Next Button */}
            {mediaItems.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Next image"
              >
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            )}

            {/* Image Counter and Keyboard Instructions */}
            <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center justify-center gap-2">
              <div className="bg-black bg-opacity-80 text-white px-4 py-1 rounded-full text-sm">
                {currentSlideIndex + 1} / {mediaItems.length}
              </div>
              <div className="bg-black bg-opacity-70 text-white text-xs px-4 py-1 rounded-full">
                Use ← → arrows to navigate • Esc to close • Space for video play/pause
              </div>
            </div>

            {/* Thumbnail Strip */}
            {mediaItems.length > 1 && (
              <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-2 overflow-x-auto py-2 px-4 bg-black bg-opacity-70">
                {mediaItems.map((item, index) => (
                  <div
                    key={`thumb-${index}`}
                    className={`relative h-16 w-16 flex-shrink-0 cursor-pointer rounded overflow-hidden border-2 ${index === currentSlideIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'} transition-all`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlideIndex(index);
                    }}
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full bg-black flex items-center justify-center">
                        {/* Video Preview Thumbnail */}
                        <div className="relative w-full h-full">
                          <Image 
                            src={item.thumbnailUrl || '/placeholder-property.jpg'}
                            alt={`Video thumbnail ${index + 1}`}
                            fill
                            className="object-cover"
                            unoptimized={true}
                          />
                        </div>
                        {/* Video Icon */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18V6l8 6-8 6z"></path>
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-full">
                        <Image
                          src={item.url || '/placeholder-property.jpg'}
                          alt={`Thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                          unoptimized={true}
                        />
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 bg-black bg-opacity-60 text-white text-xs px-1">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
