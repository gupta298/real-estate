// Import React but minimize hooks to avoid hydration issues
import { useState, useEffect } from 'react';
import { getBlogs } from '@/utils/api';

/**
 * Ultra-simplified Blogs component for subdomain display
 * Minimizes hooks and complexity to avoid React errors #418 and #423
 */
export default function SubdomainBlogs() {
  // Combine state into a single object to minimize hooks
  const [state, setState] = useState({
    blogs: [],
    loading: true,
    error: null,
    isInIframe: false
  });
  
  // Use a single effect for all initialization
  useEffect(() => {
    // Flag to prevent state updates after unmount
    let isActive = true;
    
    // Detect iframe
    if (typeof window !== 'undefined') {
      if (isActive) {
        setState(prev => ({
          ...prev,
          isInIframe: window.self !== window.top
        }));
      }
    }
    
    // Load blogs
    async function loadBlogs() {
      try {
        console.log('SubdomainBlogs: Loading blogs...');
        const data = await getBlogs();
        console.log('SubdomainBlogs: API response:', data);
        
        if (isActive) {
          if (data && data.blogs && Array.isArray(data.blogs)) {
            console.log(`SubdomainBlogs: Successfully loaded ${data.blogs.length} blogs`);
            setState(prev => ({
              ...prev,
              blogs: data.blogs,
              loading: false
            }));
          } else {
            console.error('SubdomainBlogs: Invalid response format, blogs array not found', data);
            setState(prev => ({
              ...prev,
              error: 'Received invalid data format from server',
              loading: false
            }));
          }
        }
      } catch (error) {
        console.error('SubdomainBlogs: Error loading blogs:', error);
        if (isActive) {
          setState(prev => ({
            ...prev,
            error: error.message || 'Failed to load blogs',
            loading: false
          }));
        }
      }
    }
    
    loadBlogs();
    
    // Cleanup function
    return () => {
      isActive = false;
    };
  }, []); // No dependencies for this effect
  
  // Simple helper function for date formatting
  function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }
  
  // Handle retry
  function handleRetry() {
    setState(prev => ({ ...prev, loading: true, error: null }));
    // We need to wait for the next render before reloading
    setTimeout(() => {
      getBlogs()
        .then(data => {
          if (data && data.blogs && Array.isArray(data.blogs)) {
            setState(prev => ({
              ...prev,
              blogs: data.blogs,
              loading: false
            }));
          } else {
            setState(prev => ({
              ...prev,
              error: 'Received invalid data format from server',
              loading: false
            }));
          }
        })
        .catch(error => {
          setState(prev => ({
            ...prev,
            error: error.message || 'Failed to load blogs',
            loading: false
          }));
        });
    }, 100);
  }
  
  // Destructure state for easier access
  const { blogs, loading, error, isInIframe } = state;
  
  // Simple render function that avoids Next.js components
  return (
    <div className="bg-white py-8">
      {/* Simple title - avoiding Next.js Head component which can cause hydration issues */}
      {typeof document !== 'undefined' && (
        <script dangerouslySetInnerHTML={{ 
          __html: `document.title = 'Blog | Blue Flag Indy';` 
        }} />
      )}
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
            <p>Simple mode: active</p>
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
              {loading ? 'Loading...' : error ? `Error: ${error}` : 'No blog posts available at the moment.'}
            </p>
            <button 
              onClick={handleRetry}
              className="mt-4 px-4 py-2 bg-bf-blue text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <div className="mt-4">
              <a href="/blogs/ultra-simple" className="text-blue-500 underline">
                View Ultra Simple Version
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
