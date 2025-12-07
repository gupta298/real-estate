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
  const [uploadingVideos, setUploadingVideos] = useState([]);
  const [videoProgress, setVideoProgress] = useState({});
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

  const handleFileUpload = async (file, type, fileId = null) => {
    if (!file) return;

    setUploading(true);
    
    // Create a simulated progress update function for video uploads
    let progressInterval;
    if (type === 'video' && fileId) {
      // Start simulated progress updates
      progressInterval = setInterval(() => {
        setVideoProgress(prev => {
          // If progress is less than 90%, increment it
          if (prev[fileId] < 90) {
            return { ...prev, [fileId]: prev[fileId] + Math.floor(Math.random() * 10) };
          }
          return prev;
        });
      }, 500);
    }
    
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
        
        if (fileId) {
          // Set progress to 100% when upload is complete
          setVideoProgress(prev => ({ ...prev, [fileId]: 100 }));
          
          // Remove video from uploading list after a delay
          setTimeout(() => {
            setUploadingVideos(prev => prev.filter(video => video.id !== fileId));
            setVideoProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[fileId];
              return newProgress;
            });
          }, 1500);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload file');
      if (fileId) {
        // Mark as failed in progress
        setVideoProgress(prev => ({ ...prev, [fileId]: -1 }));
      }
    } finally {
      if (progressInterval) clearInterval(progressInterval);
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

  const handleMultipleFilesUpload = async (files, type, fileIds = []) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    
    // Create progress tracking for videos
    let progressIntervals = {};
    if (type === 'video' && fileIds.length > 0) {
      // Start simulated progress updates for each file
      fileIds.forEach((fileId, index) => {
        progressIntervals[fileId] = setInterval(() => {
          setVideoProgress(prev => {
            // If progress is less than 90%, increment it randomly
            if (prev[fileId] < 90) {
              return { ...prev, [fileId]: prev[fileId] + Math.floor(Math.random() * 8) };
            }
            return prev;
          });
        }, 600 + (index * 100)); // Stagger progress updates for visual effect
      });
    }
    
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
        
        // Set all videos to 100% when upload is complete
        if (fileIds.length > 0) {
          fileIds.forEach(fileId => {
            setVideoProgress(prev => ({ ...prev, [fileId]: 100 }));
          });
          
          // Remove videos from uploading list after a delay
          setTimeout(() => {
            setUploadingVideos(prev => prev.filter(video => !fileIds.includes(video.id)));
            setVideoProgress(prev => {
              const newProgress = { ...prev };
              fileIds.forEach(fileId => delete newProgress[fileId]);
              return newProgress;
            });
          }, 1500);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload files');
      // Mark all as failed
      if (fileIds.length > 0) {
        fileIds.forEach(fileId => {
          setVideoProgress(prev => ({ ...prev, [fileId]: -1 }));
        });
      }
    } finally {
      // Clear all progress intervals
      Object.values(progressIntervals).forEach(interval => clearInterval(interval));
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
      // Add files to uploadingVideos array to track them
      const fileArray = Array.from(files);
      const filesWithIds = fileArray.map(file => ({
        id: Math.random().toString(36).substring(2, 15),
        name: file.name,
        size: file.size,
        file
      }));
      
      setUploadingVideos(prev => [...prev, ...filesWithIds]);
      
      // Initialize progress for each file
      filesWithIds.forEach(fileInfo => {
        setVideoProgress(prev => ({
          ...prev,
          [fileInfo.id]: 0
        }));
      });
      
      if (files.length === 1) {
        handleFileUpload(files[0], 'video', filesWithIds[0].id);
      } else {
        handleMultipleFilesUpload(files, 'video', filesWithIds.map(f => f.id));
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
              <span>{uploading ? 'Uploading...' : 'Upload Video(s)'}</span>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
                disabled={uploading}
                multiple
              />
            </label>
            
            {/* Video Upload Progress Indicators */}
            {uploadingVideos.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Video Processing</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto p-3 bg-gray-50 rounded-md border border-gray-200">
                  {uploadingVideos.map((video) => {
                    const progress = videoProgress[video.id] || 0;
                    const isComplete = progress === 100;
                    const isFailed = progress === -1;
                    
                    return (
                      <div key={video.id} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="truncate max-w-xs">{video.name}</span>
                          <span className="font-medium">
                            {isFailed ? (
                              <span className="text-red-600">Failed</span>
                            ) : isComplete ? (
                              <span className="text-green-600">Complete</span>
                            ) : (
                              `${progress}%`
                            )}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${isFailed ? 'bg-red-500' : isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${isFailed ? 100 : progress}%`, transition: 'width 0.3s ease-in-out' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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

