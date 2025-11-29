'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { getAdminProperties, togglePropertyFeatured } from '@/utils/api';
import { FiHome, FiStar, FiSearch, FiArrowLeft } from 'react-icons/fi';

export default function FeaturedListingsPage() {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, featured, not-featured

  useEffect(() => {
    loadProperties();
  }, [search, filter]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (search) params.search = search;
      if (filter === 'featured') params.featured = 'true';
      if (filter === 'not-featured') params.featured = 'false';

      const data = await getAdminProperties(params);
      setProperties(data.properties || []);
    } catch (error) {
      console.error('Error loading properties:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (propertyId, currentFeatured) => {
    try {
      await togglePropertyFeatured(propertyId, !currentFeatured);
      loadProperties(); // Reload list
    } catch (error) {
      console.error('Error toggling featured:', error);
      alert('Failed to update featured status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                <FiArrowLeft className="text-xl" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Featured Listings</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search properties..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field md:w-48"
            >
              <option value="all">All Properties</option>
              <option value="featured">Featured Only</option>
              <option value="not-featured">Not Featured</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => {
              const primaryImage = property.images?.[0];
              return (
                <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {primaryImage && (
                    <div className="relative h-48">
                      <Image
                        src={primaryImage.imageUrl || primaryImage.thumbnailUrl}
                        alt={property.title}
                        fill
                        className="object-cover"
                      />
                      {property.featured && (
                        <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-bold">
                          FEATURED
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-2">{property.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {property.address}, {property.city}, {property.state}
                    </p>
                    <p className="text-lg font-bold text-primary-600 mb-4">
                      ${property.price?.toLocaleString()}
                    </p>
                    <button
                      onClick={() => handleToggleFeatured(property.id, property.featured)}
                      className={`w-full flex items-center justify-center space-x-2 ${
                        property.featured
                          ? 'bg-yellow-100 text-yellow-900 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } px-4 py-2 rounded-lg transition-colors`}
                    >
                      <FiStar className={property.featured ? 'fill-current' : ''} />
                      <span>{property.featured ? 'Remove from Featured' : 'Mark as Featured'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && properties.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500">No properties found</p>
          </div>
        )}
      </div>
    </div>
  );
}

