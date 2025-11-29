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

  useEffect(() => {
    setIsHomePage(router.pathname === '/');
  }, [router.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <TopContactBar />
      <Header />
      <main className={!isHomePage ? 'pt-20' : ''}>
        <Component {...pageProps} />
      </main>
    </div>
  );
}

