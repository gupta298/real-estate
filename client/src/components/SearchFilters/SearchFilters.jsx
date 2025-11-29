'use client';

import { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

export default function SearchFilters({ onSearch, initialFilters = {} }) {
  const [filters, setFilters] = useState({
    query: initialFilters.query || '',
    city: initialFilters.city || '',
    state: initialFilters.state || '',
    minPrice: initialFilters.minPrice || '',
    maxPrice: initialFilters.maxPrice || '',
    bedrooms: initialFilters.bedrooms || '',
    bathrooms: initialFilters.bathrooms || '',
    propertyType: initialFilters.propertyType || '',
    minSquareFeet: initialFilters.minSquareFeet || '',
    maxSquareFeet: initialFilters.maxSquareFeet || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== '')
    );
    onSearch(cleanFilters);
  };

  const handleReset = () => {
    setFilters({
      query: '',
      city: '',
      state: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      propertyType: '',
      minSquareFeet: '',
      maxSquareFeet: '',
    });
    onSearch({});
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search Query */}
        <div className="lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <input
            type="text"
            name="query"
            value={filters.query}
            onChange={handleChange}
            placeholder="Search by address, city, or keywords..."
            className="input-field"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City
          </label>
          <input
            type="text"
            name="city"
            value={filters.city}
            onChange={handleChange}
            placeholder="City"
            className="input-field"
          />
        </div>

        {/* State */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State
          </label>
          <input
            type="text"
            name="state"
            value={filters.state}
            onChange={handleChange}
            placeholder="State"
            className="input-field"
          />
        </div>

        {/* Property Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Type
          </label>
          <select
            name="propertyType"
            value={filters.propertyType}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">All Types</option>
            <option value="House">House</option>
            <option value="Condo">Condo</option>
            <option value="Townhouse">Townhouse</option>
            <option value="Apartment">Apartment</option>
            <option value="Land">Land</option>
          </select>
        </div>

        {/* Min Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Price
          </label>
          <input
            type="number"
            name="minPrice"
            value={filters.minPrice}
            onChange={handleChange}
            placeholder="Min Price"
            className="input-field"
          />
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Price
          </label>
          <input
            type="number"
            name="maxPrice"
            value={filters.maxPrice}
            onChange={handleChange}
            placeholder="Max Price"
            className="input-field"
          />
        </div>

        {/* Bedrooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bedrooms
          </label>
          <select
            name="bedrooms"
            value={filters.bedrooms}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>
        </div>

        {/* Bathrooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bathrooms
          </label>
          <select
            name="bathrooms"
            value={filters.bathrooms}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </div>

        {/* Square Feet Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Square Feet
          </label>
          <input
            type="number"
            name="minSquareFeet"
            value={filters.minSquareFeet}
            onChange={handleChange}
            placeholder="Min sqft"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Square Feet
          </label>
          <input
            type="number"
            name="maxSquareFeet"
            value={filters.maxSquareFeet}
            onChange={handleChange}
            placeholder="Max sqft"
            className="input-field"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4 mt-6">
        <button
          type="button"
          onClick={handleReset}
          className="btn-secondary flex items-center space-x-2"
        >
          <FiX />
          <span>Reset</span>
        </button>
        <button
          type="submit"
          className="btn-primary flex items-center space-x-2"
        >
          <FiSearch />
          <span>Search Properties</span>
        </button>
      </div>
    </form>
  );
}

