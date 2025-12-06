'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { createBlog, uploadFile, uploadFiles } from '@/utils/api';
import { FiArrowLeft, FiX, FiUpload } from 'react-icons/fi';

export default function NewBlogPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    thumbnailUrl: '',
    thumbnailType: '',
    isPublished: true,
    images: [],
    videos: []
  });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        const isVideo = file.type.startsWith('video/');
        setFormData(prev => ({
          ...prev,
          thumbnailUrl: fileUrl,
          thumbnailType: isVideo ? 'video' : 'image'
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

  const handleThumbnailUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file, 'thumbnail');
    }
    e.target.value = ''; // Reset input
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
      await createBlog(formData);
      router.push('/admin/blogs');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create blog post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/admin/blogs" className="text-gray-600 hover:text-gray-900">
              <FiArrowLeft className="text-xl" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create Blog Post</h1>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt</label>
            <textarea
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              rows="3"
              className="input-field"
              placeholder="Short summary or preview text (optional)"
            ></textarea>
            <p className="text-sm text-gray-500 mt-1">
              A brief summary that will be shown on the blog listing page
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows="15"
              className="input-field"
              required
              placeholder="Write your blog post content here. You can use line breaks, emojis, and formatting..."
            ></textarea>
            <p className="text-sm text-gray-500 mt-1">
              Full blog post content. Line breaks will be preserved.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail (Image or Video)</label>
            <p className="text-xs text-gray-500 mb-2">This thumbnail will be shown on the blog listing page and homepage. Can be an image or video.</p>
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer">
                <FiUpload className="text-lg" />
                <span>Upload Thumbnail</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleThumbnailUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              {formData.thumbnailUrl && (
                <div className="relative w-32 h-24">
                  {formData.thumbnailType === 'video' ? (
                    <video
                      src={formData.thumbnailUrl}
                      className="w-full h-full object-contain rounded"
                      muted
                      loop
                      playsInline
                      autoPlay
                    />
                  ) : (
                    <img
                      src={formData.thumbnailUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-contain rounded"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, thumbnailUrl: '', thumbnailType: '' }))}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                  >
                    <FiX className="text-xs" />
                  </button>
                </div>
              )}
            </div>
            {/* Option to select from existing media */}
            {(formData.images.length > 0 || formData.videos.length > 0) && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Or select from existing images/videos:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.images.map((img, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleThumbnailSelect({ ...img, type: 'image' })}
                      className={`relative w-16 h-16 rounded overflow-hidden border-2 ${
                        formData.thumbnailUrl === (img.imageUrl || img.thumbnailUrl) && formData.thumbnailType === 'image'
                          ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={img.imageUrl || img.thumbnailUrl}
                        alt={`Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                  {formData.videos.map((vid, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleThumbnailSelect({ ...vid, type: 'video' })}
                      className={`relative w-16 h-16 rounded overflow-hidden border-2 ${
                        formData.thumbnailUrl === vid.videoUrl && formData.thumbnailType === 'video'
                          ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <video
                        src={vid.videoUrl}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Images</label>
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

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">Publish immediately</label>
          </div>

          <div className="flex space-x-4 pt-4">
            <Link href="/admin/blogs" className="btn-secondary flex-1 text-center">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || uploading}
              className="btn-primary flex-1"
            >
              {loading ? 'Creating...' : uploading ? 'Uploading...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

