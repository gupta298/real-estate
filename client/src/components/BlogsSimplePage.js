import { useEffect, useState, useRef } from 'react';
import { getBlogs } from '@/utils/api';
import { isSubdomain } from '@/utils/subdomainRouting';
import { FiX } from 'react-icons/fi';

/**
 * Simple blog listing page with proper styling but minimal React dependencies
 * to troubleshoot React rendering issues
 */
export default function BlogsSimplePage() {
  // State management with a single state object to minimize hooks
  const [state, setState] = useState({
    blogs: [],
    loading: true,
    error: null,
    isInIframe: false,
    expandedBlogs: {}, // Track which blogs are expanded
    lightboxImages: null, // { image, blogTitle }
    displayCount: 12 // For infinite scrolling, similar to main page
  });
  
  // Check if we're on a subdomain
  const isOnSubdomain = isSubdomain('blog');
  
  // Create a ref for infinite scrolling observer
  const loadMoreRef = useRef(null);

  // Ref for storing interval ID safely within React's lifecycle
  const slideshowIntervalRef = useRef(null);
  
  // Set up slideshow for images - only runs in browser context
  function setupSlideshow() {
    // Skip if not in browser
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    // Clear any existing interval
    if (slideshowIntervalRef.current) {
      clearInterval(slideshowIntervalRef.current);
      slideshowIntervalRef.current = null;
    }
    
    // Create slideshow interval - advance slides every 5 seconds
    const intervalId = setInterval(() => {
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
    
    // Store the interval ID in the ref
    slideshowIntervalRef.current = intervalId;
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
    
    // Load blogs on component mount
    async function loadBlogs() {
      try {
        console.log('Loading blogs via explicit API path...');
        const data = await getBlogs();
        console.log('Blog data received:', data);
        
        if (isActive) {
          if (data?.blogs) {
            setState(prev => ({
              ...prev,
              blogs: data.blogs,
              loading: false
            }));
          } else {
            setState(prev => ({
              ...prev,
              error: 'No blogs found',
              loading: false
            }));
          }
        }
      } catch (err) {
        console.error('Error loading blogs:', err);
        if (isActive) {
          setState(prev => ({
            ...prev,
            error: err.message || 'Failed to load blogs',
            loading: false
          }));
        }
      }
    }
    
    // Only load blogs on first client render
    loadBlogs();
    
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
    if (!state.loading && state.blogs.length > 0) {
      setupSlideshow();
    }
    
    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup function
    return () => {
      // Clear the interval using the ref
      if (slideshowIntervalRef.current) {
        clearInterval(slideshowIntervalRef.current);
        slideshowIntervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (document.body) document.body.style.overflow = 'unset'; // Ensure scrolling is restored on unmount
    };
  }, [state.loading, state.blogs.length]);

  // Handle keyboard events for lightbox navigation
  useEffect(() => {
    if (!lightboxImages || typeof window === 'undefined') return;
    
    const handleKeyboardNavigation = (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'Tab') {
        // Handle focus trap inside lightbox
        const lightbox = document.querySelector('[role="dialog"]');
        if (!lightbox) return;
        
        const focusableElements = lightbox.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      } else if (e.key === ' ' || e.key === 'Enter') {
        // Space or Enter toggles play/pause for videos
        const activeVideo = document.querySelector('.lightbox-media video');
        if (activeVideo) {
          if (activeVideo.paused) {
            activeVideo.play().catch(() => {});
          } else {
            activeVideo.pause();
          }
          e.preventDefault();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyboardNavigation);
    return () => window.removeEventListener('keydown', handleKeyboardNavigation);
  }, [lightboxImages]);
  
  // Infinite scroll observer effect (similar to main page)
  useEffect(() => {
    // Skip if not in browser
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    // Don't set up observer if all blogs are already displayed
    if (state.displayCount >= state.blogs.length) return;
    
    // Create observer only if IntersectionObserver is available (client-side)
    if (!('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry?.isIntersecting && state.displayCount < state.blogs.length) {
          // Load 12 more blogs
          setState(prev => ({
            ...prev,
            displayCount: Math.min(prev.displayCount + 12, state.blogs.length)
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
  }, [state.displayCount, state.blogs.length]);
  
  // Format date for display
  function formatDate(dateString) {
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return dateString || '';
    }
  }
  
  // Process content (strip HTML if needed)
  function processContent(content) {
    if (!content) return '';
    return content;
  }
  
  // Toggle blog expansion in-place
  function toggleBlogExpansion(blogId) {
    setState(prev => ({
      ...prev,
      expandedBlogs: {
        ...prev.expandedBlogs,
        [blogId]: !prev.expandedBlogs[blogId]
      }
    }));
  }

  // Reference to store previously focused element
  const previousFocusRef = useRef(null);
  
  // Lightbox close button ref for auto-focusing
  const closeButtonRef = useRef(null);
  
  // Open lightbox for image
  function openLightbox(image, blogTitle, e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Store current active element to restore focus later
    if (typeof document !== 'undefined') {
      previousFocusRef.current = document.activeElement;
    }
    
    setState(prev => ({
      ...prev,
      lightboxImages: { image, blogTitle }
    }));
    
    // Prevent scrolling when lightbox is open
    if (typeof window !== 'undefined' && typeof document !== 'undefined' && document.body) {
      document.body.style.overflow = 'hidden';
      
      // Focus close button after a short delay to ensure it's rendered
      setTimeout(() => {
        if (closeButtonRef.current) {
          closeButtonRef.current.focus();
        }
      }, 50);
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
      lightboxImages: null
    }));
    
    // Restore scrolling
    if (typeof window !== 'undefined' && typeof document !== 'undefined' && document.body) {
      document.body.style.overflow = 'unset';
      
      // Restore focus to previous element
      setTimeout(() => {
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      }, 50);
    }
  }
  
  // Custom CSS for blog content
  const contentStyle = `
    .blog-content p {
      margin-bottom: 1rem;
    }
    .blog-content h2 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-top: 1.5rem;
      margin-bottom: 1rem;
    }
    .blog-content h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-top: 1.25rem;
      margin-bottom: 0.75rem;
    }
    .blog-content ul, .blog-content ol {
      margin-left: 1.5rem;
      margin-bottom: 1rem;
    }
    .blog-content li {
      margin-bottom: 0.5rem;
    }
    .blog-content a {
      color: #1a56db;
      text-decoration: underline;
    }
    .blog-content img {
      max-width: 100%;
      height: auto;
      margin-bottom: 1rem;
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
  `;
  
  // Destructure state for easier access
  const { blogs, loading, error, isInIframe, expandedBlogs, lightboxImages, displayCount } = state;
  
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      {/* Add custom CSS */}
      <style dangerouslySetInnerHTML={{ __html: contentStyle }} />
      
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-bf-blue mb-4">Blog</h1>
          <p className="text-lg text-gray-600">
            Latest news, insights, and updates from Blue Flag Realty
          </p>
        </div>
        
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
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bf-blue"></div>
            <p className="mt-4 text-gray-600">Loading blog posts...</p>
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
        ) : !blogs || blogs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500 text-lg">No blog posts available at the moment.</p>
          </div>
        ) : (
          <>
            {/* Blog list */}
            <div className="space-y-6">
              {blogs.slice(0, displayCount).map((blog) => (
                <div key={blog.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  {/* Featured Image/Media Carousel */}
                  {(() => {
                    // Collect all media (images + videos), similar to main page
                    const allMedia = [];
                    const thumbnailUrl = blog.thumbnailUrl;
                    
                    if (thumbnailUrl) {
                      if (blog.thumbnailType === 'video') {
                        allMedia.push({
                          videoUrl: thumbnailUrl,
                          thumbnailUrl: thumbnailUrl,
                          caption: 'Thumbnail',
                          type: 'video',
                          displayOrder: -1 // Thumbnail first
                        });
                      } else {
                        allMedia.push({
                          imageUrl: thumbnailUrl,
                          thumbnailUrl: thumbnailUrl,
                          caption: 'Thumbnail',
                          type: 'image',
                          displayOrder: -1 // Thumbnail first
                        });
                      }
                    }
                    
                    // Add images, filtering out duplicates
                    if (blog.images && blog.images.length > 0) {
                      const uniqueImages = blog.images.filter(img => {
                        const imgUrl = img.imageUrl || img.thumbnailUrl;
                        return !thumbnailUrl || imgUrl !== thumbnailUrl;
                      });
                      allMedia.push(...uniqueImages.map(img => ({ ...img, type: 'image' })));
                    }
                    
                    // Add videos, filtering out duplicates
                    if (blog.videos && blog.videos.length > 0) {
                      const uniqueVideos = blog.videos.filter(vid => {
                        return !thumbnailUrl || vid.videoUrl !== thumbnailUrl;
                      });
                      allMedia.push(...uniqueVideos.map(vid => ({ ...vid, type: 'video' })));
                    }
                    
                    // Sort by displayOrder
                    allMedia.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
                    
                    if (allMedia.length === 0) return null;
                    
                    return (
                      <div className="relative cursor-pointer" onClick={() => toggleBlogExpansion(blog.id)}>
                        {/* Hint message */}
                        <div className="text-center text-xs text-gray-500 mb-1">
                          <span>Click on image/video to view in fullscreen</span>
                        </div>
                        <div className="relative h-64 w-full">
                          <div className="swiper swiper-initialized swiper-horizontal h-full w-full swiper-backface-hidden">
                            <div className="swiper-wrapper">
                              {allMedia.map((item, index) => (
                                <div key={`${blog.id}-preview-${index}`} className={`swiper-slide ${index === 0 ? 'swiper-slide-active' : ''}`} style={{ width: '100%' }}>
                                  <div className="relative h-64 w-full bg-black">
                                    {item.type === 'video' ? (
                                      <div 
                                        className="w-full h-full flex items-center justify-center"
                                        onClick={e => {
                                          e.stopPropagation();
                                          openLightbox(item, blog.title, e);
                                        }}
                                      >
                                        <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity duration-300 z-10">
                                          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
                                          </svg>
                                        </div>
                                        <video 
                                          src={item.videoUrl}
                                          className="w-full h-full object-contain"
                                          style={{ maxWidth: '100%', maxHeight: '100%', position: 'absolute', inset: 0 }}
                                          muted
                                          loop
                                          playsInline
                                          autoPlay
                                          preload="auto"
                                          onClick={e => e.stopPropagation()}
                                        >
                                          Your browser does not support the video tag.
                                        </video>
                                      </div>
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                        <img 
                                          src={item.imageUrl || item.thumbnailUrl} 
                                          alt={item.caption || blog.title || `Image ${index + 1}`} 
                                          className="object-contain cursor-pointer"  
                                          style={{ position: 'absolute', height: '100%', width: '100%', inset: 0 }}
                                          onClick={e => {
                                            e.stopPropagation();
                                            openLightbox(item, blog.title, e);
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
                        </div>
                      </div>
                    );
                  })()} 
                  <div className="p-6">
                    <p className="text-sm text-gray-500 mb-2">{formatDate(blog.publishedAt || blog.createdAt)}</p>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">{blog.title}</h2>
                    <p className="text-gray-700 mb-4">
                      {blog.excerpt || blog.content?.substring(0, 200).replace(/<[^>]*>/g, '') || 'No content available.'}{!expandedBlogs[blog.id] && blog.content?.length > 200 ? '...' : ''}
                    </p>
                    
                    {/* Expanded blog content */}
                    {expandedBlogs[blog.id] && (
                      <div className="blog-content mb-4">
                        {/* Blog full content */}
                        <div dangerouslySetInnerHTML={{ __html: processContent(blog.content) }} />
                      </div>
                    )}
                    
                    <button 
                      onClick={() => toggleBlogExpansion(blog.id)}
                      className="flex items-center gap-2 text-bf-blue hover:text-bf-gold font-semibold transition-colors"
                    >
                      {expandedBlogs[blog.id] ? 'Read Less' : 'Read More'}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 transition-transform ${expandedBlogs[blog.id] ? 'transform rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Infinite scroll indicator - only show if there might be more posts */}
            {!loading && !error && blogs.length > 0 && displayCount < blogs.length && (
              <div className="text-center py-8" ref={loadMoreRef}>
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bf-blue"></div>
                <p className="text-gray-500 text-sm mt-2">Loading more posts...</p>
              </div>
            )}
            
            {/* Show count if all blogs are loaded */}
            {!loading && !error && blogs.length > 0 && displayCount >= blogs.length && (
              <div className="text-center py-8 text-gray-500 text-sm">
                Showing all {blogs.length} post{blogs.length !== 1 ? 's' : ''}
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox Modal - Full Screen */}
      {lightboxImages && (
        <div 
          className="fixed inset-0 z-50 bg-black flex items-center justify-center" 
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-title"
          style={{ height: '100vh', width: '100vw' }}
        >
          <div 
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hidden title for screen readers */}
            <h2 id="lightbox-title" className="sr-only">{lightboxImages.blogTitle} - Image Gallery</h2>
            {/* Close Button */}
            <button
              ref={closeButtonRef}
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Close lightbox"
            >
              <FiX className="w-6 h-6" />
            </button>

            {/* Blog Title */}
            {lightboxImages.blogTitle && (
              <div className="text-center mb-4">
                <h3 className="text-white text-xl font-semibold">{lightboxImages.blogTitle}</h3>
              </div>
            )}

            {/* Media Content */}
            <div className="relative w-full h-full flex items-center justify-center lightbox-media">
              {lightboxImages.image.type === 'video' ? (
                <video
                  src={lightboxImages.image.videoUrl}
                  controls
                  className="object-contain"
                  style={{ 
                    width: 'auto',
                    height: 'auto',
                    maxWidth: '100vw',
                    maxHeight: '100vh',
                    objectFit: 'contain'
                  }}
                  autoPlay
                  preload="auto"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={lightboxImages.image.imageUrl || lightboxImages.image.thumbnailUrl}
                  alt={lightboxImages.image.caption || lightboxImages.blogTitle || 'Expanded image'}
                  className="object-contain cursor-pointer"
                  style={{ 
                    width: 'auto',
                    height: 'auto',
                    maxWidth: '100vw',
                    maxHeight: '100vh',
                    objectFit: 'contain'
                  }}
                />
              )}
              
              {/* Image Counter and Keyboard Instructions */}
              <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center justify-center gap-2">
                <div className="bg-black bg-opacity-80 text-white px-4 py-1 rounded-full text-sm">
                  {lightboxImages.image.caption || `${lightboxImages.blogTitle} - Image`}
                </div>
                <div className="bg-black bg-opacity-70 text-white text-xs px-4 py-1 rounded-full">
                  Press Esc to close • Space for video play/pause
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Handle retry loading blogs
  function handleRetry() {
    setState(prev => ({ ...prev, loading: true, error: null }));
    getBlogs()
      .then(data => {
        if (data?.blogs) {
          setState(prev => ({
            ...prev,
            blogs: data.blogs,
            loading: false
          }));
        } else {
          setState(prev => ({
            ...prev,
            error: 'No blogs found',
            loading: false
          }));
        }
      })
      .catch(err => {
        setState(prev => ({
          ...prev,
          error: err.message || 'Failed to load blogs',
          loading: false
        }));
      });
  }
}
