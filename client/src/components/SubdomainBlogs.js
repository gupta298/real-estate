import { useState, useEffect, useCallback } from 'react';
import { getBlogs } from '@/utils/api';
import SubdomainMeta from './SubdomainMeta';

/**
 * Simplified Blogs component specifically for subdomain display
 * This removes many UI elements for a cleaner, more focused view
 */
export default function SubdomainBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [isInIframe, setIsInIframe] = useState(false);

  // Define loadBlogs function with useCallback to prevent recreation on each render
  const loadBlogs = useCallback(async (retry = false) => {
    try {
      console.log(`SubdomainBlogs: Loading blogs (attempt ${loadAttempts + 1})...`);
      setLoading(true);
      setLoadError(null);
      
      if (retry) {
        console.log('SubdomainBlogs: Retry attempt');
      }
      
      // We now always use the explicit API path
      const data = await getBlogs();
      console.log('SubdomainBlogs: API response:', data);
      
      if (data && data.blogs && Array.isArray(data.blogs)) {
        console.log(`SubdomainBlogs: Successfully loaded ${data.blogs.length} blogs`);
        setBlogs(data.blogs);
      } else {
        console.error('SubdomainBlogs: Invalid response format, blogs array not found', data);
        setLoadError('Received invalid data format from server');
        setBlogs([]);
      }
    } catch (error) {
      console.error('SubdomainBlogs: Error loading blogs:', error);
      setLoadError(error.message || 'Failed to load blogs');
      setBlogs([]);
    } finally {
      setLoading(false);
      setLoadAttempts(prevAttempts => prevAttempts + 1);
    }
  }, [loadAttempts]); // Include loadAttempts in the dependency array
  
  // Effect for initial load
  useEffect(() => {
    // Initial load
    loadBlogs();
    
    // Detect if we're in an iframe
    if (typeof window !== 'undefined') {
      setIsInIframe(window.self !== window.top);
    }
  }, [loadBlogs]); // Add loadBlogs as a dependency

  // Retry handler function
  const handleRetry = () => {
    loadBlogs(true);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Simple render function
  return (
    <div className="bg-white py-8">
      <SubdomainMeta 
        title="Blog | Blue Flag Indy" 
        description="Real estate insights, market trends, and news from Blue Flag Indy" 
      />
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
            <p>Load attempts: {loadAttempts}</p>
          </div>
        )}
        
        {blogs.length > 0 ? (
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
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Blog details */}
                <div className="p-4">
                  <div className="text-sm text-gray-500 mb-2">
                    {blog.publishDate && formatDate(blog.publishDate)}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{blog.title}</h2>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {blog.excerpt || blog.content?.substring(0, 150)}...
                  </p>
                  <div className="mt-4">
                    <a 
                      href={`/blogs/${blog.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-bf-blue hover:text-blue-700 font-medium"
                    >
                      Read More
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">
              {loading ? 'Loading...' : loadError ? `Error: ${loadError}` : 'No blog posts available at the moment.'}
            </p>
            <button 
              onClick={handleRetry}
              className="mt-4 px-4 py-2 bg-bf-blue text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
