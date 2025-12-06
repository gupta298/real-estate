import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getOffMarketDealById } from '@/utils/api';
import SubdomainMeta from './SubdomainMeta';
import { isSubdomain } from '@/utils/subdomainRouting';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

/**
 * Simplified Off-Market Deal Detail component for iframe embedding
 */
export default function SubdomainOffMarketDetail({ id }) {
  const router = useRouter();
  const dealId = id || router.query.id;
  
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    // Detect if we're in an iframe
    setIsInIframe(window.self !== window.top);
    
    if (dealId) {
      loadDeal(dealId);
    }
  }, [dealId]);

  const loadDeal = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOffMarketDealById(id);
      setDeal(data.deal || null);
    } catch (error) {
      console.error('Error loading off-market deal:', error);
      setError('Failed to load deal details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Format date if available
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleBackClick = () => {
    if (isInIframe) {
      // In iframe, use client-side routing
      router.push('/off-market/index.simple');
      
      // Also notify the parent frame that we're navigating back, in case they need to handle it
      try {
        window.parent.postMessage({ type: 'navigate-back', destination: '/off-market/index.simple' }, '*');
      } catch (e) {
        console.log('Could not send message to parent frame');
      }
    } else if (isSubdomain('offmarket')) {
      // On subdomain, navigate to the subdomain root
      window.location.href = '/index.simple';
    } else {
      // Regular navigation
      window.location.href = '/off-market/index.simple';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bf-blue"></div>
        <p className="mt-4 text-gray-600">Loading deal details...</p>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-red-500 text-lg">{error || 'Deal not found'}</p>
        <button
          onClick={handleBackClick}
          className="mt-4 inline-block bg-bf-blue hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        >
          Back to Off-Market Deals
        </button>
      </div>
    );
  }

  // Combine images and videos for the gallery
  const mediaItems = [
    ...(deal.images || []).map(img => ({ ...img, type: 'image', url: img.imageUrl, displayOrder: img.displayOrder || 0 })),
    ...(deal.videos || []).map(vid => ({ ...vid, type: 'video', url: vid.videoUrl, displayOrder: vid.displayOrder || 999 }))
  ].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="bg-white">
      <SubdomainMeta
        title={`${deal.title} | Off-Market Deal | Blue Flag Indy`}
        description={deal.content?.substring(0, 160) || 'Exclusive off-market deal from Blue Flag Indy'}
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={handleBackClick}
          className="inline-flex items-center mb-6 text-bf-blue hover:text-blue-700"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Off-Market Deals
        </button>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{deal.title}</h1>
        
        {/* Property type badge */}
        {deal.propertyType && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-block bg-bf-blue text-white px-3 py-1 rounded-full text-sm font-medium capitalize">
              {deal.propertyType}
            </span>
            {deal.propertySubType && (
              <span className="inline-block bg-bf-gold text-white px-3 py-1 rounded-full text-sm font-medium capitalize">
                {deal.propertySubType}
              </span>
            )}
            {deal.status && (
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-white capitalize ${
                deal.status === 'open' ? 'bg-green-500' : 
                deal.status === 'pending' ? 'bg-yellow-500' : 
                'bg-gray-500'
              }`}>
                {deal.status}
              </span>
            )}
            {deal.isHotDeal && (
              <span className="inline-block bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                🔥 HOT DEAL
              </span>
            )}
          </div>
        )}
        
        {/* Location */}
        {deal.area && (
          <p className="text-gray-600 mb-6">
            <span className="font-medium">Location:</span> {deal.area}
          </p>
        )}

        {/* Media Gallery */}
        {mediaItems.length > 0 && (
          <div className="mb-8">
            <Swiper
              spaceBetween={10}
              slidesPerView={1}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              navigation={true}
              modules={[Pagination, Navigation]}
              className="rounded-lg overflow-hidden"
              style={{ height: '400px' }}
            >
              {mediaItems.map((item, index) => (
                <SwiperSlide key={`${item.type}-${index}`}>
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    {item.type === 'video' ? (
                      <video 
                        src={item.url}
                        className="w-full h-full object-contain"
                        controls
                        playsInline
                        preload="metadata"
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <img 
                        src={item.url}
                        alt={`Image ${index + 1} for ${deal.title}`}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}

        {/* Content */}
        <div className="prose max-w-none mb-8">
          {deal.content?.split('\n').map((paragraph, index) => (
            paragraph ? <p key={index} className="mb-4">{paragraph}</p> : <br key={index} />
          ))}
        </div>

        {/* Contact section */}
        <div className="bg-gray-50 p-6 rounded-lg mt-8">
          <h2 className="text-2xl font-bold text-bf-blue mb-4">Interested in this opportunity?</h2>
          <p className="text-gray-700 mb-4">
            Contact us for more details about this off-market deal. Our team is ready to assist you with any questions.
          </p>
          <a 
            href="tel:317-218-1650"
            className="inline-block bg-bf-blue hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded mr-4"
          >
            Call (317) 218-1650
          </a>
          <a 
            href="mailto:info@blueflagindy.com?subject=Off-Market Deal Inquiry: {deal.title}"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-bf-gold hover:bg-yellow-600 text-white font-semibold py-2 px-6 rounded"
          >
            Email Us
          </a>
        </div>
      </div>
    </div>
  );
}
