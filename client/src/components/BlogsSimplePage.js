import { useEffect, useState, useRef } from 'react';
import { getBlogs } from '@/utils/api';
import { isSubdomain } from '@/utils/subdomainRouting';
import { FiX } from 'react-icons/fi';
import Image from 'next/image';
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
  
  // Create refs outside of render phase to avoid hydration issues
  const loadMoreRef = useRef(null);
  const previousFocusRef = useRef(null);
  const closeButtonRef = useRef(null);
  
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

  // Separate useEffect for client-side only code to fix hydration issues
  useEffect(() => {
    // This runs only on client-side after hydration is complete
    if (typeof window === 'undefined') return;
    
    // Check if in iframe
    setState(prev => ({
      ...prev,
      isInIframe: window.self !== window.top
    }));
  }, []);
  
  // Data fetching effect
  useEffect(() => {
    // Flag to track component mount state
    let isActive = true;
    
    // Load blogs on component mount
    async function loadBlogs() {
      try {
        if (typeof window === 'undefined') return; // Skip during SSR
        
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
  
  // Setup visibility change handlers in a separate useEffect that only runs on client
  useEffect(() => {
    // Skip if not in browser - ensures this only runs client-side after hydration
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup function
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (document.body) document.body.style.overflow = 'unset'; // Ensure scrolling is restored on unmount
      }
    };
  }, []);

  // Handle keyboard events for lightbox navigation - only runs client-side
  useEffect(() => {
    // Skip during server-side rendering
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    // Only add keyboard handlers when lightbox is open
    if (!state.lightboxImages) return;
    
    // Use a timeout to ensure hydration is complete
    const timerId = setTimeout(() => {
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
          
          if (focusableElements.length === 0) return;
          
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];
          
          if (e.shiftKey && document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          // Navigate to next image
          if (Array.isArray(state.lightboxImages.allMedia) && state.lightboxImages.allMedia.length > 1) {
            const currentIndex = state.lightboxImages.currentIndex || 0;
            const nextIndex = (currentIndex + 1) % state.lightboxImages.allMedia.length;
            
            setState(prev => ({
              ...prev,
              lightboxImages: {
                ...prev.lightboxImages,
                currentIndex: nextIndex
              }
            }));
            
            e.preventDefault();
          }
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          // Navigate to previous image
          if (Array.isArray(state.lightboxImages.allMedia) && state.lightboxImages.allMedia.length > 1) {
            const currentIndex = state.lightboxImages.currentIndex || 0;
            const prevIndex = (currentIndex - 1 + state.lightboxImages.allMedia.length) % state.lightboxImages.allMedia.length;
            
            setState(prev => ({
              ...prev,
              lightboxImages: {
                ...prev.lightboxImages,
                currentIndex: prevIndex
              }
            }));
            
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
    }, 0);
    
    return () => clearTimeout(timerId);
  }, [state.lightboxImages]);
  
  // Infinite scroll observer effect - separated to prevent hydration mismatch
  useEffect(() => {
    // Skip if not in browser
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    // Don't set up observer if all blogs are already displayed
    if (state.displayCount >= state.blogs.length) return;
    
    // Create observer only if IntersectionObserver is available (client-side)
    if (!('IntersectionObserver' in window)) return;
    
    // Use a timeout to ensure hydration is complete before attaching observers
    const timerId = setTimeout(() => {
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
    }, 10); // Small delay to ensure hydration is complete
    
    return () => clearTimeout(timerId);
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

  // References moved to top of component
  
  // Open lightbox for image - showing all media not just the clicked one
  function openLightbox(image, blogTitle, e, allMediaItems) {
    // Skip DOM operations during server rendering
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Ensure we have valid data
    const safeImage = image || {};
    const safeBlogTitle = blogTitle || 'Blog Image';
    const allMedia = Array.isArray(allMediaItems) ? allMediaItems : [safeImage];
    
    // Find the current index of the clicked media in the array
    let currentIndex = 0;
    if (allMedia.length > 1) {
      currentIndex = allMedia.findIndex(item => {
        if (item.type === 'video' && safeImage.type === 'video') {
          return item.videoUrl === safeImage.videoUrl;
        } else {
          return (item.imageUrl === safeImage.imageUrl) || 
                 (item.thumbnailUrl === safeImage.thumbnailUrl);
        }
      });
      if (currentIndex < 0) currentIndex = 0;
    }
    
    // Store current active element to restore focus later
    previousFocusRef.current = document.activeElement;
    
    // Delay state update to avoid hydration issues
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        lightboxImages: { 
          image: {
            ...safeImage,
            type: safeImage.type || 'image',
            imageUrl: safeImage.imageUrl || safeImage.thumbnailUrl || '',
            videoUrl: safeImage.videoUrl || '',
            caption: safeImage.caption || ''
          }, 
          blogTitle: safeBlogTitle,
          allMedia: allMedia,
          currentIndex: currentIndex
        }
      }));
      
      // Prevent scrolling when lightbox is open
      if (document.body) {
        document.body.style.overflow = 'hidden';
      }
      
      // Focus close button after a short delay to ensure it's rendered
      setTimeout(() => {
        if (closeButtonRef.current) {
          closeButtonRef.current.focus();
        }
      }, 50);
    }, 0);
  }

  // Close lightbox - safe for server rendering
  function closeLightbox() {
    // Skip DOM operations during server rendering
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    // Pause all videos when closing
    const videos = document.querySelectorAll('video');
    if (videos && videos.length > 0) {
      videos.forEach(video => {
        if (video && typeof video.pause === 'function') video.pause();
      });
    }
    
    // Update state in a separate microtask to avoid hydration issues
    Promise.resolve().then(() => {
      setState(prev => ({
        ...prev,
        lightboxImages: null // Clear all lightbox state including allMedia and currentIndex
      }));
      
      // Restore scrolling
      if (document.body) {
        document.body.style.overflow = 'unset';
      }
      
      // Restore focus to previous element
      setTimeout(() => {
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      }, 50);
    });
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
    
    .static-gallery {
      position: relative;
      width: 100%;
      height: 100%;
    }
  `;
  
  // Use this flag to safely determine if we're running in the browser
  // Avoid destructuring state to ensure all variables are accessed via state.property
  const isBrowser = typeof window !== 'undefined';
  
  // For the initial server-side render, we want to show a minimal loading state
  // This prevents hydration mismatches and React errors 418/423
  if (!isBrowser) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-bf-blue mb-4">Blog</h1>
            <p className="text-lg text-gray-600">
              Latest news, insights, and updates from Blue Flag Realty
            </p>
          </div>
          <div className="text-center py-12">
            <div className="inline-block h-12 w-12"></div>
            <p className="mt-4 text-gray-600">Loading blog posts...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Client-side render with full interactivity
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
            <p>Subdomain: {state.isInIframe ? 'In iframe' : 'Not in iframe'}</p>
            <p>URL: {window.location.href}</p>
            <p>Simple version with minimal React hooks</p>
          </div>
        )}
        
        {/* Loading state */}
        {state.loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bf-blue"></div>
            <p className="mt-4 text-gray-600">Loading blog posts...</p>
          </div>
        ) : state.error ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500 text-lg">Error: {state.error}</p>
            <button 
              onClick={handleRetry}
              className="mt-4 px-4 py-2 bg-bf-blue text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : !state.blogs || state.blogs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500 text-lg">No blog posts available at the moment.</p>
          </div>
        ) : (
          <>
            {/* Blog list */}
            <div className="space-y-6">
              {state.blogs.slice(0, state.displayCount).map((blog) => (
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
                        <div className="relative h-64 w-full">
                          <div className="static-gallery h-full w-full">
                            {/* Show only the first media item (thumbnail) with safe property access */}
                            {allMedia.length > 0 && (() => {
                              // Extract the first item safely to avoid TDZ errors
                              const item = allMedia[0] || {};
                              const mediaType = item.type || 'image';
                              const videoUrl = item.videoUrl || '';
                              const imageUrl = item.imageUrl || item.thumbnailUrl || '';
                              const caption = item.caption || '';
                              const blogTitle = blog.title || 'Blog Post';
                              
                              return (
                                <div className="relative h-64 w-full bg-black">
                                  {mediaType === 'video' ? (
                                    <div 
                                      className="w-full h-full flex items-center justify-center"
                                      onClick={e => {
                                        if (e && typeof e.stopPropagation === 'function') {
                                          e.stopPropagation();
                                        }
                                        if (isBrowser) {
                                          openLightbox(item, blogTitle, e, allMedia);
                                        }
                                      }}
                                    >
                                      <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity duration-300 z-10">
                                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
                                        </svg>
                                      </div>
                                      <video 
                                        src={getVideoUrl(videoUrl)}
                                        className="w-full h-full object-contain"
                                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                                        muted
                                        playsInline
                                        autoPlay
                                        preload="auto"
                                        onClick={isBrowser ? (e => {
                                          if (e && typeof e.stopPropagation === 'function') {
                                            e.stopPropagation();
                                          }
                                        }) : undefined}
                                      >
                                        Your browser does not support the video tag.
                                      </video>
                                    </div>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 relative">
                                      <div className="absolute inset-0">
                                        <Image 
                                          src={getImageUrl(imageUrl)} 
                                          alt={caption || blogTitle || `Blog Image`} 
                                          fill
                                          className="object-contain cursor-pointer"  
                                          onClick={isBrowser ? (e => {
                                            if (e && typeof e.stopPropagation === 'function') {
                                              e.stopPropagation();
                                            }
                                            openLightbox(item, blogTitle, e, allMedia);
                                          }) : undefined}
                                          unoptimized={true}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                            {allMedia.length > 1 && (
                              <div className="mt-2 text-center">
                                <span className="text-xs text-gray-500">Click to view all {allMedia.length} media</span>
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
                      {blog.excerpt || blog.content?.substring(0, 200).replace(/<[^>]*>/g, '') || 'No content available.'}{!state.expandedBlogs[blog.id] && blog.content?.length > 200 ? '...' : ''}
                    </p>
                    
                    {/* Expanded blog content */}
                    {state.expandedBlogs[blog.id] && (
                      <div className="blog-content mb-4">
                        {/* Blog full content */}
                        <div dangerouslySetInnerHTML={{ __html: processContent(blog.content) }} />
                      </div>
                    )}
                    
                    <button 
                      onClick={() => toggleBlogExpansion(blog.id)}
                      className="flex items-center gap-2 text-bf-blue hover:text-bf-gold font-semibold transition-colors"
                    >
                      {state.expandedBlogs[blog.id] ? 'Read Less' : 'Read More'}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 transition-transform ${state.expandedBlogs[blog.id] ? 'transform rotate-180' : ''}`}
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
            {!state.loading && !state.error && state.blogs.length > 0 && state.displayCount < state.blogs.length && (
              <div className="text-center py-8" ref={loadMoreRef}>
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bf-blue"></div>
                <p className="text-gray-500 text-sm mt-2">Loading more posts...</p>
              </div>
            )}
            
            {/* Show count if all blogs are loaded */}
            {!state.loading && !state.error && state.blogs.length > 0 && state.displayCount >= state.blogs.length && (
              <div className="text-center py-8 text-gray-500 text-sm">
                Showing all {state.blogs.length} post{state.blogs.length !== 1 ? 's' : ''}
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox Modal - Full Screen */}
      {isBrowser && state.lightboxImages && (() => {
        // Safely extract properties to avoid TDZ errors
        const blogTitle = state.lightboxImages?.blogTitle || '';
        const allMedia = Array.isArray(state.lightboxImages?.allMedia) ? state.lightboxImages.allMedia : [];
        const currentIndex = typeof state.lightboxImages?.currentIndex === 'number' ? state.lightboxImages.currentIndex : 0;
        
        // Get current media item
        const currentItem = allMedia[currentIndex] || state.lightboxImages?.image || {};
        const mediaType = currentItem?.type || 'image';
        const imageUrl = currentItem?.imageUrl || currentItem?.thumbnailUrl || '';
        const videoUrl = currentItem?.videoUrl || '';
        const caption = currentItem?.caption || '';
        
        // Navigation functions
        const goToNext = (e) => {
          if (e) e.stopPropagation();
          if (allMedia.length <= 1) return;
          
          const nextIndex = (currentIndex + 1) % allMedia.length;
          setState(prev => ({
            ...prev,
            lightboxImages: {
              ...prev.lightboxImages,
              currentIndex: nextIndex
            }
          }));
        };
        
        const goToPrev = (e) => {
          if (e) e.stopPropagation();
          if (allMedia.length <= 1) return;
          
          const prevIndex = (currentIndex - 1 + allMedia.length) % allMedia.length;
          setState(prev => ({
            ...prev,
            lightboxImages: {
              ...prev.lightboxImages,
              currentIndex: prevIndex
            }
          }));
        };
        
        return (
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
              <h2 id="lightbox-title" className="sr-only">{blogTitle} - Image Gallery</h2>
              
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
              {blogTitle && (
                <div className="text-center mb-4">
                  <h3 className="text-white text-xl font-semibold">{blogTitle}</h3>
                </div>
              )}
              
              {/* Previous Button - only show if there are multiple media items */}
              {allMedia.length > 1 && (
                <button 
                  onClick={goToPrev}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-3 z-10 focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Previous image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
              )}
  
              {/* Next Button - only show if there are multiple media items */}
              {allMedia.length > 1 && (
                <button 
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-3 z-10 focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Next image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              )}
  
              {/* Media Content */}
              <div className="relative w-full h-full flex items-center justify-center lightbox-media">
                {mediaType === 'video' ? (
                  <video
                    key={videoUrl} /* Key helps React re-render when source changes */
                    src={getVideoUrl(videoUrl)}
                    controls
                    className="object-contain cursor-pointer"
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
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                      key={imageUrl} /* Key helps React re-render when source changes */
                      src={getImageUrl(imageUrl)}
                      alt={caption || blogTitle || 'Expanded image'}
                      fill
                      className="object-contain cursor-pointer"
                      unoptimized={true}
                      onClick={goToNext} /* Click image to go to next */
                    />
                  </div>
                )}
                
                {/* Image Counter and Keyboard Instructions */}
                <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center justify-center gap-2">
                  <div className="bg-black bg-opacity-80 text-white px-4 py-1 rounded-full text-sm">
                    {caption || `${blogTitle} - Image`}
                  </div>
                  {allMedia.length > 1 && (
                    <div className="bg-black bg-opacity-80 text-white px-4 py-1 rounded-full text-sm">
                      Image {currentIndex + 1} of {allMedia.length}
                    </div>
                  )}
                  <div className="bg-black bg-opacity-70 text-white text-xs px-4 py-1 rounded-full">
                    Press Esc to close • Space for video play/pause
                    {allMedia.length > 1 ? ' • Arrow keys or click for navigation' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
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
