'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { getFeaturedProperties, getOffMarketDeals, getAgents, getLatestBlogs } from '@/utils/api';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function Home() {
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [offMarketDeals, setOffMarketDeals] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingOffMarket, setLoadingOffMarket] = useState(true);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [loadingAgents, setLoadingAgents] = useState(true);

  useEffect(() => {
    loadFeaturedProperties();
    loadOffMarketDeals();
    loadBlogs();
    loadAgents();
  }, []);

  const loadFeaturedProperties = async () => {
    try {
      setLoadingFeatured(true);
      const data = await getFeaturedProperties(10);
      setFeaturedProperties(data.properties || []);
    } catch (error) {
      console.error('Error loading featured properties:', error);
    } finally {
      setLoadingFeatured(false);
    }
  };

  const loadOffMarketDeals = async () => {
    try {
      setLoadingOffMarket(true);
      const data = await getOffMarketDeals();
      setOffMarketDeals(data.deals || []);
    } catch (error) {
      console.error('Error loading off-market deals:', error);
    } finally {
      setLoadingOffMarket(false);
    }
  };

  const loadBlogs = async () => {
    try {
      setLoadingBlogs(true);
      const data = await getLatestBlogs(5);
      setBlogs(data.blogs || []);
    } catch (error) {
      console.error('Error loading blogs:', error);
    } finally {
      setLoadingBlogs(false);
    }
  };

  const loadAgents = async () => {
    try {
      setLoadingAgents(true);
      const data = await getAgents({ active: true });
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoadingAgents(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center text-center overflow-hidden shadow-xl">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source 
            src="https://cdn.chime.me/doc/fs/upload/20241018/17/38003a9c-8a13-494f-b2b7-c742dfd2b929/V20.mp4" 
            type="video/mp4" 
          />
        </video>
        <div className="absolute inset-0 bg-bf-blue opacity-50"></div>
        <div className="relative z-10 p-6 max-w-4xl">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white leading-tight mb-4 tracking-tight">
            We are here to serve all of your real estate needs!
          </h1>
          <p className="text-xl text-bf-light italic">
            Start your search for luxury properties now.
          </p>
        </div>
      </section>

      {/* Featured Listings Section */}
      <section className="py-16 bg-bf-light">
        <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0 lg:px-0 mb-10 text-center sm:text-left">
            <h2 className="text-3xl font-bold text-bf-blue mb-2 border-b-2 border-bf-gold pb-2 inline-block">
              FEATURED LISTINGS
            </h2>
            <p className="text-xl text-gray-600">
              Representing a Bespoke Collection of Austin's Finest Properties.
            </p>
          </div>

          {loadingFeatured ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bf-blue"></div>
            </div>
          ) : featuredProperties.length > 0 ? (
            <div className="swiper-container featured-swiper relative pb-12 overflow-visible">
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={24}
                slidesPerView="auto"
                centeredSlides={true}
                loop={featuredProperties.length > 3}
                autoplay={{
                  delay: 5000,
                  disableOnInteraction: false,
                }}
                navigation={{
                  nextEl: '.swiper-button-next-featured',
                  prevEl: '.swiper-button-prev-featured',
                }}
                pagination={{
                  el: '.swiper-pagination-featured',
                  clickable: true,
                }}
                breakpoints={{
                  320: {
                    slidesPerView: 1.2,
                    spaceBetween: 16,
                  },
                  768: {
                    slidesPerView: 'auto',
                    spaceBetween: 24,
                  },
                }}
                className="featured-swiper"
              >
                {featuredProperties.map((property) => {
                  const primaryImage = property.images?.[0];
                  return (
                    <SwiperSlide key={property.id} style={{ width: '85%' }} className="md:!w-[500px]">
                      <div className="bg-white rounded-xl shadow-lg transition duration-300 overflow-hidden h-full flex flex-col">
                        <div className="relative w-full h-64">
                          {primaryImage ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <Image
                                src={primaryImage.imageUrl || primaryImage.thumbnailUrl}
                                alt={property.title}
                                fill
                                className="object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400">No Image</span>
                            </div>
                          )}
                        </div>
                        <div className="p-6 flex-grow">
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">
                            {formatPrice(property.price)}
                          </h3>
                          <p className="text-gray-500 text-sm">
                            {property.bedrooms} Bed | {property.bathrooms} Bath | {property.squareFeet?.toLocaleString()} Sq Ft
                          </p>
                          <p className="mt-3 text-gray-700">
                            {property.address}, {property.city}, {property.state} {property.zipCode}
                          </p>
                          <Link 
                            href={`/properties/${property.id}`}
                            className="mt-4 inline-block text-bf-blue hover:text-bf-gold font-semibold transition duration-200"
                          >
                            View Details &rarr;
                          </Link>
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
              <div className="swiper-pagination swiper-pagination-featured mt-4"></div>
              <div className="swiper-button-prev swiper-button-prev-featured"></div>
              <div className="swiper-button-next swiper-button-next-featured"></div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No featured properties available at this time.
            </div>
          )}
        </div>
      </section>

      {/* Latest Blog Posts Section */}
      <section className="py-16 bg-bf-light border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0 lg:px-0 mb-10 text-center sm:text-left">
            <h2 className="text-3xl font-bold text-bf-blue mb-2 border-b-2 border-bf-gold pb-2 inline-block">
              LATEST BLOG POSTS
            </h2>
            <p className="text-xl text-gray-600">
              Stay updated with the latest news and insights from our team.
            </p>
          </div>

          {loadingBlogs ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bf-blue"></div>
            </div>
          ) : blogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-0">
              {blogs.map((blog) => {
                // Combine images and videos, sorted by displayOrder
                // Filter out duplicates if thumbnail matches an existing image/video
                const mediaItems = [];
                const thumbnailUrl = blog.thumbnailUrl;
                
                // Use thumbnail if available
                if (thumbnailUrl) {
                  if (blog.thumbnailType === 'video') {
                    mediaItems.push({
                      videoUrl: thumbnailUrl,
                      thumbnailUrl: thumbnailUrl,
                      type: 'video',
                      displayOrder: -1
                    });
                  } else {
                    mediaItems.push({
                      imageUrl: thumbnailUrl,
                      thumbnailUrl: thumbnailUrl,
                      type: 'image',
                      displayOrder: -1
                    });
                  }
                }
                
                // Add images, filtering out duplicates of the thumbnail
                if (blog.images && blog.images.length > 0) {
                  const uniqueImages = blog.images.filter(img => {
                    const imgUrl = img.imageUrl || img.thumbnailUrl;
                    return !thumbnailUrl || imgUrl !== thumbnailUrl;
                  });
                  mediaItems.push(...uniqueImages.map(img => ({ ...img, type: 'image' })));
                }
                
                // Add videos, filtering out duplicates of the thumbnail
                if (blog.videos && blog.videos.length > 0) {
                  const uniqueVideos = blog.videos.filter(vid => {
                    return !thumbnailUrl || vid.videoUrl !== thumbnailUrl;
                  });
                  mediaItems.push(...uniqueVideos.map(vid => ({ ...vid, type: 'video' })));
                }
                
                mediaItems.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
                const primaryMedia = mediaItems[0];
                
                return (
                  <Link
                    key={blog.id}
                    href="/blogs"
                    className="bg-white rounded-xl shadow-lg transition duration-300 overflow-hidden h-full flex flex-col hover:shadow-xl"
                  >
                    {primaryMedia && (
                      <div className="relative w-full h-48">
                        {primaryMedia.type === 'video' ? (
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
                              alt={blog.title}
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-6 flex-grow flex flex-col">
                      <p className="text-sm text-gray-500 mb-2">
                        {new Date(blog.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <h3 className="text-xl font-bold text-bf-blue mb-3 line-clamp-2">
                        {blog.title}
                      </h3>
                      <p className="text-gray-700 text-sm mb-4 line-clamp-3 flex-grow">
                        {blog.excerpt || blog.content.replace(/\n/g, ' ').substring(0, 150)}...
                      </p>
                      <span className="text-bf-blue hover:text-bf-gold font-semibold text-sm">
                        Read More →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No blog posts available at this time.
            </div>
          )}

          {blogs.length > 0 && (
            <div className="text-center mt-8 px-4 sm:px-0">
              <Link
                href="/blogs"
                className="inline-block py-3 px-8 text-white bg-bf-blue hover:bg-bf-gold transition duration-300 rounded-lg font-semibold shadow-md"
              >
                View All Blog Posts
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Off Market Listings Section */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0 lg:px-0 mb-10 text-center sm:text-left">
            <h2 className="text-3xl font-bold text-bf-blue mb-2 border-b-2 border-bf-gold pb-2 inline-block">
              OFF MARKET LISTINGS
            </h2>
            <p className="text-xl text-gray-600">
              Exclusive opportunities available through Blue Flag Realty.
            </p>
          </div>

          {loadingOffMarket ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bf-blue"></div>
            </div>
          ) : offMarketDeals.length > 0 ? (
            <div className="swiper-container off-market-swiper relative pb-12 overflow-visible">
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={24}
                slidesPerView="auto"
                centeredSlides={true}
                loop={offMarketDeals.length > 3}
                autoplay={{
                  delay: 5000,
                  disableOnInteraction: false,
                }}
                navigation={{
                  nextEl: '.swiper-button-next-off-market',
                  prevEl: '.swiper-button-prev-off-market',
                }}
                pagination={{
                  el: '.swiper-pagination-off-market',
                  clickable: true,
                }}
                breakpoints={{
                  320: {
                    slidesPerView: 1.2,
                    spaceBetween: 16,
                  },
                  768: {
                    slidesPerView: 'auto',
                    spaceBetween: 24,
                  },
                }}
                className="off-market-swiper"
              >
                {offMarketDeals.map((deal) => {
                  // Use thumbnail if available, otherwise fall back to first media item
                  const hasThumbnail = deal.thumbnailUrl && deal.thumbnailType;
                  
                  return (
                    <SwiperSlide key={deal.id} style={{ width: '85%' }} className="md:!w-[500px]">
                      <div className="bg-bf-light rounded-xl shadow-lg transition duration-300 overflow-hidden h-full flex flex-col border border-gray-100">
                        <div className="relative w-full h-64">
                          {hasThumbnail ? (
                            deal.thumbnailType === 'video' ? (
                              <div className="w-full h-full flex items-center justify-center bg-black">
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
                                />
                              </div>
                            )
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-400">No Media</span>
                                </div>
                              );
                            })()
                          )}
                          {deal.isHotDeal && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                              🔥 HOT DEAL
                            </div>
                          )}
                        </div>
                        <div className="p-6 flex-grow flex flex-col">
                          <div className="mb-4">
                            <h3 className="text-2xl font-extrabold text-bf-blue mb-1">
                              {deal.title}
                            </h3>
                            {deal.contactName && (
                              <p className="text-lg text-gray-600">{deal.contactName}</p>
                            )}
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed mb-4 border-l-4 border-bf-gold pl-3 italic flex-grow whitespace-pre-line">
                            {deal.content}
                          </p>
                          <Link
                            href={`/off-market/${deal.id}`}
                            className="block text-center py-2 px-4 text-white bg-bf-gold hover:bg-bf-blue transition duration-300 rounded font-semibold shadow"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
              <div className="swiper-pagination swiper-pagination-off-market mt-4"></div>
              <div className="swiper-button-prev swiper-button-prev-off-market"></div>
              <div className="swiper-button-next swiper-button-next-off-market"></div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No off-market deals available at this time.
            </div>
          )}
        </div>
      </section>

      {/* Work With Us / CTA Section */}
      <section className="py-20 bg-bf-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-extrabold mb-4">WORK WITH US</h2>
          <p className="text-xl max-w-3xl mx-auto mb-8">
            Reach out to an expert real estate agent today. Dive into the world of luxury real estate with guidance from our devoted team.
          </p>
          <Link 
            href="/contact"
            className="inline-block py-4 px-10 text-lg font-bold text-bf-blue bg-white rounded-full hover:bg-bf-light transition duration-300 shadow-2xl uppercase tracking-wider"
          >
            CONTACT US
          </Link>
        </div>
      </section>

      {/* Agent and Contact Section */}
      <section className="py-16 bg-white" id="contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-bf-blue mb-10">OUR AGENTS</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 bg-bf-light p-8 rounded-xl shadow-lg">
              <div className="flex items-start space-x-6 mb-6">
                <div className="rounded-full w-24 h-24 border-4 border-white shadow-md flex items-center justify-center overflow-hidden flex-shrink-0">
                  <Image
                    src="https://cdn.lofty.com/image/fs/user-info/2025115/22/w640_original_06e3a545-a433-4005-8056-5fce7a893899-jpeg.webp"
                    alt="Jasvir Singh"
                    width={96}
                    height={96}
                    className="rounded-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-bf-blue">Jasvir Singh</h3>
                  <p className="text-lg text-gray-700 font-medium">CEO/ Managing Broker | License ID: RB22001424</p>
                  <p className="text-md text-gray-500">Primary Contact</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mb-6 border-l-4 border-bf-gold pl-4 italic">
                Jasvir Singh is a visionary real estate leader who has built a thriving brokerage from the ground up.
              </p>
              <div className="space-y-2 text-gray-700">
                <p><span className="font-semibold">Phone:</span> <a href="tel:+13174991516" className="hover:text-bf-blue">+1(317) 499-1516</a></p>
                <p><span className="font-semibold">Email:</span> <a href="mailto:jsj@blueflagrealty.net" className="hover:text-bf-blue">jsj@blueflagrealty.net</a></p>
                <p><span className="font-semibold">Office:</span> 755 E Main St, Greenwood, Indiana, 46143, USA</p>
              </div>
            </div>
            <div className="bg-bf-light p-8 rounded-xl shadow-lg">
              <h4 className="text-2xl font-bold text-bf-blue mb-4">Book an Appointment</h4>
              <p className="text-gray-700 mb-6">
                Schedule a consultation with our team to discuss your real estate needs.
              </p>
              <div className="space-y-4">
                <Link 
                  href="/contact"
                  className="block w-full py-3 bg-bf-blue text-white font-bold rounded-lg hover:bg-bf-gold transition duration-300 shadow-md text-center"
                >
                  Book Appointment
                </Link>
                <Link 
                  href="tel:+13174991516"
                  className="block w-full py-3 border-2 border-bf-blue text-bf-blue font-bold rounded-lg hover:bg-bf-blue hover:text-white transition duration-300 text-center"
                >
                  Call Now
                </Link>
                <Link 
                  href="mailto:jsj@blueflagrealty.net"
                  className="block w-full py-3 border-2 border-bf-gold text-bf-gold font-bold rounded-lg hover:bg-bf-gold hover:text-white transition duration-300 text-center"
                >
                  Email Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Agents Carousel Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-bf-blue mb-10 text-center">Meet Our Team</h2>
          
          {loadingAgents ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bf-blue"></div>
            </div>
          ) : agents.length > 0 ? (
            <Swiper
              modules={[Navigation, Autoplay]}
              spaceBetween={30}
              slidesPerView={5}
              slidesPerGroup={2}
              breakpoints={{
                320: {
                  slidesPerView: 2,
                  slidesPerGroup: 2,
                },
                640: {
                  slidesPerView: 3,
                  slidesPerGroup: 2,
                },
                768: {
                  slidesPerView: 4,
                  slidesPerGroup: 2,
                },
                1024: {
                  slidesPerView: 5,
                  slidesPerGroup: 2,
                },
                1280: {
                  slidesPerView: 6,
                  slidesPerGroup: 2,
                },
              }}
              navigation
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              loop={true}
              className="agents-swiper"
            >
              {agents.map((agent) => (
                <SwiperSlide key={agent.id}>
                  <Link
                    href={`/agents/${agent.id}`}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 block"
                  >
                    <div className="relative h-64">
                      {agent.profileImageUrl ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <Image
                            src={agent.profileImageUrl}
                            alt={`${agent.firstName} ${agent.lastName}`}
                            fill
                            className="object-contain"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-2xl font-bold">
                            {agent.firstName?.[0]}{agent.lastName?.[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-bf-blue mb-1">
                        {agent.firstName} {agent.lastName}
                      </h3>
                      {agent.isBroker && (
                        <p className="text-sm text-gray-600 mb-2">Broker</p>
                      )}
                      {agent.phone && (
                        <p className="text-sm text-gray-600 mb-1">{agent.phone}</p>
                      )}
                      {agent.email && (
                        <p className="text-sm text-gray-600 truncate">{agent.email}</p>
                      )}
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No agents available at this time.</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
