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
    isInIframe: false
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

  // Extract state variables
  const { blogs, loading, error, isInIframe } = state;
  
  return (
    <div className="bg-white py-8">
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
        
        {/* Blog grid */}
        {!loading && !error && blogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <div key={blog.id} className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow">
                {/* Blog image or placeholder */}
                <div className="h-48 bg-gray-100">
                  {blog.thumbnailUrl ? (
                    <img 
                      src={blog.thumbnailUrl}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                    />
                  ) : blog.images && blog.images.length > 0 ? (
                    <img
                      src={blog.images[0].imageUrl}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                
                {/* Blog content */}
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2 line-clamp-2">{blog.title}</h2>
                  <p className="text-gray-500 text-sm mb-2">
                    {formatDate(blog.publishedAt || blog.createdAt)}
                  </p>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {blog.excerpt || blog.content?.substring(0, 150)}...
                  </p>
                  <div className="mt-4">
                    <a 
                      href={`/blogs/${blog.id}`}
                      target={isOnSubdomain ? "_blank" : undefined}
                      rel={isOnSubdomain ? "noopener noreferrer" : undefined}
                      className="inline-block text-bf-blue hover:text-blue-700 font-medium"
                    >
                      Read More
                    </a>
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
