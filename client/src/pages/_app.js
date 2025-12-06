'use client';

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import '@/styles/globals.css';
import '@/styles/swiper-custom.css';
import '@/styles/subdomain.css';
import Header from '@/components/Header/Header';
import TopContactBar from '@/components/TopContactBar/TopContactBar';
import { isSubdomain } from '@/utils/subdomainRouting';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [isHomePage, setIsHomePage] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    setIsHomePage(router.pathname === '/');
    // Detect if we're in an iframe
    setIsInIframe(window.self !== window.top);
    
    // Send height updates to parent if in iframe
    if (window.self !== window.top) {
      const sendHeight = () => {
        const height = document.documentElement.scrollHeight;
        window.parent.postMessage({ type: 'iframe-height', height }, '*');
      };
      
      // Send initial height
      sendHeight();
      
      // Send height on resize
      window.addEventListener('resize', sendHeight);
      
      // Use MutationObserver to detect content changes
      const observer = new MutationObserver(sendHeight);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });
      
      return () => {
        window.removeEventListener('resize', sendHeight);
        observer.disconnect();
      };
    }
  }, [router.pathname]);

  // Check if we're on a subdomain (offmarket or blog)
  const isOffmarketSubdomain = isSubdomain('offmarket');
  const isBlogSubdomain = isSubdomain('blog');
  const isOnSubdomain = isOffmarketSubdomain || isBlogSubdomain;
  
  // Hide header and top bar in iframe or when on subdomains
  const hideHeader = isInIframe || isOnSubdomain;

  // Different layout for subdomain access - much simpler, focused on content
  if (isOnSubdomain) {
    return (
      <div className="bg-white subdomain-view">
        <div className="subdomain-content">
          <Component {...pageProps} />
        </div>
      </div>
    );
  }

  // Regular layout for main site
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {!hideHeader && <TopContactBar />}
      {!hideHeader && <Header />}
      <main className={!isHomePage && !hideHeader ? 'pt-20' : ''}>
        <Component {...pageProps} />
      </main>
    </div>
  );
}

