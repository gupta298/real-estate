import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PropertyCard from '@/components/PropertyCard/PropertyCard';
import SearchFilters from '@/components/SearchFilters/SearchFilters';
import { getProperties, searchProperties } from '@/utils/api';

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadProperties();
  }, [router.query]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const queryParams = router.query;
      
      if (Object.keys(queryParams).length > 0) {
        // Use search API if filters are present
        const data = await searchProperties({
          ...queryParams,
          page: queryParams.page || 1,
          limit: queryParams.limit || 20,
        });
        setProperties(data.properties || []);
        setPagination(data.pagination || {});
      } else {
        // Use regular properties API
        const data = await getProperties({
          page: queryParams.page || 1,
          limit: queryParams.limit || 20,
        });
        setProperties(data.properties || []);
        setPagination(data.pagination || {});
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchFilters) => {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(searchFilters).filter(([_, v]) => v !== ''))
    );
    router.push(`/properties?${params.toString()}`);
  };

  const handlePageChange = (page) => {
    const params = new URLSearchParams(router.query);
    params.set('page', page);
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">All Properties</h1>
        <p className="text-gray-600">
          Browse our complete collection of MLS listings
        </p>
      </div>

      <div className="mb-8">
        <SearchFilters onSearch={handleSearch} initialFilters={router.query} />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : properties.length > 0 ? (
        <>
          <div className="mb-6 text-gray-600">
            Showing {properties.length} of {pagination.total || 0} properties
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-12">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No properties found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

