import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-bf-light py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 border-b border-gray-700 pb-8 mb-8">
          <div>
            <h3 className="text-2xl font-extrabold text-bf-gold mb-4">Blue Flag Realty Inc.</h3>
            <address className="not-italic space-y-2 text-gray-400">
              <p>755 E Main St, Greenwood, Indiana 46143</p>
              <p>Office: <a href="tel:+13174991516" className="hover:text-white">+1(317) 499-1516</a></p>
              <p>Email: <a href="mailto:office@blueflagindy.com" className="hover:text-white">office@blueflagindy.com</a></p>
            </address>
          </div>
          <div>
            <h4 className="text-xl font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li><Link href="/properties" className="hover:text-white">Buy Listings</Link></li>
              <li><Link href="/about" className="hover:text-white">Sell & Valuation</Link></li>
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xl font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/properties" className="hover:text-white">Property Listings</Link></li>
              <li><Link href="/off-market" className="hover:text-white">Off Market Deals</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xl font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="#" className="hover:text-white">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-white">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="text-xs text-gray-500 space-y-3">
          <p><strong>IDX Disclaimer:</strong> IDX information is provided exclusively for consumers' personal, non-commercial use.</p>
          <p>Powered by Lofty Inc. Copyright {new Date().getFullYear()}. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
