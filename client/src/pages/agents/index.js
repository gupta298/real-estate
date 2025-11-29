'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAgents } from '@/utils/api';
import { FiMail, FiPhone, FiUser, FiSearch } from 'react-icons/fi';

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await getAgents({ active: true });
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // Calculate broker and other agents from filtered results
  const broker = filteredAgents.find(a => a.isBroker) || filteredAgents[0];
  const otherAgents = filteredAgents.filter(a => !a.isBroker);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Team</h1>
        <p className="text-gray-600 text-lg mb-6">
          Meet our experienced real estate professionals
        </p>
        
        {/* Search Bar */}
        <div className="max-w-md mx-auto">
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
      </div>

      {/* Broker Section */}
      {broker && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Managing Broker</h2>
          <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-shrink-0">
                {broker.profileImageUrl ? (
                  <Image
                    src={broker.profileImageUrl}
                    alt={`${broker.firstName} ${broker.lastName}`}
                    width={200}
                    height={200}
                    className="rounded-lg object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    <FiUser className="text-6xl text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-grow">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  {broker.firstName} {broker.lastName}
                </h3>
                {broker.licenseNumber && (
                  <p className="text-gray-600 mb-4">License #: {broker.licenseNumber}</p>
                )}
                {broker.bio && (
                  <p className="text-gray-700 mb-4">{broker.bio}</p>
                )}
                {broker.specialties && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Specialties:</p>
                    <p className="text-gray-600">{broker.specialties}</p>
                  </div>
                )}
                {broker.yearsExperience && (
                  <p className="text-gray-600 mb-4">
                    {broker.yearsExperience} years of experience
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href={`mailto:${broker.email}`}
                    className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                  >
                    <FiMail />
                    <span>{broker.email}</span>
                  </a>
                  <a
                    href={`tel:${broker.phone}`}
                    className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                  >
                    <FiPhone />
                    <span>{broker.phone}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agents Section */}
      {otherAgents.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Agents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherAgents.map((agent) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.id}`}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
              >
                <div className="text-center">
                  {agent.profileImageUrl ? (
                    <Image
                      src={agent.profileImageUrl}
                      alt={`${agent.firstName} ${agent.lastName}`}
                      width={150}
                      height={150}
                      className="rounded-full mx-auto mb-4 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <FiUser className="text-4xl text-gray-400" />
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {agent.firstName} {agent.lastName}
                  </h3>
                  {agent.licenseNumber && (
                    <p className="text-sm text-gray-600 mb-2">License #: {agent.licenseNumber}</p>
                  )}
                  {agent.yearsExperience && (
                    <p className="text-sm text-gray-600 mb-4">
                      {agent.yearsExperience} years experience
                    </p>
                  )}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <a
                      href={`mailto:${agent.email}`}
                      className="text-primary-600 hover:text-primary-700 text-sm flex items-center justify-center space-x-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FiMail />
                      <span>Contact</span>
                    </a>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {filteredAgents.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {searchQuery ? `No agents found matching "${searchQuery}"` : 'No agents available at this time.'}
          </p>
        </div>
      )}
    </div>
  );
}

