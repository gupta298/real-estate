import dynamic from 'next/dynamic';

// Create a loading component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bf-blue"></div>
        <p className="mt-4 text-gray-600">Loading off-market deals...</p>
      </div>
    </div>
  );
}

// Import the actual component with SSR disabled
const OffMarketSimplePageComponent = dynamic(
  () => import('@/components/OffMarketSimplePage'),
  { 
    ssr: false,
    loading: LoadingFallback
  }
);

/**
 * Simple off-market listing page wrapper with SSR disabled to avoid DOM/window access issues
 */
export default function OffMarketSimplePage() {
  return <OffMarketSimplePageComponent />;
}
