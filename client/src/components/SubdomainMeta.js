import { useEffect } from 'react';

/**
 * Component to add metadata to subdomain pages using DOM API instead of Next.js Head
 * to avoid potential issues with the React error #418/#423
 */
export default function SubdomainMeta({ title, description }) {
  useEffect(() => {
    // Update metadata using DOM API
    if (typeof document !== 'undefined') {
      // Update title
      document.title = title;
      
      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
      }
      metaDescription.content = description;
      
      // Update og:title
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.content = title;
      
      // Update og:description
      let ogDescription = document.querySelector('meta[property="og:description"]');
      if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescription);
      }
      ogDescription.content = description;
    }
  }, [title, description]);
  
  // This component doesn't render anything visible
  return null;
}
