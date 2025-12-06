'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { getAdminBlogs, deleteBlog } from '@/utils/api';
import { FiPlus, FiEdit, FiTrash2, FiArrowLeft } from 'react-icons/fi';

export default function BlogsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(12);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const data = await getAdminBlogs();
      setBlogs(data.blogs || []);
    } catch (error) {
      console.error('Error loading blogs:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get blogs to display (paginated)
  const displayedBlogs = blogs.slice(0, displayCount);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && displayCount < blogs.length) {
          setDisplayCount(prev => Math.min(prev + 12, blogs.length));
        }
      },
      {
        threshold: 0.1,
        rootMargin: '200px'
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [displayCount, blogs.length]);

  const handleDelete = async (blogId) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    try {
      await deleteBlog(blogId);
      loadBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Failed to delete blog');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                <FiArrowLeft className="text-xl" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
            </div>
            <Link
              href="/admin/blogs/new"
              className="btn-primary flex items-center space-x-2"
            >
              <FiPlus />
              <span>Create New Post</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : displayedBlogs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedBlogs.map((blog) => {
                // Use thumbnail if available, otherwise fall back to first image
                const primaryMedia = blog.thumbnailUrl ? {
                  url: blog.thumbnailUrl,
                  type: blog.thumbnailType || 'image'
                } : (blog.images && blog.images.length > 0 ? {
                  url: blog.images[0].imageUrl,
                  type: 'image'
                } : null);
                
                return (
                  <div key={blog.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    {primaryMedia && (
                      <div className="relative h-48">
                        {primaryMedia.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-black">
                            <video
                              src={primaryMedia.url}
                              className="w-full h-full object-contain"
                              muted
                              loop
                              playsInline
                              autoPlay
                              preload="metadata"
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <Image
                              src={primaryMedia.url}
                              alt={blog.title}
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                        {!blog.isPublished && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <span className="text-white font-bold">DRAFT</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">
                          {formatDate(blog.createdAt)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          blog.isPublished 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {blog.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{blog.title}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {blog.excerpt || blog.content.replace(/\n/g, ' ').substring(0, 150)}...
                      </p>
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/blogs/${blog.id}/edit`}
                          className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                        >
                          <FiEdit />
                          <span>Edit</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(blog.id)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Infinite scroll trigger */}
            {displayCount < blogs.length && (
              <div ref={loadMoreRef} className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bf-blue"></div>
                <p className="text-gray-500 text-sm mt-2">Loading more posts...</p>
              </div>
            )}

            {/* Show count if all blogs are loaded */}
            {displayCount >= blogs.length && blogs.length > 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                Showing all {blogs.length} post{blogs.length !== 1 ? 's' : ''}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500 text-lg mb-4">No blog posts yet</p>
            <Link href="/admin/blogs/new" className="btn-primary inline-flex items-center space-x-2">
              <FiPlus />
              <span>Create Your First Post</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

