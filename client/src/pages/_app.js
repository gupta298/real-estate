'use client';

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import '@/styles/globals.css';
import '@/styles/swiper-custom.css';
import Header from '@/components/Header/Header';
import TopContactBar from '@/components/TopContactBar/TopContactBar';

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

  // Hide header and top bar in iframe for blog and off-market pages
  const hideHeader = isInIframe && (router.pathname === '/blogs' || router.pathname === '/off-market');

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

