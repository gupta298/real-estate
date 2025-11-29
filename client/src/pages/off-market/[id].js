import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { getOffMarketDealById } from '@/utils/api';
import { FiPhone, FiMail, FiBriefcase, FiHome, FiMapPin, FiArrowLeft, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function OffMarketDealDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadDeal();
    }
  }, [id]);

  const loadDeal = async () => {
    try {
      setLoading(true);
      const data = await getOffMarketDealById(id);
      setDeal(data.deal);
    } catch (error) {
      console.error('Error loading deal:', error);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard navigation for lightbox - must be before any early returns
  useEffect(() => {
    if (!isLightboxOpen || !deal?.images || deal.images.length === 0) return;

    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        setSelectedImageIndex((prev) => (prev - 1 + deal.images.length) % deal.images.length);
      } else if (e.key === 'ArrowRight') {
        setSelectedImageIndex((prev) => (prev + 1) % deal.images.length);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isLightboxOpen, deal?.images]);

  const formatContent = (content) => {
    return content.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 text-lg">Deal not found.</p>
      </div>
    );
  }

  const getPropertyTypeIcon = (type) => {
    if (type === 'home') return <FiHome className="w-5 h-5" />;
    if (type === 'business') return <FiBriefcase className="w-5 h-5" />;
    return null;
  };

  const formatPropertySubType = (subType) => {
    if (!subType) return '';
    return subType.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { label: 'Open', color: 'bg-green-500' },
      pending: { label: 'Pending', color: 'bg-yellow-500' },
      closed: { label: 'Closed', color: 'bg-gray-500' }
    };
    const config = statusConfig[status] || statusConfig.open;
    return (
      <span className={`${config.color} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
        {config.label}
      </span>
    );
  };

  const openLightbox = (index) => {
    setSelectedImageIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const nextImage = () => {
    if (deal.images && deal.images.length > 0) {
      setSelectedImageIndex((prev) => (prev + 1) % deal.images.length);
    }
  };

  const prevImage = () => {
    if (deal.images && deal.images.length > 0) {
      setSelectedImageIndex((prev) => (prev - 1 + deal.images.length) % deal.images.length);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/off-market"
          className="inline-flex items-center gap-2 text-bf-blue hover:text-bf-gold mb-6 transition duration-200"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span>Back to Off-Market Deals</span>
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Main Image */}
          {deal.images && deal.images.length > 0 && (
            <div className="relative h-96 cursor-pointer" onClick={() => openLightbox(0)}>
              <Image
                src={deal.images[0].imageUrl || deal.images[0].thumbnailUrl}
                alt={deal.title}
                fill
                className="object-cover"
              />
              {deal.isHotDeal && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  🔥 HOT DEAL
                </div>
              )}
              {deal.status && (
                <div className="absolute top-4 left-4">
                  {getStatusBadge(deal.status)}
                </div>
              )}
              {deal.images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                  {deal.images.length} Photos
                </div>
              )}
            </div>
          )}

          {/* Thumbnail Gallery */}
          {deal.images && deal.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 p-4 bg-gray-50">
              {deal.images.map((img, index) => (
                <div
                  key={index}
                  className="relative h-24 cursor-pointer hover:opacity-75 transition-opacity rounded overflow-hidden border-2 border-transparent hover:border-bf-blue"
                  onClick={() => {
                    setSelectedImageIndex(index);
                    openLightbox(index);
                  }}
                >
                  <Image
                    src={img.thumbnailUrl || img.imageUrl}
                    alt={`${deal.title} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="p-8">
            {/* Property Type, Area, and Status */}
            <div className="mb-4 flex flex-wrap items-center gap-4">
              {deal.propertyType && (
                <div className="flex items-center gap-2">
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
              {deal.area && (
                <div className="flex items-center gap-2 text-gray-600">
                  <FiMapPin className="w-4 h-4" />
                  <span className="text-sm">{deal.area}</span>
                </div>
              )}
              {deal.status && (
                <div>
                  {getStatusBadge(deal.status)}
                </div>
              )}
            </div>

            <h1 className="text-4xl font-bold text-bf-blue mb-6">{deal.title}</h1>
          
            <div className="text-gray-700 whitespace-pre-line mb-8 text-lg leading-relaxed">
              {formatContent(deal.content)}
            </div>

            {/* Contact Information */}
            {(deal.contactName || deal.contactPhone || deal.contactEmail) && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-2xl font-semibold text-bf-blue mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {deal.contactName && (
                    <div className="flex items-center space-x-2">
                      <FiBriefcase className="text-bf-blue" />
                      <span className="text-gray-700">
                        {deal.contactName}
                        {deal.contactTitle && ` - ${deal.contactTitle}`}
                      </span>
                    </div>
                  )}
                  {deal.contactPhone && (
                    <a
                      href={`tel:${deal.contactPhone}`}
                      className="flex items-center space-x-2 text-bf-blue hover:text-bf-gold transition duration-200"
                    >
                      <FiPhone />
                      <span>{deal.contactPhone}</span>
                    </a>
                  )}
                  {deal.contactEmail && (
                    <a
                      href={`mailto:${deal.contactEmail}`}
                      className="flex items-center space-x-2 text-bf-blue hover:text-bf-gold transition duration-200"
                    >
                      <FiMail />
                      <span>{deal.contactEmail}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && deal.images && deal.images.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center" onClick={closeLightbox}>
          <div className="relative max-w-7xl w-full h-full flex items-center justify-center p-4">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <FiX className="w-8 h-8" />
            </button>

            {/* Previous Button */}
            {deal.images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 p-2 rounded-full"
              >
                <FiChevronLeft className="w-8 h-8" />
              </button>
            )}

            {/* Main Image */}
            <div className="relative w-full h-full max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <Image
                src={deal.images[selectedImageIndex].imageUrl || deal.images[selectedImageIndex].thumbnailUrl}
                alt={`${deal.title} - Image ${selectedImageIndex + 1}`}
                fill
                className="object-contain"
              />
            </div>

            {/* Next Button */}
            {deal.images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 p-2 rounded-full"
              >
                <FiChevronRight className="w-8 h-8" />
              </button>
            )}

            {/* Image Counter */}
            {deal.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded">
                {selectedImageIndex + 1} / {deal.images.length}
              </div>
            )}

            {/* Thumbnail Strip */}
            {deal.images.length > 1 && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-4xl overflow-x-auto px-4">
                {deal.images.map((img, index) => (
                  <div
                    key={index}
                    className={`relative w-20 h-20 flex-shrink-0 cursor-pointer border-2 rounded overflow-hidden ${
                      index === selectedImageIndex ? 'border-white' : 'border-transparent opacity-50 hover:opacity-75'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(index);
                    }}
                  >
                    <Image
                      src={img.thumbnailUrl || img.imageUrl}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

