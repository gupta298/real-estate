// Ultra simple page with no hooks or client-side data loading
// This is a test to bypass React hook errors

export default function UltraSimpleBlogPage() {
  // No hooks, no state, just static content
  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Blog Posts</h1>
      <p>This is an ultra-simple blog page without React hooks.</p>
      
      <div style={{ marginTop: '2rem' }}>
        <div style={{ border: '1px solid #eee', padding: '1rem', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Sample Blog Post 1</h2>
          <p style={{ color: '#666' }}>2025-12-01</p>
          <p>This is a sample blog post content.</p>
        </div>
        
        <div style={{ border: '1px solid #eee', padding: '1rem', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Sample Blog Post 2</h2>
          <p style={{ color: '#666' }}>2025-12-02</p>
          <p>Another sample blog post content.</p>
        </div>
        
        <div style={{ border: '1px solid #eee', padding: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Sample Blog Post 3</h2>
          <p style={{ color: '#666' }}>2025-12-03</p>
          <p>Yet another sample blog post content.</p>
        </div>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <p>See the API data at: <a href="/blogs/index.simple" style={{ color: 'blue' }}>Simple Blogs Page</a></p>
      </div>
    </div>
  );
}
