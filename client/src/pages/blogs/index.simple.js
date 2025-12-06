import { useEffect, useState, useRef } from 'react';
import { getBlogs } from '@/utils/api';
import { isSubdomain } from '@/utils/subdomainRouting';

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

  useEffect(() => {
    // Flag to track component mount state
    let isActive = true;
    let slideshowInterval;
    
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
            
            // Setup image slideshow
            if (typeof window !== 'undefined') {
              setupSlideshow();
            }
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
    
    // Set up slideshow for images
    function setupSlideshow() {
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
          
          slideshows.forEach(slideshow => {
            const slides = slideshow.querySelectorAll('.swiper-slide');
            if (slides.length <= 1) return; // Skip if only one slide
            
            // Find active slide
            let activeIndex = -1;
            slides.forEach((slide, index) => {
              if (slide.classList.contains('swiper-slide-active')) {
                activeIndex = index;
              }
            });
            
            // Move to next slide
            const nextIndex = (activeIndex + 1) % slides.length;
            slides.forEach(s => s.classList.remove('swiper-slide-active'));
            slides[nextIndex].classList.add('swiper-slide-active');
            
            // Update pagination bullets
            const paginationContainer = slideshow.closest('.swiper-horizontal')?.querySelector('.swiper-pagination');
            if (paginationContainer) {
              const bullets = paginationContainer.querySelectorAll('.swiper-pagination-bullet');
              bullets.forEach(b => b.classList.remove('swiper-pagination-bullet-active'));
              bullets[nextIndex]?.classList.add('swiper-pagination-bullet-active');
            }
          });
        } catch (e) {
          console.error('Error in slideshow:', e);
        }
      }, 5000); // Change slide every 5 seconds
    }
    
    // Handle video play/pause when user navigates away
    function handleVisibilityChange() {
      if (document.hidden) {
        // Page is hidden, pause all videos
        document.querySelectorAll('video').forEach(video => video.pause());
      }
    }
    
    // Add visibility change listener
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    
    loadBlogs();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isActive = false;
      if (slideshowInterval) clearInterval(slideshowInterval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.body.style.overflow = 'unset'; // Ensure scrolling is restored on unmount
      }
    };
  }, []);
  
  // Infinite scroll observer effect (similar to main page)
  useEffect(() => {
    // Don't set up observer if all blogs are already displayed
    if (displayCount >= blogs.length) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry?.isIntersecting && displayCount < blogs.length) {
          // Load 12 more blogs
          setState(prev => ({
            ...prev,
            displayCount: Math.min(prev.displayCount + 12, blogs.length)
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
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [displayCount, blogs.length]);
  
  // Format date for display
  function formatDate(dateString) {
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return dateString || '';
    }
  }
  
  // Process blog content - strip some HTML if needed and limit length
  function processContent(content) {
    if (!content) return '';
    
    // If content already seems to be HTML, return it
    if (content.includes('<p>') || content.includes('<div>')) {
      return content;
    }
    
    // Otherwise, break it into paragraphs
    return content.split('\n\n')
      .map(para => `<p>${para}</p>`)
      .join('');
  }
  
  // Strip HTML tags for excerpt
  function stripHtml(html) {
    return html?.replace(/<[^>]*>/g, '') || '';
  }

  // Handle retry
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

  // Destructure state for easier access
  const { blogs, loading, error, isInIframe, expandedBlogs, lightboxImages, displayCount } = state;
  
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
  
  // Open lightbox for image
  function openLightbox(image, blogTitle, e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setState(prev => ({
      ...prev,
      lightboxImages: { image, blogTitle }
    }));
    // Prevent scrolling when lightbox is open
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }

  // Close lightbox
  function closeLightbox() {
    setState(prev => ({
      ...prev,
      lightboxImages: null
    }));
    // Restore scrolling
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'unset';
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
      margin: 1.5rem 0 1rem;
    }
    .blog-content h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 1.25rem 0 0.75rem;
    }
    .blog-content ul, .blog-content ol {
      margin-left: 1.5rem;
      margin-bottom: 1rem;
    }
    .blog-content li {
      margin-bottom: 0.5rem;
    }
    .blog-content img {
      max-width: 100%;
      height: auto;
      margin: 1rem 0;
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bf-blue"></div>
            <p className="mt-4 text-gray-600">Loading blog posts...</p>
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
        
        {/* Blog list */}
        {!loading && !error && blogs.length > 0 ? (
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
                    <div className="relative h-64 w-full cursor-pointer" onClick={() => toggleBlogExpansion(blog.id)}>
                      <div className="swiper swiper-initialized swiper-horizontal h-full w-full swiper-backface-hidden">
                        <div className="swiper-wrapper">
                          {allMedia.map((item, index) => (
                            <div key={`${blog.id}-preview-${index}`} className={`swiper-slide ${index === 0 ? 'swiper-slide-active' : ''}`} style={{ width: '100%' }}>
                              <div className="relative h-64 w-full bg-black">
                                {item.type === 'video' ? (
                                  <div className="w-full h-full flex items-center justify-center">
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
                    <span>{expandedBlogs[blog.id] ? 'Show Less' : 'Read More'}</span>
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                      <polyline points={expandedBlogs[blog.id] ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (!loading && !error) ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">No blogs available at the moment.</p>
          </div>
        ) : null}

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
      </div>

      {/* Lightbox Modal */}
      {lightboxImages && (
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

            {/* Blog Title */}
            {lightboxImages.blogTitle && (
              <div className="text-center mb-4">
                <h3 className="text-white text-xl font-semibold">{lightboxImages.blogTitle}</h3>
              </div>
            )}

            {/* Media Content */}
            <div className="relative h-[calc(100vh-120px)] w-full flex items-center justify-center">
              {lightboxImages.image.type === 'video' ? (
                <video
                  src={lightboxImages.image.videoUrl}
                  controls
                  className="max-w-full max-h-full object-contain"
                  autoPlay
                  preload="auto"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={lightboxImages.image.imageUrl || lightboxImages.image.thumbnailUrl}
                  alt={lightboxImages.image.caption || lightboxImages.blogTitle || 'Expanded image'}
                  className="max-w-full max-h-full object-contain"
                />
              )}
              
              {lightboxImages.image.caption && (
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-white bg-black bg-opacity-50 px-4 py-2 rounded inline-block">
                    {lightboxImages.image.caption}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
