'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCurrentUser } from '@/utils/api';
import { FiHome, FiBriefcase, FiSettings, FiLogOut } from 'react-icons/fi';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const data = await getCurrentUser();
      if (data.user) {
        if (data.user.role !== 'admin') {
          alert('Admin access required');
          router.push('/');
          return;
        }
        setUser(data.user);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user?.firstName || user?.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <FiLogOut />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Featured Listings Management */}
          <Link
            href="/admin/featured-listings"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-primary-100 p-4 rounded-lg">
                <FiHome className="text-primary-600 text-2xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Featured Listings</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Manage which MLS listings are featured
                </p>
              </div>
            </div>
          </Link>

          {/* Off-Market Deals Management */}
          <Link
            href="/admin/off-market-deals"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-primary-100 p-4 rounded-lg">
                <FiBriefcase className="text-primary-600 text-2xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Off-Market Deals</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Create and manage off-market deals
                </p>
              </div>
            </div>
          </Link>

          {/* Seller Inquiries Management */}
          <Link
            href="/admin/seller-inquiries"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-primary-100 p-4 rounded-lg">
                <FiHome className="text-primary-600 text-2xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Seller Inquiries</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Manage property evaluation requests
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

