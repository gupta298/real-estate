import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PropertyCard from '@/components/PropertyCard/PropertyCard';
import SearchFilters from '@/components/SearchFilters/SearchFilters';
import { searchProperties } from '@/utils/api';

export default function SearchPage() {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({});

  useEffect(() => {
    if (router.isReady) {
      const queryParams = router.query;
      setFilters(queryParams);
      if (Object.keys(queryParams).length > 0) {
        performSearch(queryParams);
      }
    }
  }, [router.isReady, router.query]);

  const performSearch = async (searchFilters) => {
    try {
      setLoading(true);
      const data = await searchProperties({
        ...searchFilters,
        page: searchFilters.page || 1,
        limit: searchFilters.limit || 20,
      });
      setProperties(data.properties || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error('Error searching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchFilters) => {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(searchFilters).filter(([_, v]) => v !== ''))
    );
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Search Properties</h1>
        <p className="text-gray-600">
          Find your perfect home with our advanced search
        </p>
      </div>

      <div className="mb-8">
        <SearchFilters onSearch={handleSearch} initialFilters={filters} />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : properties.length > 0 ? (
        <>
          <div className="mb-6 text-gray-600">
            Found {pagination.total || properties.length} properties
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No properties found. Try adjusting your search criteria.</p>
        </div>
      )}
    </div>
  );
}

