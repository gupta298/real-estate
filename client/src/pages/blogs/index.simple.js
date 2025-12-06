import { useEffect, useState } from 'react';
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
    expandedImages: {}, // Track which images are expanded
    selectedBlog: null, // For modal view
    modalOpen: false
  });
  
  // Check if we're on a subdomain
  const isOnSubdomain = isSubdomain('blog');
  
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
      document.title = 'Blogs | Blue Flag Indy';
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
    
    loadBlogs();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isActive = false;
    };
  }, []);
  
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
  const { blogs, loading, error, isInIframe, expandedBlogs, expandedImages, selectedBlog, modalOpen } = state;
  
  // Toggle blog expansion
  function toggleBlogExpansion(blogId) {
    // Find the blog
    const blog = blogs.find(b => b.id === blogId);
    if (blog) {
      setState(prev => ({
        ...prev,
        selectedBlog: blog,
        modalOpen: true
      }));
    }
  }

  // Close modal
  function closeModal() {
    setState(prev => ({
      ...prev,
      selectedBlog: null,
      modalOpen: false
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
    .swiper-pagination-bullet {
      width: 8px;
      height: 8px;
      display: inline-block;
      border-radius: 50%;
      background: #000;
      opacity: 0.2;
    }
    .swiper-pagination-bullet-active {
      opacity: 1;
      background: var(--swiper-theme-color,#007aff);
    }
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 50;
    }
    .modal-content {
      background-color: white;
      border-radius: 8px;
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }
    .modal-close-button {
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: white;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
            {blogs.map((blog) => (
              <div key={blog.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                {/* Featured Image (if available) */}
                {blog.images && blog.images.length > 0 && (
                  <div className="relative h-64 w-full cursor-pointer" onClick={() => toggleBlogExpansion(blog.id)}>
                    <div className="swiper swiper-initialized swiper-horizontal h-full w-full swiper-backface-hidden">
                      <div className="swiper-wrapper">
                        <div className="swiper-slide swiper-slide-active" style={{ width: '100%' }}>
                          <div className="relative h-64 w-full bg-black">
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <img 
                                src={blog.images[0].imageUrl || blog.images[0].thumbnailUrl} 
                                alt="Featured Image" 
                                className="object-contain"  
                                style={{ position: 'absolute', height: '100%', width: '100%', inset: 0 }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="swiper-pagination swiper-pagination-clickable swiper-pagination-bullets swiper-pagination-horizontal swiper-pagination-lock">
                        <span className="swiper-pagination-bullet swiper-pagination-bullet-active"></span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-6">
                  <p className="text-sm text-gray-500 mb-2">{formatDate(blog.publishedAt || blog.createdAt)}</p>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{blog.title}</h2>
                  <p className="text-gray-700 mb-4">
                    {blog.excerpt || blog.content?.substring(0, 200).replace(/<[^>]*>/g, '') || 'No content available.'}{blog.content?.length > 200 ? '...' : ''}
                  </p>
                  <button 
                    onClick={() => toggleBlogExpansion(blog.id)}
                    className="flex items-center gap-2 text-bf-blue hover:text-bf-gold font-semibold transition-colors"
                  >
                    <span>Read More</span>
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                      <polyline points="6 9 12 15 18 9"></polyline>
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

        {/* Infinite scroll indicator */}
        {!loading && !error && blogs.length > 0 && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bf-blue"></div>
            <p className="text-gray-500 text-sm mt-2">Loading more posts...</p>
          </div>
        )}
      </div>

      {/* Blog post modal */}
      {modalOpen && selectedBlog && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-button" onClick={closeModal}>
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-2">{formatDate(selectedBlog.publishedAt || selectedBlog.createdAt)}</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">{selectedBlog.title}</h2>
              
              {/* Featured Image */}
              {selectedBlog.images && selectedBlog.images.length > 0 && (
                <div className="relative h-80 w-full mb-6">
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <img 
                      src={selectedBlog.images[0].imageUrl || selectedBlog.images[0].thumbnailUrl} 
                      alt="Featured Image" 
                      className="h-full object-contain"
                    />
                  </div>
                </div>
              )}
              
              {/* Blog content */}
              <div className="blog-content text-gray-700 mb-8">
                {selectedBlog.content ? (
                  <div dangerouslySetInnerHTML={{ __html: processContent(selectedBlog.content) }} />
                ) : (
                  <p>No content available for this post.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
