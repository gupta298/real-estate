'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { getAdminOffMarketDeals, deleteOffMarketDeal } from '@/utils/api';
import { FiPlus, FiEdit, FiTrash2, FiArrowLeft, FiBriefcase, FiHome, FiMapPin, FiChevronDown, FiX } from 'react-icons/fi';

export default function OffMarketDealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState([]);
  const [selectedPropertySubTypes, setSelectedPropertySubTypes] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [isPropertyTypeOpen, setIsPropertyTypeOpen] = useState(false);
  const [isSubTypeOpen, setIsSubTypeOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(12);
  const loadMoreRef = useRef(null);

  const propertyTypeRef = useRef(null);
  const subTypeRef = useRef(null);
  const statusRef = useRef(null);

  useEffect(() => {
    loadDeals();
  }, []);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(12);
  }, [selectedPropertyTypes, selectedPropertySubTypes, selectedStatuses]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (propertyTypeRef.current && !propertyTypeRef.current.contains(event.target)) {
        setIsPropertyTypeOpen(false);
      }
      if (subTypeRef.current && !subTypeRef.current.contains(event.target)) {
        setIsSubTypeOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target)) {
        setIsStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadDeals = async () => {
    try {
      setLoading(true);
      const data = await getAdminOffMarketDeals();
      setDeals(data.deals || []);
    } catch (error) {
      console.error('Error loading deals:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get unique property types from all deals
  const availablePropertyTypes = useMemo(() => {
    const types = new Set();
    deals.forEach(deal => {
      if (deal.propertyType) types.add(deal.propertyType);
    });
    return Array.from(types).sort();
  }, [deals]);

  // Get unique sub-types - show all if no property type selected, or filtered by selected types
  const availableSubTypes = useMemo(() => {
    const subTypes = new Set();
    deals.forEach(deal => {
      if (deal.propertySubType) {
        if (selectedPropertyTypes.length === 0 || selectedPropertyTypes.includes(deal.propertyType)) {
          subTypes.add(deal.propertySubType);
        }
      }
    });
    return Array.from(subTypes).sort();
  }, [deals, selectedPropertyTypes]);

  // Get unique statuses from all deals
  const availableStatuses = useMemo(() => {
    const statuses = new Set();
    deals.forEach(deal => {
      if (deal.status) statuses.add(deal.status);
    });
    return Array.from(statuses).sort();
  }, [deals]);

  const togglePropertyType = (type) => {
    setSelectedPropertyTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleSubType = (subType) => {
    setSelectedPropertySubTypes(prev => 
      prev.includes(subType) 
        ? prev.filter(t => t !== subType)
        : [...prev, subType]
    );
  };

  const toggleStatus = (status) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const clearAllFilters = () => {
    setSelectedPropertyTypes([]);
    setSelectedPropertySubTypes([]);
    setSelectedStatuses([]);
  };

  const getPropertyTypeIcon = (type) => {
    if (type === 'home') return <FiHome className="w-4 h-4" />;
    if (type === 'business') return <FiBriefcase className="w-4 h-4" />;
    return null;
  };

  const formatPropertySubType = (subType) => {
    if (!subType) return '';
    return subType.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatStatus = (status) => {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Filter deals based on selected filters
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      if (selectedPropertyTypes.length > 0 && !selectedPropertyTypes.includes(deal.propertyType)) {
        return false;
      }
      if (selectedPropertySubTypes.length > 0 && !selectedPropertySubTypes.includes(deal.propertySubType)) {
        return false;
      }
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(deal.status)) {
        return false;
      }
      return true;
    });
  }, [deals, selectedPropertyTypes, selectedPropertySubTypes, selectedStatuses]);

  // Get deals to display (paginated)
  const displayedDeals = useMemo(() => {
    return filteredDeals.slice(0, displayCount);
  }, [filteredDeals, displayCount]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && displayCount < filteredDeals.length) {
          setDisplayCount(prev => Math.min(prev + 12, filteredDeals.length));
        }
      },
      {
        threshold: 0.1,
        rootMargin: '200px'
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [displayCount, filteredDeals.length]);

  const handleDelete = async (dealId) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      await deleteOffMarketDeal(dealId);
      loadDeals();
    } catch (error) {
      console.error('Error deleting deal:', error);
      alert('Failed to delete deal');
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
              <h1 className="text-2xl font-bold text-gray-900">Off-Market Deals</h1>
            </div>
            <Link
              href="/admin/off-market-deals/new"
              className="btn-primary flex items-center space-x-2"
            >
              <FiPlus />
              <span>Create New Deal</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!loading && (
          <div className="mb-8">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Property Type Dropdown */}
              <div className="relative" ref={propertyTypeRef}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
                <button
                  onClick={() => setIsPropertyTypeOpen(!isPropertyTypeOpen)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-bf-blue transition duration-200"
                >
                  <span className="text-gray-700">
                    {selectedPropertyTypes.length === 0 
                      ? 'All Types' 
                      : `${selectedPropertyTypes.length} selected`}
                  </span>
                  <FiChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isPropertyTypeOpen ? 'transform rotate-180' : ''}`} />
                </button>
                
                {isPropertyTypeOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                      {availablePropertyTypes.map(type => (
                        <label
                          key={type}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPropertyTypes.includes(type)}
                            onChange={() => togglePropertyType(type)}
                            className="w-4 h-4 text-bf-blue border-gray-300 rounded focus:ring-bf-blue"
                          />
                          <span className="flex items-center gap-2 text-gray-700">
                            {getPropertyTypeIcon(type)}
                            <span className="capitalize">{type}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-Type Dropdown */}
              <div className="relative" ref={subTypeRef}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sub-Type</label>
                <button
                  onClick={() => setIsSubTypeOpen(!isSubTypeOpen)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-bf-blue transition duration-200"
                >
                  <span className="text-gray-700">
                    {selectedPropertySubTypes.length === 0 
                      ? 'All Sub-Types' 
                      : `${selectedPropertySubTypes.length} selected`}
                  </span>
                  <FiChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isSubTypeOpen ? 'transform rotate-180' : ''}`} />
                </button>
                
                {isSubTypeOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                      {availableSubTypes.length > 0 ? (
                        availableSubTypes.map(subType => (
                          <label
                            key={subType}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPropertySubTypes.includes(subType)}
                              onChange={() => toggleSubType(subType)}
                              className="w-4 h-4 text-bf-blue border-gray-300 rounded focus:ring-bf-blue"
                            />
                            <span className="text-gray-700">{formatPropertySubType(subType)}</span>
                          </label>
                        ))
                      ) : (
                        <div className="p-2 text-gray-500 text-sm">No sub-types available for selected types.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Dropdown */}
              <div className="relative" ref={statusRef}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <button
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-bf-blue transition duration-200"
                >
                  <span className="text-gray-700">
                    {selectedStatuses.length === 0 
                      ? 'All Statuses' 
                      : `${selectedStatuses.length} selected`}
                  </span>
                  <FiChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isStatusOpen ? 'transform rotate-180' : ''}`} />
                </button>
                
                {isStatusOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                      {availableStatuses.map(status => (
                        <label
                          key={status}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStatuses.includes(status)}
                            onChange={() => toggleStatus(status)}
                            className="w-4 h-4 text-bf-blue border-gray-300 rounded focus:ring-bf-blue"
                          />
                          <span className="text-gray-700">{formatStatus(status)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {(selectedPropertyTypes.length > 0 || selectedPropertySubTypes.length > 0 || selectedStatuses.length > 0) && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-sm font-semibold text-gray-700">Active Filters:</span>
                {selectedPropertyTypes.map(type => (
                  <span key={`filter-type-${type}`} className="inline-flex items-center gap-1 px-3 py-1 bg-bf-blue text-white text-sm rounded-full">
                    <span className="capitalize">{type}</span>
                    <button onClick={() => togglePropertyType(type)} className="text-white hover:text-gray-200">
                      <FiX className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {selectedPropertySubTypes.map(subType => (
                  <span key={`filter-subtype-${subType}`} className="inline-flex items-center gap-1 px-3 py-1 bg-bf-gold text-white text-sm rounded-full">
                    {formatPropertySubType(subType)}
                    <button onClick={() => toggleSubType(subType)} className="text-white hover:text-gray-200">
                      <FiX className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {selectedStatuses.map(status => (
                  <span key={`filter-status-${status}`} className={`inline-flex items-center gap-1 px-3 py-1 text-white text-sm rounded-full ${
                    status === 'open' ? 'bg-green-500' :
                    status === 'pending' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`}>
                    {formatStatus(status)}
                    <button onClick={() => toggleStatus(status)} className="text-white hover:text-gray-200">
                      <FiX className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <button onClick={clearAllFilters} className="ml-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 underline">
                  Clear All
                </button>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredDeals.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedDeals.map((deal) => {
              const primaryImage = deal.images?.[0];
              return (
                <div key={deal.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {primaryImage && (
                    <div className="relative h-48">
                      <Image
                        src={primaryImage.imageUrl || primaryImage.thumbnailUrl}
                        alt={deal.title}
                        fill
                        className="object-cover"
                      />
                      {deal.isHotDeal && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                          🔥 HOT DEAL
                        </div>
                      )}
                      {!deal.isActive && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white font-bold">INACTIVE</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-4">
                    {/* Property Type Badge */}
                    {deal.propertyType && (
                      <div className="flex items-center gap-2 mb-2">
                        {getPropertyTypeIcon(deal.propertyType)}
                        <span className="text-xs font-semibold text-bf-blue">
                          {deal.propertyType === 'home' ? 'Home' : 'Business'}
                        </span>
                        {deal.propertySubType && (
                          <span className="text-xs text-gray-500">
                            • {formatPropertySubType(deal.propertySubType)}
                          </span>
                        )}
                      </div>
                    )}

                    <h3 className="font-bold text-gray-900 mb-2">{deal.title}</h3>
                    
                    {/* Area */}
                    {deal.area && (
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <FiMapPin className="w-3 h-3" />
                        <span className="text-xs">{deal.area}</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    {deal.status && (
                      <div className="mb-2">
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                          deal.status === 'open' ? 'bg-green-100 text-green-800' :
                          deal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {formatStatus(deal.status)}
                        </span>
                      </div>
                    )}

                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {deal.content}
                    </p>
                    <div className="flex space-x-2">
                      <Link
                        href={`/admin/off-market-deals/${deal.id}/edit`}
                        className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                      >
                        <FiEdit />
                        <span>Edit</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(deal.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>

            {/* Infinite scroll trigger */}
            {displayCount < filteredDeals.length && (
              <div ref={loadMoreRef} className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bf-blue"></div>
                <p className="text-gray-500 text-sm mt-2">Loading more deals...</p>
              </div>
            )}

            {/* Show count if all deals are loaded */}
            {displayCount >= filteredDeals.length && filteredDeals.length > 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                Showing all {filteredDeals.length} deal{filteredDeals.length !== 1 ? 's' : ''}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <FiBriefcase className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">
              {deals.length === 0 
                ? 'No off-market deals yet'
                : 'No deals match your filters'}
            </p>
            {deals.length === 0 && (
              <Link href="/admin/off-market-deals/new" className="btn-primary inline-flex items-center space-x-2">
                <FiPlus />
                <span>Create Your First Deal</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(isPropertyTypeOpen || isSubTypeOpen || isStatusOpen) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setIsPropertyTypeOpen(false);
            setIsSubTypeOpen(false);
            setIsStatusOpen(false);
          }}
        />
      )}
    </div>
  );
}

