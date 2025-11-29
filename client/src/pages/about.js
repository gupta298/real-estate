'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getAgents } from '@/utils/api';
import { FiSearch } from 'react-icons/fi';

export default function AboutPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(8);
  const [isHeroVisible, setIsHeroVisible] = useState(false);
  const [isWorkWithUsVisible, setIsWorkWithUsVisible] = useState(false);
  const [isSellerServicesVisible, setIsSellerServicesVisible] = useState(false);
  const heroRef = useRef(null);
  const workWithUsRef = useRef(null);
  const sellerServicesRef = useRef(null);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    loadAgents();
  }, []);

  // Reset display count when search query changes
  useEffect(() => {
    setDisplayCount(8);
  }, [searchQuery]);

  // Filter agents based on search query
  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) {
      return agents;
    }
    const query = searchQuery.toLowerCase().trim();
    return agents.filter(agent => {
      const fullName = `${agent.firstName} ${agent.lastName}`.toLowerCase();
      return fullName.includes(query);
    });
  }, [agents, searchQuery]);

  // Get agents to display (paginated when not searching, all when searching)
  const displayedAgents = useMemo(() => {
    if (searchQuery.trim()) {
      // When searching, show all matching results
      return filteredAgents;
    }
    // When not searching, show paginated results
    return filteredAgents.slice(0, displayCount);
  }, [filteredAgents, displayCount, searchQuery]);

  // Infinite scroll observer
  useEffect(() => {
    if (searchQuery.trim()) {
      // Don't use infinite scroll when searching
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && displayCount < filteredAgents.length) {
          // Load 8 more agents
          setDisplayCount(prev => Math.min(prev + 8, filteredAgents.length));
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
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
  }, [displayCount, filteredAgents.length, searchQuery]);

  useEffect(() => {
    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsHeroVisible(true);
            heroObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '0px 0px -100px 0px'
      }
    );

    const workWithUsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsWorkWithUsVisible(true);
            workWithUsObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '0px 0px -100px 0px'
      }
    );

    const sellerServicesObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsSellerServicesVisible(true);
            sellerServicesObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '0px 0px -100px 0px'
      }
    );

    const heroCurrent = heroRef.current;
    const workWithUsCurrent = workWithUsRef.current;
    const sellerServicesCurrent = sellerServicesRef.current;

    if (heroCurrent) {
      heroObserver.observe(heroCurrent);
    }
    if (workWithUsCurrent) {
      workWithUsObserver.observe(workWithUsCurrent);
    }
    if (sellerServicesCurrent) {
      sellerServicesObserver.observe(sellerServicesCurrent);
    }

    return () => {
      if (heroCurrent) {
        heroObserver.unobserve(heroCurrent);
      }
      if (workWithUsCurrent) {
        workWithUsObserver.unobserve(workWithUsCurrent);
      }
      if (sellerServicesCurrent) {
        sellerServicesObserver.unobserve(sellerServicesCurrent);
      }
    };
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await getAgents();
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-white">
      {/* Team Description Section */}
      <section className="py-20 bg-bf-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-[70px]">
            {/* Left Content */}
            <div className="w-full lg:w-[48%]">
              <div className="mb-12">
                <h2 className="text-5xl lg:text-[48px] font-extrabold text-bf-blue mb-8 tracking-[0.07em] leading-[1.5]">
                  TEAM<br />DESCRIPTION
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Our team offers expert guidance and personalized service to make buying, selling, or investing in property smooth and stress-free. With deep market knowledge and a commitment to clear communication, we focus on achieving your real estate goals efficiently and effectively.
                </p>
              </div>
              
              {/* Stats */}
              <div className="flex items-center justify-between border-t border-b border-bf-blue border-opacity-20 py-6">
                <div className="text-left">
                  <div className="text-3xl font-bold text-bf-blue mb-1 tracking-[0.07em]">45</div>
                  <div className="text-lg font-semibold text-bf-blue tracking-[0.07em]">Houses for Sale</div>
                </div>
                <div className="w-px h-[30px] bg-bf-blue opacity-20"></div>
                <div className="text-left">
                  <div className="text-3xl font-bold text-bf-blue mb-1 tracking-[0.07em]">$525,000</div>
                  <div className="text-lg font-semibold text-bf-blue tracking-[0.07em]">Average Sell Price</div>
                </div>
                <div className="w-px h-[30px] bg-bf-blue opacity-20"></div>
                <div className="text-left">
                  <div className="text-3xl font-bold text-bf-blue mb-1 tracking-[0.07em]">350+</div>
                  <div className="text-lg font-semibold text-bf-blue tracking-[0.07em]">Total Sold</div>
                </div>
              </div>
            </div>

            {/* Right Images - Collage Layout */}
            <div className="flex-1 w-full lg:w-auto relative flex flex-wrap justify-between items-start" style={{ minHeight: '684px' }}>
              {/* Large Image - Top Left */}
              <div className="relative" style={{ width: '58%', aspectRatio: '37/34' }}>
                <Image
                  src="https://cdn.chime.me/image/fs/cmsbuild/2025114/13/original_74d3fce0-daf4-492b-853c-f1fb68166bcd.jpeg"
                  alt="Team"
                  fill
                  className="object-cover"
                />
              </div>
              
              {/* Small Square Image - Top Right */}
              <div 
                className="relative" 
                style={{ 
                  width: 'calc(100% - 58% - 80px)', 
                  aspectRatio: '1',
                  margin: '40px 40px 0 40px'
                }}
              >
                <Image
                  src="https://cdn.chime.me/image/fs/cmsbuild/2025114/13/original_5c057822-a1fe-45af-a209-c7b414ecac8e.png"
                  alt="Team"
                  fill
                  className="object-cover"
                />
              </div>
              
              {/* Stats Badge - Middle */}
              <div 
                className="bg-bf-gold flex flex-col items-center justify-center"
                style={{
                  width: 'calc(100% - 62% - 50px)',
                  aspectRatio: '1',
                  margin: '40px 0 24px 50px',
                  padding: '0 10px'
                }}
              >
                <div className="text-5xl lg:text-[58px] font-bold text-white leading-none mb-2">1,100+</div>
                <div className="text-base lg:text-lg font-semibold text-white">Satisfied Clients</div>
              </div>
              
              {/* Bottom Image - Bottom Right (Absolutely Positioned) */}
              <div 
                className="absolute bottom-0 right-0 bg-bf-light"
                style={{ 
                  width: '62%', 
                  aspectRatio: '40/37',
                  paddingTop: '40px',
                  paddingLeft: '40px'
                }}
              >
                <div className="relative w-full h-full">
                  <Image
                    src="https://cdn.chime.me/image/fs/cmsbuild/2025114/13/original_07f3a3fc-552d-4f2a-8eb7-f1a578ee4e86.jpeg"
                    alt="Team"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Banner Section */}
      <section className="relative h-96 flex items-center justify-center text-left overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://cdn.lofty.com/image/fs/844767186393663/website/126629/cmsbuild/2025115_4ad1a5772cd04344-jpeg.webp)'
          }}
        ></div>
        <div className="absolute inset-0 bg-bf-blue opacity-60"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-6xl font-extrabold text-white mb-4">Blue Flag Realty Inc</h1>
          <p 
            ref={heroRef}
            className={`text-2xl text-white italic transition-all duration-1000 ease-out ${
              isHeroVisible 
                ? 'opacity-100 translate-x-0' 
                : 'opacity-0 -translate-x-full'
            }`}
          >
            We are here to serve all of your real estate needs!
          </p>
        </div>
      </section>

      {/* Combined CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Top Left: Image */}
            <div className="relative h-96 lg:h-[500px]">
              <Image
                src="https://cdn.chime.me/image/fs/cmsbuild/2025114/14/w1080_original_cd2c12bc-150e-4da3-918d-bde68a27a318-jpeg.webp"
                alt="Work With Us"
                fill
                className="object-cover"
              />
            </div>
            
            {/* Top Right: Text - WORK WITH US */}
            <div 
              ref={workWithUsRef}
              className={`bg-white flex flex-col justify-center p-8 lg:p-12 h-96 lg:h-[500px] transition-all duration-1000 ease-out ${
                isWorkWithUsVisible 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-0 translate-x-full'
              }`}
            >
              <h3 className="text-3xl font-bold text-bf-blue mb-4">WORK WITH US</h3>
              <p className="text-lg text-gray-700 mb-6">
                Reach out to an expert real estate agent today. Dive into the world of luxury real estate with guidance from our devoted team. Your dream home is within reach.
              </p>
              <Link
                href="/contact"
                className="inline-block px-6 py-3 border-2 border-bf-gold text-bf-gold font-bold hover:bg-bf-gold hover:text-white transition duration-300 rounded w-fit"
              >
                CONTACT
              </Link>
            </div>

            {/* Bottom Left: Text - SELLER SERVICES */}
            <div 
              ref={sellerServicesRef}
              className={`bg-white flex flex-col justify-center p-8 lg:p-12 h-96 lg:h-[500px] transition-all duration-1000 ease-out ${
                isSellerServicesVisible 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-0 -translate-x-full'
              }`}
            >
              <h3 className="text-3xl font-bold text-bf-blue mb-4">SELLER SERVICES</h3>
              <p className="text-lg text-gray-700 mb-6">
                We take the stress out of selling your home by providing a seamless experience from start to finish. Our team will put you in the best position to market your home and sell it for the highest possible price.
              </p>
              <Link
                href="/contact"
                className="inline-block px-6 py-3 border-2 border-bf-gold text-bf-gold font-bold hover:bg-bf-gold hover:text-white transition duration-300 rounded w-fit"
              >
                GET OUR SERVICE
              </Link>
            </div>
            
            {/* Bottom Right: Image */}
            <div className="relative h-96 lg:h-[500px]">
              <Image
                src="https://cdn.chime.me/image/fs/sitebuild/2024424/1/w1080_original_4eb40b89-fff6-45be-90da-d2879b100bd1-jpg.webp"
                alt="Seller Services"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Agent Section */}
      <section className="py-16 bg-bf-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-bf-blue mb-10 text-center">OUR AGENT</h2>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bf-blue focus:border-transparent"
              />
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bf-blue"></div>
            </div>
          ) : displayedAgents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchQuery ? `No agents found matching "${searchQuery}"` : 'No agents available at this time.'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {displayedAgents.map((agent) => (
                  <Link
                    key={agent.id}
                    href={`/agents/${agent.id}`}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300"
                  >
                    <div className="relative h-64">
                      {agent.profileImageUrl ? (
                        <Image
                          src={agent.profileImageUrl}
                          alt={agent.firstName}
                          fill
                          className="object-cover"
                          loading="lazy"
                        />
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
                        <a
                          href={`tel:${agent.phone}`}
                          className="text-sm text-bf-blue hover:text-bf-gold block"
                        >
                          {agent.phone}
                        </a>
                      )}
                      {agent.email && (
                        <a
                          href={`mailto:${agent.email}`}
                          className="text-sm text-bf-blue hover:text-bf-gold block"
                        >
                          {agent.email}
                        </a>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              
              {/* Infinite scroll sentinel - only show when not searching and more agents available */}
              {!searchQuery.trim() && displayCount < filteredAgents.length && (
                <div ref={loadMoreRef} className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bf-blue"></div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
