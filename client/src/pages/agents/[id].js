import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { getAgentById } from '@/utils/api';
import { FiMail, FiPhone, FiUser, FiHome } from 'react-icons/fi';

export default function AgentDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadAgent();
    }
  }, [id]);

  const loadAgent = async () => {
    try {
      setLoading(true);
      const data = await getAgentById(id);
      setAgent(data.agent);
    } catch (error) {
      console.error('Error loading agent:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 text-lg">Agent not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0">
            {agent.profileImageUrl ? (
              <Image
                src={agent.profileImageUrl}
                alt={`${agent.firstName} ${agent.lastName}`}
                width={300}
                height={300}
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="w-64 h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <FiUser className="text-8xl text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-grow">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {agent.firstName} {agent.lastName}
            </h1>
            {agent.isBroker && (
              <span className="inline-block bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                Managing Broker
              </span>
            )}
            {agent.licenseNumber && (
              <p className="text-gray-600 mb-4">License #: {agent.licenseNumber}</p>
            )}
            {agent.yearsExperience && (
              <p className="text-gray-600 mb-6">
                {agent.yearsExperience} years of real estate experience
              </p>
            )}
            {agent.bio && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">About</h2>
                <p className="text-gray-700 leading-relaxed">{agent.bio}</p>
              </div>
            )}
            {agent.specialties && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Specialties</h2>
                <p className="text-gray-700">{agent.specialties}</p>
              </div>
            )}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="mt-4 space-y-3">
                <a
                  href={`mailto:${agent.email}`}
                  className="flex items-center space-x-3 text-primary-600 hover:text-primary-700"
                >
                  <FiMail className="text-xl" />
                  <span>{agent.email}</span>
                </a>
                <a
                  href={`tel:${agent.phone}`}
                  className="flex items-center space-x-3 text-primary-600 hover:text-primary-700"
                >
                  <FiPhone className="text-xl" />
                  <span>{agent.phone}</span>
                </a>
              </div>
            </div>
            <div className="mt-6">
              <Link
                href="/properties"
                className="btn-primary inline-flex items-center space-x-2"
              >
                <FiHome />
                <span>View Listings</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

