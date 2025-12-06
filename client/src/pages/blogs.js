'use client';

import { useState, useEffect, useRef } from 'react';
import SubdomainBlogs from '@/components/SubdomainBlogs';
import { isSubdomain } from '@/utils/subdomainRouting';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Keyboard } from 'swiper/modules';
import { getBlogs } from '@/utils/api';
import { FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

export default function BlogsPage() {
  const [isBlogSubdomain, setIsBlogSubdomain] = useState(false);
  
  useEffect(() => {
    // Check if we're on the blog subdomain
    setIsBlogSubdomain(isSubdomain('blog'));
  }, []);
  
  // If accessed via subdomain, use the simplified component
  if (isBlogSubdomain) {
    return <SubdomainBlogs />;
  }
  
  // Regular component for main site
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedBlogs, setExpandedBlogs] = useState(new Set());
  const [displayCount, setDisplayCount] = useState(12); // Initial display count
  const [lightboxImages, setLightboxImages] = useState(null); // { images: [], blogTitle: '' }
  const loadMoreRef = useRef(null);
  const lightboxSwiperRef = useRef(null);
  const videoRefs = useRef({});

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const data = await getBlogs();
      setBlogs(data.blogs || []);
    } catch (error) {
      console.error('Error loading blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (blogId) => {
    setExpandedBlogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blogId)) {
        newSet.delete(blogId);
      } else {
        newSet.add(blogId);
      }
      return newSet;
    });
  };

  // Get blogs to display (paginated)
  const displayedBlogs = blogs.slice(0, displayCount);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && displayCount < blogs.length) {
          // Load 12 more blogs
          setDisplayCount(prev => Math.min(prev + 12, blogs.length));
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
  }, [displayCount, blogs.length]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const openLightbox = (media, blogTitle, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setLightboxImages({ images: media, blogTitle });
    // Prevent scrolling when opening lightbox
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    // Pause all videos when closing
    Object.values(videoRefs.current).forEach(video => {
      if (video) {
        video.pause();
      }
    });
    videoRefs.current = {};
    setLightboxImages(null);
    // Restore scrolling when closing lightbox
    document.body.style.overflow = 'unset';
  };

  // Handle keyboard navigation and ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxImages) return;
      
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft' && lightboxSwiperRef.current) {
        e.preventDefault();
        lightboxSwiperRef.current.slidePrev();
      } else if (e.key === 'ArrowRight' && lightboxSwiperRef.current) {
        e.preventDefault();
        lightboxSwiperRef.current.slideNext();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImages]);

  // Cleanup: restore scrolling when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-bf-blue mb-4">Blog</h1>
          <p className="text-gray-600 text-lg">
            Latest news, insights, and updates from Blue Flag Realty
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bf-blue"></div>
          </div>
        ) : displayedBlogs.length > 0 ? (
          <>
            <div className="space-y-6">
              {displayedBlogs.map((blog) => {
                const isExpanded = expandedBlogs.has(blog.id);
                
                // Collect all media (images + videos) for carousel, sorted by displayOrder
                // Use thumbnail if available, otherwise use first image
                // Filter out duplicates if thumbnail matches an existing image/video
                const allMedia = [];
                const thumbnailUrl = blog.thumbnailUrl;
                
                if (thumbnailUrl) {
                  if (blog.thumbnailType === 'video') {
                    allMedia.push({
                      videoUrl: thumbnailUrl,
                      thumbnailUrl: thumbnailUrl,
                      caption: 'Thumbnail',
                      type: 'video',
                      displayOrder: -1 // Thumbnail first
                    });
                  } else {
                    allMedia.push({
                      imageUrl: thumbnailUrl,
                      thumbnailUrl: thumbnailUrl,
                      caption: 'Thumbnail',
                      type: 'image',
                      displayOrder: -1 // Thumbnail first
                    });
                  }
                }
                
                // Add images, filtering out duplicates of the thumbnail
                if (blog.images && blog.images.length > 0) {
                  const uniqueImages = blog.images.filter(img => {
                    const imgUrl = img.imageUrl || img.thumbnailUrl;
                    return !thumbnailUrl || imgUrl !== thumbnailUrl;
                  });
                  allMedia.push(...uniqueImages.map(img => ({ ...img, type: 'image' })));
                }
                
                // Add videos, filtering out duplicates of the thumbnail
                if (blog.videos && blog.videos.length > 0) {
                  const uniqueVideos = blog.videos.filter(vid => {
                    return !thumbnailUrl || vid.videoUrl !== thumbnailUrl;
                  });
                  allMedia.push(...uniqueVideos.map(vid => ({ ...vid, type: 'video' })));
                }
                
                // Sort by displayOrder
                allMedia.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
                
                return (
                  <div
                    key={blog.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    {/* Media Carousel (Images + Videos) */}
                    {allMedia.length > 0 && (
                      <div 
                        className="relative h-64 w-full cursor-pointer"
                        onClick={(e) => openLightbox(allMedia, blog.title, e)}
                      >
                        <Swiper
                          modules={[Autoplay, Pagination]}
                          spaceBetween={0}
                          slidesPerView={1}
                          autoplay={{
                            delay: 3000,
                            disableOnInteraction: true,
                            pauseOnMouseEnter: true,
                          }}
                          pagination={{
                            clickable: true,
                          }}
                          loop={allMedia.length > 1}
                          className="h-full w-full"
                          onSlideChange={() => {
                            // Prevent any scrolling when slides change
                            window.scrollTo(window.scrollX, window.scrollY);
                          }}
                        >
                          {allMedia.map((item, index) => (
                            <SwiperSlide key={item.id || index}>
                              <div className="relative h-64 w-full bg-black">
                                {item.type === 'video' ? (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <video
                                      src={item.videoUrl}
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
                                      src={item.imageUrl || item.thumbnailUrl}
                                      alt={item.caption || blog.title || `${item.type === 'video' ? 'Video' : 'Image'} ${index + 1}`}
                                      fill
                                      className="object-contain"
                                      loading="lazy"
                                    />
                                  </div>
                                )}
                              </div>
                            </SwiperSlide>
                          ))}
                        </Swiper>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6">
                      {/* Date */}
                      <p className="text-sm text-gray-500 mb-2">
                        {formatDate(blog.createdAt)}
                      </p>

                      {/* Title */}
                      <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        {blog.title}
                      </h2>

                      {/* Excerpt or preview */}
                      {blog.excerpt && !isExpanded && (
                        <p className="text-gray-700 mb-4">
                          {blog.excerpt}
                        </p>
                      )}

                      {/* Full content when expanded */}
                      {isExpanded && (
                        <div className="text-gray-700 mb-4 whitespace-pre-line leading-relaxed">
                          {blog.content}
                        </div>
                      )}

                      {/* Preview content when not expanded */}
                      {!isExpanded && !blog.excerpt && (
                        <p className="text-gray-700 mb-4 line-clamp-3">
                          {blog.content.replace(/\n/g, ' ').substring(0, 200)}...
                        </p>
                      )}

                      {/* Expand/Collapse Button */}
                      <button
                        onClick={() => toggleExpand(blog.id)}
                        className="flex items-center gap-2 text-bf-blue hover:text-bf-gold font-semibold transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <span>Read Less</span>
                            <FiChevronUp className="w-5 h-5" />
                          </>
                        ) : (
                          <>
                            <span>Read More</span>
                            <FiChevronDown className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Infinite scroll trigger */}
            {displayCount < blogs.length && (
              <div ref={loadMoreRef} className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bf-blue"></div>
                <p className="text-gray-500 text-sm mt-2">Loading more posts...</p>
              </div>
            )}

            {/* Show count if all blogs are loaded */}
            {displayCount >= blogs.length && blogs.length > 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                Showing all {blogs.length} post{blogs.length !== 1 ? 's' : ''}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500 text-lg">
              No blog posts available at this time.
            </p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxImages && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <div 
            className="relative w-full h-full max-w-7xl mx-auto px-4 py-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2"
              aria-label="Close lightbox"
            >
              <FiX className="w-6 h-6" />
            </button>

            {/* Blog Title */}
            <div className="text-center mb-4">
              <h3 className="text-white text-xl font-semibold">{lightboxImages.blogTitle}</h3>
            </div>

            {/* Full-size Image Carousel */}
            <div className="relative h-[calc(100vh-120px)] w-full">
              <Swiper
                modules={[Autoplay, Pagination, Keyboard]}
                spaceBetween={0}
                slidesPerView={1}
                autoplay={{
                  delay: 3000,
                  disableOnInteraction: true,
                  pauseOnMouseEnter: true,
                }}
                pagination={{
                  clickable: true,
                }}
                keyboard={{
                  enabled: true,
                  onlyInViewport: false,
                }}
                loop={lightboxImages.images.length > 1}
                className="h-full w-full"
                onSwiper={(swiper) => {
                  lightboxSwiperRef.current = swiper;
                }}
                onSlideChange={(swiper) => {
                  // Prevent any scrolling when slides change in lightbox
                  window.scrollTo(window.scrollX, window.scrollY);
                  
                  // Play video in current slide, pause all others
                  const currentIndex = swiper.realIndex;
                  lightboxImages.images.forEach((item, index) => {
                    const videoKey = item.id || index;
                    const videoElement = videoRefs.current[videoKey];
                    if (videoElement && item.type === 'video') {
                      if (index === currentIndex) {
                        // Play current video
                        videoElement.play().catch(() => {});
                      } else {
                        // Pause videos that are not active
                        videoElement.pause();
                      }
                    }
                  });
                }}
              >
                {lightboxImages.images.map((item, index) => {
                  const videoKey = item.id || index;
                  return (
                    <SwiperSlide key={videoKey}>
                      <div className="relative h-full w-full flex items-center justify-center">
                        {item.type === 'video' ? (
                          <video
                            ref={(el) => {
                              if (el) {
                                videoRefs.current[videoKey] = el;
                                // Auto-play when mounted if it's the first slide
                                if (index === 0) {
                                  el.play().catch(() => {});
                                }
                              }
                            }}
                            src={item.videoUrl}
                            controls
                            className="max-w-full max-h-full object-contain"
                            loop
                            muted={false}
                            playsInline
                            preload="auto"
                            onLoadedData={(e) => {
                              // Ensure video plays when loaded if it's the current slide
                              const currentIndex = lightboxSwiperRef.current?.realIndex ?? 0;
                              if (index === currentIndex) {
                                e.target.play().catch(() => {});
                              }
                            }}
                          />
                        ) : (
                          <Image
                            src={item.imageUrl || item.thumbnailUrl}
                            alt={item.caption || lightboxImages.blogTitle || `${item.type === 'video' ? 'Video' : 'Image'} ${index + 1}`}
                            fill
                            className="object-contain"
                            loading="lazy"
                          />
                        )}
                        {item.caption && (
                          <div className="absolute bottom-4 left-0 right-0 text-center">
                            <p className="text-white bg-black bg-opacity-50 px-4 py-2 rounded inline-block">
                              {item.caption}
                            </p>
                          </div>
                        )}
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

