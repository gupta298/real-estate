'use client';

export default function TopContactBar() {
  return (
    <div className="bg-bf-blue text-white py-2 text-sm hidden sm:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Social Icons */}
        <div className="flex space-x-4">
          {/* Facebook */}
          <a 
            href="https://www.facebook.com/Blue-Flag-Realty---Indiana-112547338173813" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-bf-gold transition duration-200"
            aria-label="facebook"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0H5a5 5 0 00-5 5v14a5 5 0 005 5h14a5 5 0 005-5V5a5 5 0 00-5-5zm-2 7h-2.34c-.58 0-.66.57-.66 1.32v1.68h3l-.33 3h-2.67v8h-3v-8h-2V13h2v-3c0-1.74 1.13-3 3.43-3H17V7z"/>
            </svg>
          </a>
          {/* Zillow */}
          <a 
            href="https://www.zillow.com/profile/Jesse%20Jasvir%20Singh" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-bf-gold transition duration-200"
            aria-label="zillow"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 7.16c.35.35.35.916 0 1.266l-3.5 3.5c-.35.35-.916.35-1.266 0l-3.5-3.5c-.35-.35-.35-.916 0-1.266.35-.35.916-.35 1.266 0L12 9.734l2.302-2.574c.35-.35.916-.35 1.266 0z"/>
            </svg>
          </a>
          {/* Instagram */}
          <a 
            href="https://www.instagram.com/jsjrealtor715" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-bf-gold transition duration-200"
            aria-label="instagram"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.4.07 2.37.28 3.19.6 1.05.41 1.77 1.12 2.17 2.17.32.82.53 1.79.6 3.19.06 1.27.07 1.64.07 4.85s-.01 3.58-.07 4.85c-.07 1.4-.28 2.37-.6 3.19-.41 1.05-1.12 1.77-2.17 2.17-.82.32-1.79.53-3.19.6-1.27.06-1.64.07-4.85.07zm0 1.9c-3.11 0-3.48.01-4.75.07-1.35.06-2.19.27-2.73.48-.68.27-1.16.63-1.66 1.13-.5.5-.86.98-1.13 1.66-.21.54-.42 1.38-.48 2.73-.06 1.27-.07 1.64-.07 4.75s.01 3.48.07 4.75c.06 1.35.27 2.19.48 2.73.27.68.63 1.16 1.13 1.66.5.5.98.86 1.66 1.13.54.21 1.38.42 2.73.48 1.27.06 1.64.07 4.75.07s3.48-.01 4.75-.07c1.35-.06 2.19-.27 2.73-.48.68-.27 1.16-.63 1.66-1.13.5-.5.86-.98 1.13-1.66.21-.54.42-1.38.48-2.73.06-1.27.07-1.64.07-4.75s-.01-3.48-.07-4.75c-.06-1.35-.27-2.19-.48-2.73-.27-.68-.63-1.16-1.13-1.66-.5-.5-.98-.86-1.66-1.13-.54-.21-1.38-.42-2.73-.48-1.27-.06-1.64-.07-4.75-.07zM12 17.5c-2.47 0-4.5-2.03-4.5-4.5s2.03-4.5 4.5-4.5 4.5 2.03 4.5 4.5-2.03 4.5-4.5 4.5zm0 1.9c-1.44 0-2.6 1.16-2.6 2.6s1.16 2.6 2.6 2.6 2.6-1.16 2.6-2.6-1.16-2.6-2.6-2.6zm6.2-.87c-.4 0-.72.32-.72.72s.32.72.72.72.72-.32.72-.72-.32-.72-.72-.72z"/>
            </svg>
          </a>
          {/* YouTube */}
          <a 
            href="https://www.youtube.com/channel/UCjUHAlxW3el4blbWH2AreAQ" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-bf-gold transition duration-200"
            aria-label="youtube"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21.54 6.649c-.21-1.29-.86-2.34-2.1-2.74-1.1-.41-3.55-.51-6.44-.51s-5.34.1-6.44.51c-1.24.4-1.89 1.45-2.1 2.74C3 8 3 12 3 12s0 4 .54 5.35c.21 1.29.86 2.34 2.1 2.74 1.1.41 3.55.51 6.44.51s5.34-.1 6.44-.51c1.24-.4 1.89-1.45 2.1-2.74C21 16 21 12 21 12s0-4-.54-5.35zM10 16V8l6 4-6 4z"/>
            </svg>
          </a>
          {/* Google Maps */}
          <a 
            href="https://maps.google.com/maps?cid=5607507532447203386" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-bf-gold transition duration-200"
            aria-label="google+"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </a>
          {/* WhatsApp */}
          <a 
            href="https://blueflagindy.com/3174991516" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-bf-gold transition duration-200"
            aria-label="whatsapp"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.039 2.01c-5.518 0-9.981 4.463-9.981 9.981 0 1.637.4 3.203 1.168 4.593l-1.26 4.704 4.81-1.238c1.33.725 2.83 1.117 4.73 1.117h.001c5.518 0 9.981-4.463 9.981-9.981 0-2.678-1.042-5.2-2.906-7.065-1.865-1.864-4.387-2.906-7.065-2.906zM17.51 15.69c-.1.25-.52.48-.96.65-.4.16-.83.25-1.27.25-.43 0-.87-.09-1.28-.25s-.77-.41-1.02-.78c-.24-.37-.77-1.11-1.12-1.78-.35-.67-.2-1.19-.11-1.43.07-.2.25-.33.4-.49.15-.16.33-.4.49-.57.16-.17.2-.3.33-.5.14-.2.07-.37-.03-.54-.1-.18-.62-1.49-.86-2.03-.24-.54-.48-.46-.62-.48-.1-.01-.22-.01-.34-.01-.12 0-.32.04-.49.21-.17.17-.67.65-.67 1.58 0 .93.69 1.83.78 1.95.09.12 1.37 2.1 3.32 2.92 1.95.82 1.95 1.35 2.18 1.47.23.12.38.1.52-.08.15-.18.62-.8.78-1.07.16-.27.3-.46.46-.57.17-.11.33-.1.5.01.17.11 1.05.54 1.25.65.2.11.33.16.48.24.15.08.38.16.43.32s.06.45-.14.89z"/>
            </svg>
          </a>
        </div>
        
        {/* Contact Info */}
        <div className="flex space-x-6">
          <a href="tel:+13174991516" className="hover:text-bf-gold transition duration-200">+1(317) 499-1516</a>
          <a href="mailto:jsj@blueflagrealty.net" className="hover:text-bf-gold transition duration-200">jsj@blueflagrealty.net</a>
        </div>
      </div>
    </div>
  );
}

