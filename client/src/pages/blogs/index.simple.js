import { useEffect, useState } from 'react';
import { getBlogs } from '@/utils/api';
import { isSubdomain } from '@/utils/subdomainRouting';

/**
 * Simple blog listing page with proper styling but minimal React dependencies
 * to troubleshoot React rendering issues
 */
export default function BlogsSimplePage() {
  // Use a single state object to minimize hooks
  const [state, setState] = useState({
    blogs: [],
    loading: true,
    error: null,
    isInIframe: false,
    expandedBlogs: {}, // Track which blogs are expanded
    expandedImages: {} // Track which images are expanded
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
  
  // Process blog content - strip some HTML if needed
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
  const { blogs, loading, error, isInIframe, expandedBlogs, expandedImages } = state;
  
  // Toggle blog expansion
  function toggleBlogExpansion(blogId) {
    setState(prev => ({
      ...prev,
      expandedBlogs: {
        ...prev.expandedBlogs,
        [blogId]: !prev.expandedBlogs[blogId]
      }
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
  const blogContentStyle = `
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
  `;
  
  return (
    <div className="bg-white py-8">
      {/* Add custom CSS */}
      <style dangerouslySetInnerHTML={{ __html: blogContentStyle }} />
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-bf-blue mb-6">Blog Posts</h1>
        <p className="text-lg text-gray-600 mb-8">
          Real estate insights, market trends, and news
        </p>
        
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
          <div className="space-y-8">
            {blogs.map((blog) => (
              <div key={blog.id} className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow">
                {/* Blog header */}
                <div className="p-4 bg-gray-50 flex flex-col md:flex-row md:justify-between md:items-center cursor-pointer gap-2"
                  onClick={() => toggleBlogExpansion(blog.id)}
                >
                  <h2 className="text-xl font-semibold">{blog.title}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{formatDate(blog.publishedAt || blog.createdAt)}</span>
                    <span className="text-bf-blue">{expandedBlogs[blog.id] ? '▲' : '▼'}</span>
                  </div>
                </div>
                
                {/* Blog content - expandable */}
                <div className={`p-4 transition-all duration-300 ${expandedBlogs[blog.id] ? '' : 'max-h-32 overflow-hidden relative'}`}>
                  {!expandedBlogs[blog.id] && (
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent"></div>
                  )}
                  {/* Blog images */}
                  {(blog.images && blog.images.length > 0) && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {blog.images.map((image, index) => (
                        <div 
                          key={`${blog.id}-img-${index}`} 
                          className="relative cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent blog toggle
                            toggleImageExpansion(`${blog.id}-img-${index}`);
                          }}
                        >
                          <img
                            src={image.thumbnailUrl || image.imageUrl}
                            alt={image.caption || `Image ${index + 1}`}
                            className={`rounded border ${expandedImages[`${blog.id}-img-${index}`] ? 'w-full max-w-2xl mx-auto block' : 'w-24 h-24 object-cover'}`}
                          />
                          {image.caption && expandedImages[`${blog.id}-img-${index}`] && (
                            <p className="text-sm text-center text-gray-500 mt-1">{image.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Blog excerpt */}
                  <div className="text-gray-600 blog-content">
                    {blog.content ? (
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: processContent(expandedBlogs[blog.id] ? blog.content : blog.content.substring(0, 300) + '...') 
                        }} 
                      />
                    ) : blog.excerpt ? (
                      <div dangerouslySetInnerHTML={{ __html: processContent(blog.excerpt) }} />
                    ) : (
                      <p>No content available.</p>
                    )}
                  </div>
                  
                  {/* Read more button */}
                  <div className="mt-4 text-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBlogExpansion(blog.id);
                      }}
                      className="px-4 py-2 text-bf-blue hover:text-blue-700 font-medium border border-bf-blue rounded hover:bg-blue-50"
                    >
                      {expandedBlogs[blog.id] ? 'Show Less' : 'Read More'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (!loading && !error) ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">No blog posts available at the moment.</p>
            <div className="mt-6">
              <a href="/blogs/" className="mt-4 px-4 py-2 bg-bf-blue text-white rounded hover:bg-blue-700 transition-colors">
                Back to Main Blogs
              </a>
            </div>
          </div>
        ) : null}
        
        {/* Footer navigation */}
        {!loading && blogs.length > 0 && (
          <div className="mt-10 text-center border-t pt-6">
            <a href="/blogs/" className="px-4 py-2 bg-bf-blue text-white rounded hover:bg-blue-700 transition-colors">
              Back to Main Blog Page
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
