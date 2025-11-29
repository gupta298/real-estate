'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getSellerInquiries, updateSellerInquiry, deleteSellerInquiry, getAgents } from '@/utils/api';
import { FiArrowLeft, FiMail, FiPhone, FiMapPin, FiHome, FiDollarSign, FiEdit, FiTrash2, FiUser, FiChevronDown, FiX } from 'react-icons/fi';

export default function SellerInquiriesPage() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [inquiriesData, agentsData] = await Promise.all([
        getSellerInquiries(),
        getAgents()
      ]);
      setInquiries(inquiriesData.inquiries || []);
      setAgents(agentsData.agents || []);
    } catch (error) {
      console.error('Error loading data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredInquiries = useMemo(() => {
    if (selectedStatus === 'all') return inquiries;
    return inquiries.filter(inq => inq.status === selectedStatus);
  }, [inquiries, selectedStatus]);

  const statusCounts = useMemo(() => {
    return {
      all: inquiries.length,
      pending: inquiries.filter(i => i.status === 'pending').length,
      in_progress: inquiries.filter(i => i.status === 'in_progress').length,
      completed: inquiries.filter(i => i.status === 'completed').length
    };
  }, [inquiries]);

  const handleStatusChange = async (inquiryId, newStatus) => {
    try {
      setUpdating(true);
      await updateSellerInquiry(inquiryId, { status: newStatus });
      await loadData();
      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry({ ...selectedInquiry, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignAgent = async (inquiryId, agentId) => {
    try {
      setUpdating(true);
      await updateSellerInquiry(inquiryId, { assignedAgentId: agentId || null });
      await loadData();
      if (selectedInquiry?.id === inquiryId) {
        const agent = agents.find(a => a.id === parseInt(agentId));
        setSelectedInquiry({
          ...selectedInquiry,
          assignedAgentId: agentId ? parseInt(agentId) : null,
          agentFirstName: agent?.firstName || null,
          agentLastName: agent?.lastName || null
        });
      }
    } catch (error) {
      console.error('Error assigning agent:', error);
      alert('Failed to assign agent');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateNotes = async (inquiryId, notes) => {
    try {
      setUpdating(true);
      await updateSellerInquiry(inquiryId, { adminNotes: notes });
      await loadData();
      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry({ ...selectedInquiry, adminNotes: notes });
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      alert('Failed to update notes');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (inquiryId) => {
    if (!confirm('Are you sure you want to delete this inquiry?')) return;

    try {
      await deleteSellerInquiry(inquiryId);
      await loadData();
      if (selectedInquiry?.id === inquiryId) {
        setShowModal(false);
        setSelectedInquiry(null);
      }
    } catch (error) {
      console.error('Error deleting inquiry:', error);
      alert('Failed to delete inquiry');
    }
  };

  const openModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bf-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                <FiArrowLeft className="text-xl" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Seller Inquiries</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Status Filter Tabs */}
        <div className="mb-6 flex space-x-2 border-b border-gray-200">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'in_progress', label: 'In Progress' },
            { key: 'completed', label: 'Completed' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
                selectedStatus === tab.key
                  ? 'border-bf-blue text-bf-blue'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label} ({statusCounts[tab.key]})
            </button>
          ))}
        </div>

        {/* Inquiries List */}
        {filteredInquiries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <FiHome className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {selectedStatus === 'all' 
                ? 'No seller inquiries yet'
                : `No ${selectedStatus.replace('_', ' ')} inquiries`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredInquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => openModal(inquiry)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(inquiry.status)}`}>
                        {inquiry.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(inquiry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {inquiry.firstName} {inquiry.lastName}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <FiMapPin className="w-4 h-4" />
                        <span>{inquiry.propertyAddress}, {inquiry.city}, {inquiry.state} {inquiry.zipCode}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FiMail className="w-4 h-4" />
                        <span>{inquiry.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FiPhone className="w-4 h-4" />
                        <span>{inquiry.phone}</span>
                      </div>
                      {inquiry.propertyType && (
                        <div className="flex items-center space-x-2">
                          <FiHome className="w-4 h-4" />
                          <span>{inquiry.propertyType} • {inquiry.bedrooms || 'N/A'} bed • {inquiry.bathrooms || 'N/A'} bath</span>
                        </div>
                      )}
                      {inquiry.assignedAgentId && (
                        <div className="flex items-center space-x-2 text-bf-blue">
                          <FiUser className="w-4 h-4" />
                          <span>Assigned: {inquiry.agentFirstName} {inquiry.agentLastName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(inquiry);
                      }}
                      className="p-2 text-gray-600 hover:text-bf-blue hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(inquiry.id);
                      }}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Inquiry Details
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedInquiry(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status and Actions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      value={selectedInquiry.status}
                      onChange={(e) => handleStatusChange(selectedInquiry.id, e.target.value)}
                      disabled={updating}
                      className="input-field"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="flex-1 ml-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Assign Agent</label>
                    <select
                      value={selectedInquiry.assignedAgentId || ''}
                      onChange={(e) => handleAssignAgent(selectedInquiry.id, e.target.value)}
                      disabled={updating}
                      className="input-field"
                    >
                      <option value="">No agent assigned</option>
                      {agents.map(agent => (
                        <option key={agent.id} value={agent.id}>
                          {agent.firstName} {agent.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Notes</label>
                  <textarea
                    value={selectedInquiry.adminNotes || ''}
                    onChange={(e) => setSelectedInquiry({ ...selectedInquiry, adminNotes: e.target.value })}
                    onBlur={(e) => handleUpdateNotes(selectedInquiry.id, e.target.value)}
                    rows={3}
                    className="input-field"
                    placeholder="Add notes about this inquiry..."
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <FiUser className="w-5 h-5 text-bf-blue" />
                  <span>Contact Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">{selectedInquiry.firstName} {selectedInquiry.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <a href={`mailto:${selectedInquiry.email}`} className="font-semibold text-bf-blue hover:underline">
                      {selectedInquiry.email}
                    </a>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <a href={`tel:${selectedInquiry.phone}`} className="font-semibold text-bf-blue hover:underline">
                      {selectedInquiry.phone}
                    </a>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submitted</p>
                    <p className="font-semibold">{new Date(selectedInquiry.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Property Address */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <FiMapPin className="w-5 h-5 text-bf-blue" />
                  <span>Property Address</span>
                </h3>
                <p className="font-semibold text-lg">
                  {selectedInquiry.propertyAddress}<br />
                  {selectedInquiry.city}, {selectedInquiry.state} {selectedInquiry.zipCode}
                </p>
              </div>

              {/* Property Details */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <FiHome className="w-5 h-5 text-bf-blue" />
                  <span>Property Details</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedInquiry.propertyType && (
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-semibold">{selectedInquiry.propertyType}</p>
                    </div>
                  )}
                  {selectedInquiry.bedrooms && (
                    <div>
                      <p className="text-sm text-gray-600">Bedrooms</p>
                      <p className="font-semibold">{selectedInquiry.bedrooms}</p>
                    </div>
                  )}
                  {selectedInquiry.bathrooms && (
                    <div>
                      <p className="text-sm text-gray-600">Bathrooms</p>
                      <p className="font-semibold">{selectedInquiry.bathrooms}</p>
                    </div>
                  )}
                  {selectedInquiry.squareFeet && (
                    <div>
                      <p className="text-sm text-gray-600">Square Feet</p>
                      <p className="font-semibold">{selectedInquiry.squareFeet.toLocaleString()}</p>
                    </div>
                  )}
                  {selectedInquiry.lotSize && (
                    <div>
                      <p className="text-sm text-gray-600">Lot Size</p>
                      <p className="font-semibold">{selectedInquiry.lotSize.toLocaleString()} sq ft</p>
                    </div>
                  )}
                  {selectedInquiry.yearBuilt && (
                    <div>
                      <p className="text-sm text-gray-600">Year Built</p>
                      <p className="font-semibold">{selectedInquiry.yearBuilt}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Information */}
              {(selectedInquiry.currentValueEstimate || selectedInquiry.hasMortgage) && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <FiDollarSign className="w-5 h-5 text-bf-blue" />
                    <span>Financial Information</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedInquiry.currentValueEstimate && (
                      <div>
                        <p className="text-sm text-gray-600">Estimated Value</p>
                        <p className="font-semibold text-lg">{formatCurrency(selectedInquiry.currentValueEstimate)}</p>
                      </div>
                    )}
                    {selectedInquiry.hasMortgage && (
                      <div>
                        <p className="text-sm text-gray-600">Mortgage Balance</p>
                        <p className="font-semibold text-lg">
                          {selectedInquiry.mortgageBalance ? formatCurrency(selectedInquiry.mortgageBalance) : 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Selling Information */}
              {(selectedInquiry.reasonForSelling || selectedInquiry.timeline) && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Selling Information</h3>
                  {selectedInquiry.reasonForSelling && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-1">Reason for Selling</p>
                      <p className="font-semibold">{selectedInquiry.reasonForSelling}</p>
                    </div>
                  )}
                  {selectedInquiry.timeline && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Timeline</p>
                      <p className="font-semibold">{selectedInquiry.timeline}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Property Condition */}
              {selectedInquiry.needsRepairs && selectedInquiry.repairDescription && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Property Condition</h3>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Repairs Needed</p>
                    <p className="font-semibold">{selectedInquiry.repairDescription}</p>
                  </div>
                </div>
              )}

              {/* Additional Information */}
              {selectedInquiry.additionalInfo && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Additional Information</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedInquiry.additionalInfo}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

