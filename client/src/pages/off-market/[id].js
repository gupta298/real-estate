import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { getOffMarketDealById } from '@/utils/api';
import SubdomainOffMarketDetail from '@/components/SubdomainOffMarketDetail';
import { isSubdomain } from '@/utils/subdomainRouting';
import { FiPhone, FiMail, FiBriefcase, FiHome, FiMapPin, FiArrowLeft, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function OffMarketDealDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isOffmarketSubdomain, setIsOffmarketSubdomain] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    if (id) {
      loadDeal();
    }
    
    // Check if we're on the offmarket subdomain
    setIsOffmarketSubdomain(isSubdomain('offmarket'));
    
    // Check if we're in an iframe
    setIsInIframe(window.self !== window.top);
  }, [id]);

  const loadDeal = async () => {
    try {
      setLoading(true);
      const data = await getOffMarketDealById(id);
      if (!data.deal) {
        // If deal is not found, redirect to the off-market index page
        console.log('Deal not found, redirecting to off-market index');
        router.replace('/off-market/index.simple');
        return;
      }
      setDeal(data.deal);
    } catch (error) {
      console.error('Error loading deal:', error);
      // In case of error, also redirect to the off-market index page
      router.replace('/off-market/index.simple');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to ensure image URLs are absolute with error handling
  const getImageUrl = (url) => {
    try {
      // Handle null/undefined URLs
      if (!url) return '/placeholder-property.jpg';
      
      // Handle empty strings
      if (url.trim() === '') return '/placeholder-property.jpg';
      
      // If it's already an absolute URL (starts with http:// or https://)
      if (url.match(/^https?:\/\//)) {
        return url;
      }
      
      // If it's a relative URL, append it to the correct base URL
      if (url.startsWith('/')) {
        // For subdomains, use special handling
        if (typeof window !== 'undefined' && window.location.hostname.includes('.blueflagindy.com')) {
          // Use the subdomain URL directly
          const baseUrl = window.location.origin;
          return `${baseUrl}${url}`;
        } else {
          // For static exports or other environments, use the current origin
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
          return `${baseUrl}${url}`;
        }
      }
      
      // Check if URL might be a partial path missing the leading slash
      if (!url.startsWith('/') && !url.match(/^https?:\/\//)) {
        // Add leading slash and try again
        return getImageUrl(`/${url}`);
      }
      
      // Default fallback
      return url;
    } catch (err) {
      console.error('[Image] Error processing URL:', err);
      return '/placeholder-property.jpg';
    }
  };
  
  // Helper function to ensure video URLs are absolute (same logic as images)
  const getVideoUrl = getImageUrl;
  
  // Combine images and videos into a single media array, sorted by displayOrder
  const mediaItems = deal ? [
    ...(deal.images || []).map(img => ({
      ...img,
      type: 'image',
      // Ensure both lowercase and uppercase variants exist for compatibility
      imageurl: img.imageurl || img.imageUrl,
      imageUrl: img.imageurl || img.imageUrl,
      thumbnailurl: img.thumbnailurl || img.thumbnailUrl,
      thumbnailUrl: img.thumbnailurl || img.thumbnailUrl,
      // Handle both versions of displayOrder
      displayorder: img.displayorder || img.displayOrder || 0,
      displayOrder: img.displayorder || img.displayOrder || 0
    })),
    ...(deal.videos || []).map(vid => ({
      ...vid,
      type: 'video',
      // Ensure both lowercase and uppercase variants exist for compatibility
      videourl: vid.videourl || vid.videoUrl,
      videoUrl: vid.videourl || vid.videoUrl,
      thumbnailurl: vid.thumbnailurl || vid.thumbnailUrl,
      thumbnailUrl: vid.thumbnailurl || vid.thumbnailUrl,
      // Handle both versions of displayOrder
      displayorder: vid.displayorder || vid.displayOrder || 999,
      displayOrder: vid.displayorder || vid.displayOrder || 999
    }))
  ].sort((a, b) => (a.displayOrder || a.displayorder || 0) - (b.displayOrder || b.displayorder || 0)) : [];

  // Keyboard navigation for lightbox - must be before any early returns
  useEffect(() => {
    if (!isLightboxOpen || mediaItems.length === 0) return;

    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        prevImage(); // Use the prevImage function for consistency
      } else if (e.key === 'ArrowRight') {
        nextImage(); // Use the nextImage function for consistency
      }
    };
    
    // Auto-pause videos when navigating with keyboard
    const pauseAllVideos = () => {
      const videos = document.querySelectorAll('.lightbox-media video');
      videos.forEach(video => {
        if (video && !video.paused) {
          video.pause();
        }
      });
    };

    // Add both event listeners
    window.addEventListener('keydown', handleKeyPress);
    
    // Setup a timer for auto-advance if desired (currently disabled)
    // const autoAdvanceTimer = setInterval(() => {
    //   // Only auto-advance if no video is playing
    //   const activeVideo = document.querySelector('.lightbox-media video');
    //   if (!activeVideo || activeVideo.paused) {
    //     nextImage();
    //   }
    // }, 5000); // Change image every 5 seconds
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      // clearInterval(autoAdvanceTimer);
      pauseAllVideos();
    };
  }, [isLightboxOpen, mediaItems.length]);

  const formatContent = (content) => {
    // Check if the content already has HTML tags
    if (content.includes('<p>') || content.includes('<div>')) {
      // Return content as HTML using dangerouslySetInnerHTML
      return <div dangerouslySetInnerHTML={{ __html: content }} />;
    } else {
      // Use the existing newline-to-br conversion for plain text
      return content.split('\n').map((line, i) => (
        <span key={i}>
          {line}
          {i < content.split('\n').length - 1 && <br />}
        </span>
      ));
    }
  };

  // Use the simplified component when in iframe or on subdomain
  if (isOffmarketSubdomain || isInIframe) {
    return <SubdomainOffMarketDetail id={id} />;
  }
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If no deal and still loading, show loading indicator
  // If no deal and not loading, we should be redirecting already
  if (!deal) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-500">Redirecting...</p>
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
    if (mediaItems.length > 0) {
      setSelectedImageIndex((prev) => (prev + 1) % mediaItems.length);
    }
  };

  const prevImage = () => {
    if (mediaItems.length > 0) {
      setSelectedImageIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/off-market/index.simple"
          className="inline-flex items-center gap-2 text-bf-blue hover:text-bf-gold mb-6 transition duration-200"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span>Back to Off-Market Deals</span>
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Main Media (Image or Video) */}
          {mediaItems.length > 0 && (
            <div className="relative h-96 cursor-pointer bg-black group" onClick={() => openLightbox(0)}>
              {/* Click hint overlay - only shows on hover */}
              {mediaItems[0].type !== 'video' && (
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                  <div className="text-white text-center px-4 py-2 rounded">
                    <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
                    </svg>
                    <span className="font-medium">Click to enlarge</span>
                  </div>
                </div>
              )}
              {mediaItems[0].type === 'video' ? (
                <div className="w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                  <video
                    src={getVideoUrl(mediaItems[0].videourl || mediaItems[0].videoUrl)}
                    className="w-full h-full object-contain"
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                    controls
                    preload="auto"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <img
                    src={getImageUrl(mediaItems[0].imageurl || mediaItems[0].imageUrl || mediaItems[0].thumbnailurl || mediaItems[0].thumbnailUrl)}
                    alt={deal.title}
                    className="object-contain max-w-full max-h-full"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
              )}
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
              {mediaItems.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                  {mediaItems.length} {mediaItems.length === 1 ? 'Item' : 'Items'}
                </div>
              )}
            </div>
          )}

          {/* Thumbnail Gallery with improved interaction */}
          {mediaItems.length > 1 && (
            <div className="p-4 bg-gray-50">
              {/* Gallery instruction message */}
              <div className="mb-3 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Click any image or video to view in fullscreen gallery</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {mediaItems.map((item, index) => (
                <div
                  key={item.id || index}
                  className="relative h-24 cursor-pointer hover:opacity-90 transition-all rounded overflow-hidden border-2 hover:shadow-md transform hover:scale-105"
                  style={{
                    borderColor: index === selectedImageIndex ? '#2563eb' : 'transparent',
                  }}
                  onClick={() => {
                    setSelectedImageIndex(index);
                    openLightbox(index);
                  }}
                  title={`View ${item.type === 'video' ? 'video' : 'image'} ${index + 1} in fullscreen`}
                >
                  {item.type === 'video' ? (
                    <div className="w-full h-full flex items-center justify-center bg-black">
                      <video
                        src={getVideoUrl(item.videourl || item.videoUrl)}
                        className="w-full h-full object-cover" /* Using object-cover for better thumbnail appearance */
                        muted
                        playsInline
                        preload="metadata"
                        onMouseEnter={(e) => {
                          try {
                            // Preview on hover
                            if (e.target.paused) {
                              e.target.play();
                            }
                          } catch (error) {
                            console.error('Error playing video preview:', error);
                          }
                        }}
                        onMouseLeave={(e) => {
                          try {
                            e.target.pause();
                            e.target.currentTime = 0;
                          } catch (error) {
                            console.error('Error pausing video:', error);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <img
                        src={getImageUrl(item.thumbnailurl || item.thumbnailUrl || item.imageurl || item.imageUrl)}
                        alt={`${deal.title} - ${item.type === 'video' ? 'Video' : 'Image'} ${index + 1}`}
                        className="object-cover w-full h-full" /* Using object-cover for better thumbnail appearance */
                      />
                    </div>
                  )}
                  {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <svg className="w-8 h-8 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Small number indicator */}
                  <div className="absolute top-1 right-1 bg-black bg-opacity-70 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {index + 1}
                  </div>
                </div>
                ))}
              </div>
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
      {isLightboxOpen && mediaItems.length > 0 && (
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
            {mediaItems.length > 1 && (
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

            {/* Main Media (Image or Video) */}
            <div 
              className="relative w-full h-full max-h-[90vh] flex items-center justify-center lightbox-media" 
              onClick={(e) => {
                e.stopPropagation();
                // Click on image advances to next image for easier navigation
                if (mediaItems[selectedImageIndex].type !== 'video') {
                  nextImage();
                }
              }}
            >
              {mediaItems[selectedImageIndex].type === 'video' ? (
                <div className="video-container w-full h-full flex items-center justify-center">
                  <video
                    src={getVideoUrl(mediaItems[selectedImageIndex].videourl || mediaItems[selectedImageIndex].videoUrl)}
                    controls
                    className="max-w-full max-h-[90vh] object-contain"
                    autoPlay
                    onClick={(e) => e.stopPropagation()} /* Prevent video clicks from advancing */
                    onPlay={(e) => {
                      // When a video starts playing, we want to pause any auto-advance
                      console.log('Video is now playing');
                    }}
                    onPause={(e) => {
                      // When video is paused, we could resume auto-advance if implemented
                      console.log('Video is now paused');
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : (
                <div className="image-container w-full h-full flex items-center justify-center" title="Click to advance to next image">
                  <img
                    src={getImageUrl(mediaItems[selectedImageIndex].imageurl || mediaItems[selectedImageIndex].imageUrl || mediaItems[selectedImageIndex].thumbnailurl || mediaItems[selectedImageIndex].thumbnailUrl)}
                    alt={`${deal.title} - ${mediaItems[selectedImageIndex].type === 'video' ? 'Video' : 'Image'} ${selectedImageIndex + 1}`}
                    className="object-contain cursor-pointer max-w-full max-h-[90vh]"
                  />
                </div>
              )}
            </div>

            {/* Next Button */}
            {mediaItems.length > 1 && (
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

            {/* Media Counter */}
            {mediaItems.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded">
                {selectedImageIndex + 1} / {mediaItems.length}
              </div>
            )}

            {/* Thumbnail Strip with improved visuals */}
            {mediaItems.length > 1 && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-4xl overflow-x-auto px-4 py-2 bg-black bg-opacity-30 rounded-lg">
                {mediaItems.map((item, index) => {
                  // Calculate visible class - make sure nearby thumbnails are always visible
                  const isNearby = Math.abs(index - selectedImageIndex) <= 2 || 
                                   index === 0 || 
                                   index === mediaItems.length - 1;
                  
                  return (
                    <div
                      key={item.id || index}
                      className={`relative w-20 h-20 flex-shrink-0 cursor-pointer border-2 rounded overflow-hidden transition-all duration-300 ${
                        index === selectedImageIndex 
                          ? 'border-white scale-110 z-10' 
                          : 'border-transparent opacity-50 hover:opacity-90 hover:border-gray-300'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex(index);
                      }}
                      title={`View ${item.type === 'video' ? 'video' : 'image'} ${index + 1}`}
                    >
                      {item.type === 'video' ? (
                        <>
                          <div className="w-full h-full flex items-center justify-center bg-black">
                            <video
                              src={getVideoUrl(item.videourl || item.videoUrl)}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                            />
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 pointer-events-none">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-black">
                          <Image
                            src={getImageUrl(item.thumbnailurl || item.thumbnailUrl || item.imageurl || item.imageUrl)}
                            alt={`Thumbnail ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                      )}
                      
                      {/* Add a little number indicator */}
                      <div className="absolute bottom-0 right-0 bg-black bg-opacity-60 text-white text-xs px-1 rounded-tl">
                        {index + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

