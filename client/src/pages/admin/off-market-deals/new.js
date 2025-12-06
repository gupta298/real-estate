'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { createOffMarketDeal, getOffMarketDealOptions, uploadFile, uploadFiles } from '@/utils/api';
import { FiArrowLeft, FiX, FiUpload } from 'react-icons/fi';
import AutocompleteInput from '@/components/AutocompleteInput/AutocompleteInput';

export default function NewOffMarketDealPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    propertyType: '',
    propertySubType: '',
    area: '',
    status: 'open',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    contactTitle: '',
    thumbnailUrl: '',
    thumbnailType: '',
    isActive: true,
    isHotDeal: false,
    displayOrder: 0,
    images: [],
    videos: []
  });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [propertyTypeOptions, setPropertyTypeOptions] = useState([]);
  const [propertySubTypeOptions, setPropertySubTypeOptions] = useState([]);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const data = await getOffMarketDealOptions();
      setPropertyTypeOptions(data.propertyTypes || []);
      setPropertySubTypeOptions(data.propertySubTypes || []);
    } catch (error) {
      console.error('Error loading options:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    setUploading(true);
    try {
      const response = await uploadFile(file);
      const fileUrl = response.fileUrl;
      
      if (type === 'thumbnail') {
        const fileType = file.type.startsWith('video/') ? 'video' : 'image';
        setFormData(prev => ({
          ...prev,
          thumbnailUrl: fileUrl,
          thumbnailType: fileType
        }));
      } else if (type === 'image') {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, { imageUrl: fileUrl, thumbnailUrl: fileUrl }]
        }));
      } else if (type === 'video') {
        setFormData(prev => ({
          ...prev,
          videos: [...prev.videos, { videoUrl: fileUrl }]
        }));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleThumbnailSelect = (mediaItem) => {
    if (mediaItem.type === 'video') {
      setFormData(prev => ({
        ...prev,
        thumbnailUrl: mediaItem.videoUrl,
        thumbnailType: 'video'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        thumbnailUrl: mediaItem.imageUrl || mediaItem.thumbnailUrl,
        thumbnailType: 'image'
      }));
    }
  };

  const handleMultipleFilesUpload = async (files, type) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const fileArray = Array.from(files);
      const response = await uploadFiles(fileArray);
      
      if (type === 'image') {
        const newImages = response.files.map(file => ({
          imageUrl: file.fileUrl,
          thumbnailUrl: file.fileUrl
        }));
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...newImages]
        }));
      } else if (type === 'video') {
        const newVideos = response.files.map(file => ({
          videoUrl: file.fileUrl
        }));
        setFormData(prev => ({
          ...prev,
          videos: [...prev.videos, ...newVideos]
        }));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (files.length === 1) {
        handleFileUpload(files[0], 'image');
      } else {
        handleMultipleFilesUpload(files, 'image');
      }
    }
    e.target.value = ''; // Reset input
  };

  const handleVideoUpload = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (files.length === 1) {
        handleFileUpload(files[0], 'video');
      } else {
        handleMultipleFilesUpload(files, 'video');
      }
    }
    e.target.value = ''; // Reset input
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const removeVideo = (index) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createOffMarketDeal(formData);
      router.push('/admin/off-market-deals');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create deal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/admin/off-market-deals" className="text-gray-600 hover:text-gray-900">
              <FiArrowLeft className="text-xl" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create Off-Market Deal</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows="10"
              className="input-field"
              required
              placeholder="Enter the deal description. You can use emojis, line breaks, and formatting..."
            ></textarea>
            <p className="text-sm text-gray-500 mt-1">
              This is like a blog post. Use line breaks, emojis, and formatting as needed.
            </p>
          </div>

          {/* Property Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type
                </label>
                <AutocompleteInput
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  options={propertyTypeOptions}
                  placeholder="Type or select property type..."
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {propertyTypeOptions.length > 0 
                    ? `${propertyTypeOptions.length} existing ${propertyTypeOptions.length === 1 ? 'option' : 'options'} available`
                    : 'Type to create a new property type'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub-Type
                </label>
                <AutocompleteInput
                  name="propertySubType"
                  value={formData.propertySubType}
                  onChange={handleChange}
                  options={propertySubTypeOptions}
                  placeholder="Type or select sub-type..."
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {propertySubTypeOptions.length > 0 
                    ? `${propertySubTypeOptions.length} existing ${propertySubTypeOptions.length === 1 ? 'option' : 'options'} available`
                    : 'Type to create a new sub-type'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Area/Location</label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Indianapolis, IN"
                />
                <p className="text-xs text-gray-500 mt-1">Area or general location (not exact address)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Title</label>
                <input
                  type="text"
                  name="contactTitle"
                  value={formData.contactTitle}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., CEO / Broker"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer w-fit mb-4">
              <FiUpload className="text-lg" />
              <span>Upload Image(s)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
                multiple
              />
            </label>
            {formData.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={img.imageUrl}
                      alt={`Image ${index + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <FiX className="text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Videos</label>
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer w-fit mb-4">
              <FiUpload className="text-lg" />
              <span>Upload Video(s)</span>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
                disabled={uploading}
                multiple
              />
            </label>
            {formData.videos.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {formData.videos.map((vid, index) => (
                  <div key={index} className="relative">
                    <video
                      src={vid.videoUrl}
                      controls
                      className="w-full h-48 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeVideo(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <FiX className="text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">Active</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isHotDeal"
                checked={formData.isHotDeal}
                onChange={handleChange}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">🔥 Hot Deal</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
              <input
                type="number"
                name="displayOrder"
                value={formData.displayOrder}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <Link href="/admin/off-market-deals" className="btn-secondary flex-1 text-center">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || uploading}
              className="btn-primary flex-1"
            >
              {loading ? 'Creating...' : uploading ? 'Uploading...' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

