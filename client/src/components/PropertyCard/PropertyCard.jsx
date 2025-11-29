'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiBed, FiHome, FiMapPin, FiDroplet } from 'react-icons/fi';

export default function PropertyCard({ property }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const primaryImage = property.images?.find(img => img.isPrimary) || property.images?.[0];
  const imageUrl = primaryImage?.imageUrl || primaryImage?.thumbnailUrl || '/placeholder-property.jpg';

  return (
    <Link href={`/properties/${property.id}`} className="card group">
      <div className="relative h-64 overflow-hidden">
        <Image
          src={imageUrl}
          alt={property.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {property.featured && (
          <span className="absolute top-4 left-4 bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Featured
          </span>
        )}
        <span className="absolute top-4 right-4 bg-white text-gray-900 px-3 py-1 rounded-full text-sm font-semibold">
          {formatPrice(property.price)}
        </span>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
          {property.title}
        </h3>
        <p className="text-gray-600 mb-4 flex items-center">
          <FiMapPin className="mr-2" />
          {property.address}, {property.city}, {property.state} {property.zipCode}
        </p>
        
        <div className="flex items-center justify-between text-gray-700">
          <div className="flex items-center space-x-1">
            <FiBed className="text-lg" />
            <span className="ml-1">{property.bedrooms} Beds</span>
          </div>
          <div className="flex items-center space-x-1">
            <FiDroplet className="text-lg" />
            <span className="ml-1">{property.bathrooms} Baths</span>
          </div>
          {property.squareFeet && (
            <div className="flex items-center space-x-1">
              <FiHome className="text-lg" />
              <span className="ml-1">{property.squareFeet.toLocaleString()} sqft</span>
            </div>
          )}
        </div>
        
        {property.propertyType && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-500">{property.propertyType}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

