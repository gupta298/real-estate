import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Create a loading component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bf-blue"></div>
        <p className="mt-4 text-gray-600">Loading blog posts...</p>
      </div>
    </div>
  );
}

// Import the actual component with SSR disabled
const BlogsSimplePageComponent = dynamic(
  () => import('@/components/BlogsSimplePage'),
  { 
    ssr: false,
    loading: LoadingFallback
  }
);

/**
 * Simple blog listing page wrapper with SSR disabled to avoid DOM/window access issues
 */
export default function BlogsSimplePage() {
  // Use a state to enforce client-side only rendering
  const [isClient, setIsClient] = useState(false);
  
  // Only render on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render component on client side
  if (!isClient) return <LoadingFallback />;
  
  return <BlogsSimplePageComponent />;
}
