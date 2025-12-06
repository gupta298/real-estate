import { useState, useEffect, useMemo, useRef } from 'react';
import SubdomainOffMarket from '@/components/SubdomainOffMarket';
import { isSubdomain } from '@/utils/subdomainRouting';
import Link from 'next/link';
import Image from 'next/image';
import { getOffMarketDeals } from '@/utils/api';
import { FiMapPin, FiHome, FiBriefcase, FiChevronDown, FiX } from 'react-icons/fi';

export default function OffMarketDealsPage() {
  const [isOffmarketSubdomain, setIsOffmarketSubdomain] = useState(false);
  
  useEffect(() => {
    // Check if we're on the offmarket subdomain
    setIsOffmarketSubdomain(isSubdomain('offmarket'));
  }, []);
  
  // If accessed via subdomain, use the simplified component
  if (isOffmarketSubdomain) {
    return <SubdomainOffMarket />;
  }
  
  // Regular component for main site
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState([]);
  const [selectedPropertySubTypes, setSelectedPropertySubTypes] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [isPropertyTypeOpen, setIsPropertyTypeOpen] = useState(false);
  const [isSubTypeOpen, setIsSubTypeOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(12); // Initial display count
  const loadMoreRef = useRef(null);

  useEffect(() => {
    loadDeals();
  }, []); // Only load once on mount

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(12);
  }, [selectedPropertyTypes, selectedPropertySubTypes, selectedStatuses]);

  const loadDeals = async () => {
    try {
      setLoading(true);
      // Load all deals, we'll filter client-side
      const data = await getOffMarketDeals({});
      setDeals(data.deals || []);
    } catch (error) {
      console.error('Error loading off-market deals:', error);
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
        // If property types are selected, only show sub-types for those types
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

  const removePropertyType = (type) => {
    setSelectedPropertyTypes(prev => prev.filter(t => t !== type));
  };

  const removeSubType = (subType) => {
    setSelectedPropertySubTypes(prev => prev.filter(t => t !== subType));
  };

  const removeStatus = (status) => {
    setSelectedStatuses(prev => prev.filter(s => s !== status));
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
      // Property type filter
      if (selectedPropertyTypes.length > 0 && !selectedPropertyTypes.includes(deal.propertyType)) {
        return false;
      }
      
      // Sub-type filter
      if (selectedPropertySubTypes.length > 0 && !selectedPropertySubTypes.includes(deal.propertySubType)) {
        return false;
      }
      
      // Status filter
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
          // Load 12 more deals
          setDisplayCount(prev => Math.min(prev + 12, filteredDeals.length));
        }
      },
      {
        threshold: 0.1,
        rootMargin: '200px' // Start loading before reaching the bottom
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-bf-blue mb-4">Off-Market Deals</h1>
          <p className="text-gray-600 text-lg mb-6">
            Exclusive business opportunities and properties not listed on MLS
          </p>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Property Type Dropdown */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
              <div className="relative">
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
              
              {/* Selected Property Types */}
              {selectedPropertyTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedPropertyTypes.map(type => (
                    <span
                      key={type}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-bf-blue text-white text-sm rounded-full"
                    >
                      <span className="capitalize">{type}</span>
                      <button
                        onClick={() => removePropertyType(type)}
                        className="hover:text-gray-200"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Sub-Type Dropdown */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sub-Type</label>
              <div className="relative">
                <button
                  onClick={() => setIsSubTypeOpen(!isSubTypeOpen)}
                  disabled={selectedPropertyTypes.length === 0 && availableSubTypes.length === 0}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-bf-blue transition duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                        <div className="p-2 text-gray-500 text-sm">No sub-types available</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Selected Sub-Types */}
              {selectedPropertySubTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedPropertySubTypes.map(subType => (
                    <span
                      key={subType}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-bf-gold text-white text-sm rounded-full"
                    >
                      <span>{formatPropertySubType(subType)}</span>
                      <button
                        onClick={() => removeSubType(subType)}
                        className="hover:text-gray-200"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <div className="relative">
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
              
              {/* Selected Statuses */}
              {selectedStatuses.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedStatuses.map(status => (
                    <span
                      key={status}
                      className={`inline-flex items-center gap-1 px-3 py-1 text-white text-sm rounded-full ${
                        status === 'open' ? 'bg-green-500' :
                        status === 'pending' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`}
                    >
                      <span>{formatStatus(status)}</span>
                      <button
                        onClick={() => removeStatus(status)}
                        className="hover:text-gray-200"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Clear Filters Button */}
          {(selectedPropertyTypes.length > 0 || selectedPropertySubTypes.length > 0 || selectedStatuses.length > 0) && (
            <button
              onClick={clearAllFilters}
              className="text-bf-blue hover:text-bf-gold text-sm font-semibold mb-4"
            >
              Clear All Filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bf-blue"></div>
          </div>
        ) : filteredDeals.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedDeals.map((deal) => {
              // Use thumbnail if available, otherwise fall back to first media item
              const hasThumbnail = deal.thumbnailUrl && deal.thumbnailType;
              
              return (
                <Link
                  key={deal.id}
                  href={`/off-market/${deal.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 block"
                >
                  {/* Thumbnail or Media (Image or Video) */}
                  <div className="relative h-64 w-full">
                    {hasThumbnail ? (
                      deal.thumbnailType === 'video' ? (
                        <div 
                          className="w-full h-full flex items-center justify-center bg-black"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <video
                            src={deal.thumbnailUrl}
                            className="w-full h-full object-contain"
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                            muted
                            loop
                            playsInline
                            autoPlay
                            preload="auto"
                            onCanPlay={(e) => {
                              e.target.play().catch(() => {
                                // Autoplay blocked, that's okay
                              });
                            }}
                            onError={(e) => {
                              console.error('Video load error for URL:', deal.thumbnailUrl);
                              console.error('Error code:', e.target.error?.code);
                              console.error('Error message:', e.target.error?.message);
                            }}
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <Image
                            src={deal.thumbnailUrl}
                            alt={deal.title}
                            fill
                            className="object-contain"
                            loading="lazy"
                          />
                        </div>
                      )
                    ) : (
                      (() => {
                        // Fallback to first media item
                        const mediaItems = [
                          ...(deal.images || []).map(img => ({ ...img, type: 'image' })),
                          ...(deal.videos || []).map(vid => ({ ...vid, type: 'video' }))
                        ].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
                        const primaryMedia = mediaItems[0];
                        
                        return primaryMedia ? (
                          primaryMedia.type === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center bg-black">
                              <video
                                src={primaryMedia.videoUrl}
                                className="w-full h-full object-contain"
                                style={{ maxWidth: '100%', maxHeight: '100%' }}
                                muted
                                loop
                                playsInline
                                autoPlay
                                preload="auto"
                              >
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <Image
                                src={primaryMedia.imageUrl || primaryMedia.thumbnailUrl}
                                alt={deal.title}
                                fill
                                className="object-contain"
                                loading="lazy"
                              />
                            </div>
                          )
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <FiBriefcase className="w-16 h-16 text-gray-400" />
                          </div>
                        );
                      })()
                    )}
                    {deal.isHotDeal && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        🔥 HOT
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Property Type Badge */}
                    {deal.propertyType && (
                      <div className="flex items-center gap-2 mb-3">
                        {getPropertyTypeIcon(deal.propertyType)}
                        <span className="text-sm font-semibold text-bf-blue">
                          {deal.propertyType === 'home' ? 'Home' : 'Business'}
                        </span>
                        {deal.propertySubType && (
                          <span className="text-sm text-gray-500">
                            • {formatPropertySubType(deal.propertySubType)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Title */}
                    <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {deal.title}
                    </h2>

                    {/* Area */}
                    {deal.area && (
                      <div className="flex items-center gap-2 text-gray-600 mb-4">
                        <FiMapPin className="w-4 h-4" />
                        <span className="text-sm">{deal.area}</span>
                      </div>
                    )}

                    {/* Preview Content */}
                    <p className="text-gray-700 text-sm line-clamp-3 mb-4">
                      {deal.content.replace(/\n/g, ' ').substring(0, 150)}...
                    </p>

                    {/* View Details Link */}
                    <div className="text-bf-blue font-semibold text-sm hover:underline">
                      View Details →
                    </div>
                  </div>
                </Link>
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
            <p className="text-gray-500 text-lg">
              No off-market deals match your filters.
            </p>
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
