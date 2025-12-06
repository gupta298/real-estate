import { useEffect, useState } from 'react';
import { getBlogs } from '@/utils/api';
import { isSubdomain } from '@/utils/subdomainRouting';

/**
 * Ultra-simplified blog listing page with minimal dependencies
 * to troubleshoot React rendering issues
 */
export default function BlogsSimplePage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check if we're on a subdomain
  const isOnSubdomain = isSubdomain('blog');
  
  useEffect(() => {
    // Load blogs on component mount
    async function loadBlogs() {
      try {
        setLoading(true);
        
        console.log('Loading blogs...');
        const data = await getBlogs();
        console.log('Blog data received:', data);
        
        if (data?.blogs) {
          setBlogs(data.blogs);
        } else {
          setError('No blogs found');
        }
      } catch (err) {
        console.error('Error loading blogs:', err);
        setError(err.message || 'Failed to load blogs');
      } finally {
        setLoading(false);
      }
    }
    
    loadBlogs();
  }, []);
  
  // Show loading state
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading blogs...</p>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()} style={{ 
          padding: '0.5rem 1rem',
          background: '#0066cc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '1rem'
        }}>
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Blog Posts</h1>
      
      {blogs.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          {blogs.map(blog => (
            <div key={blog.id} style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{blog.title}</h2>
              <p style={{ fontSize: '0.9rem', color: '#666', margin: '0.5rem 0' }}>
                {blog.publishDate && new Date(blog.publishDate).toLocaleDateString()}
              </p>
              <p style={{ margin: '1rem 0' }}>
                {blog.excerpt || (blog.content && blog.content.substring(0, 150) + '...')}
              </p>
              <a 
                href={`/blogs/${blog.id}`} 
                target={isOnSubdomain ? "_blank" : undefined}
                rel={isOnSubdomain ? "noopener noreferrer" : undefined}
                style={{ color: '#0066cc', textDecoration: 'none' }}
              >
                Read More
              </a>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f7f7f7', borderRadius: '4px' }}>
          No blog posts available.
        </p>
      )}
    </div>
  );
}
