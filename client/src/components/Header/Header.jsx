'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiMenu, FiX, FiSearch, FiHome, FiUser, FiLogOut, FiChevronDown } from 'react-icons/fi';
import SignInModal from '@/components/Auth/SignInModal';
import SignUpModal from '@/components/Auth/SignUpModal';

export default function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [isAboutDropdownOpen, setIsAboutDropdownOpen] = useState(false);
  const aboutDropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Load user from localStorage
    const loadUser = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };
    loadUser();

    // Listen for auth events
    const handleOpenSignIn = () => setShowSignIn(true);
    const handleOpenSignUp = () => setShowSignUp(true);
    const handleUserUpdated = () => loadUser(); // Reload user when profile is updated
    
    window.addEventListener('openSignIn', handleOpenSignIn);
    window.addEventListener('openSignUp', handleOpenSignUp);
    window.addEventListener('userUpdated', handleUserUpdated);

    return () => {
      window.removeEventListener('openSignIn', handleOpenSignIn);
      window.removeEventListener('openSignUp', handleOpenSignUp);
      window.removeEventListener('userUpdated', handleUserUpdated);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (aboutDropdownRef.current && !aboutDropdownRef.current.contains(event.target)) {
        setIsAboutDropdownOpen(false);
      }
    };

    if (isAboutDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAboutDropdownOpen]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="text-2xl font-extrabold text-bf-blue tracking-wider">
            BLUE FLAG REALTY INC.
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            <Link
              href="/"
              className="px-3 py-2 text-sm font-semibold text-gray-700 hover:text-bf-blue transition duration-200 rounded-md"
            >
              Home
            </Link>
            <Link
              href="/properties"
              className="px-3 py-2 text-sm font-semibold text-gray-700 hover:text-bf-blue transition duration-200 rounded-md"
            >
              Buy
            </Link>
            <Link
              href="/sell"
              className="px-3 py-2 text-sm font-semibold text-gray-700 hover:text-bf-blue transition duration-200 rounded-md"
            >
              Sell
            </Link>
            {/* About Dropdown */}
            <div className="relative" ref={aboutDropdownRef}>
              <button
                onClick={() => setIsAboutDropdownOpen(!isAboutDropdownOpen)}
                className="px-3 py-2 text-sm font-semibold text-gray-700 hover:text-bf-blue transition duration-200 rounded-md flex items-center space-x-1"
              >
                <span>About</span>
                <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isAboutDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isAboutDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    href="/about"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-bf-light hover:text-bf-blue transition duration-200"
                    onClick={() => setIsAboutDropdownOpen(false)}
                  >
                    About Us
                  </Link>
                  <Link
                    href="/contact"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-bf-light hover:text-bf-blue transition duration-200"
                    onClick={() => setIsAboutDropdownOpen(false)}
                  >
                    Contact Us
                  </Link>
                </div>
              )}
            </div>
            <Link
              href="/off-market"
              className="px-3 py-2 text-sm font-semibold text-gray-700 hover:text-bf-blue transition duration-200 rounded-md"
            >
              Off Market
            </Link>
            {user ? (
              <div className="flex items-center space-x-4">
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="text-gray-700 hover:text-primary-600 font-medium transition-colors flex items-center space-x-1"
                >
                  <FiUser />
                  <span>Profile</span>
                </Link>
                <span className="text-gray-700">Hi, {user.firstName || user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-primary-600 font-medium transition-colors flex items-center space-x-1"
                >
                  <FiLogOut />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowSignIn(true)}
                  className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowSignUp(true)}
                  className="btn-primary"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <FiX className="text-2xl" />
            ) : (
              <FiMenu className="text-2xl" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-4">
            <Link
              href="/"
              className="block text-gray-700 hover:text-primary-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/properties"
              className="block text-gray-700 hover:text-primary-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Properties
            </Link>
            <Link
              href="/sell"
              className="block text-gray-700 hover:text-primary-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Sell
            </Link>
            <Link
              href="/search"
              className="block text-gray-700 hover:text-primary-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Search
            </Link>
            <div>
              <button
                onClick={() => setIsAboutDropdownOpen(!isAboutDropdownOpen)}
                className="block w-full text-left text-gray-700 hover:text-primary-600 font-medium flex items-center justify-between"
              >
                <span>About</span>
                <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isAboutDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isAboutDropdownOpen && (
                <div className="ml-4 mt-2 space-y-2">
                  <Link
                    href="/about"
                    className="block text-gray-600 hover:text-primary-600 font-medium text-sm"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsAboutDropdownOpen(false);
                    }}
                  >
                    About Us
                  </Link>
                  <Link
                    href="/contact"
                    className="block text-gray-600 hover:text-primary-600 font-medium text-sm"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsAboutDropdownOpen(false);
                    }}
                  >
                    Contact Us
                  </Link>
                </div>
              )}
            </div>
            <Link
              href="/agents"
              className="block text-gray-700 hover:text-primary-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Agents
            </Link>
            <Link
              href="/off-market"
              className="block text-gray-700 hover:text-primary-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Off-Market
            </Link>
            {user ? (
              <div className="pt-4 border-t border-gray-200 space-y-4">
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="block text-gray-700 hover:text-primary-600 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="block text-gray-700 hover:text-primary-600 font-medium flex items-center space-x-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiUser />
                  <span>Profile</span>
                </Link>
                <span className="block text-gray-700">Hi, {user.firstName || user.email}</span>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left text-gray-700 hover:text-primary-600 font-medium flex items-center space-x-1"
                >
                  <FiLogOut />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-200 space-y-4">
                <button
                  onClick={() => {
                    setShowSignIn(true);
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left text-gray-700 hover:text-primary-600 font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setShowSignUp(true);
                    setIsMenuOpen(false);
                  }}
                  className="btn-primary w-full"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      <SignInModal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        onSuccess={handleAuthSuccess}
      />
      <SignUpModal
        isOpen={showSignUp}
        onClose={() => setShowSignUp(false)}
        onSuccess={handleAuthSuccess}
      />
    </header>
  );
}

