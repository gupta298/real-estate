const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all published blogs (public) - sorted by latest
router.get('/', (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /blogs request from: ${req.get('x-request-origin') || req.get('host') || 'unknown'}`);
  
  // Log headers for debugging
  console.log(`Request headers: Accept=${req.get('accept')}, X-Requested-With=${req.get('x-requested-with')}`);
  
  // Check if client wants HTML (this should not happen with our current setup)
  if (req.get('accept') && 
      req.get('accept').includes('text/html') && 
      !req.get('accept').includes('application/json') && 
      !req.get('x-requested-with') && 
      !req.get('x-api-request')) {
    console.log('Warning: HTML request to API endpoint');
  }
  
  // Always force JSON content type for API endpoints and add CORS headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Add explicit CORS headers for blog subdomain
  const origin = req.get('origin');
  if (origin && (origin.includes('blog.blueflagindy.com') || origin.includes('onrender.com'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  }
  
  const query = `
    SELECT b.*,
      (SELECT json_agg(
        json_build_object(
          'id', img.id,
          'imageUrl', img.imageUrl,
          'thumbnailUrl', img.thumbnailUrl,
          'displayOrder', img.displayOrder,
          'caption', img.caption
        )
      )
      FROM blog_images img
      WHERE img.blogId = b.id
      ORDER BY img.displayOrder) as images,
      (SELECT json_agg(
        json_build_object(
          'id', vid.id,
          'videoUrl', vid.videoUrl,
          'thumbnailUrl', vid.thumbnailUrl,
          'displayOrder', vid.displayOrder,
          'caption', vid.caption
        )
      )
      FROM blog_videos vid
      WHERE vid.blogId = b.id
      ORDER BY vid.displayOrder) as videos
    FROM blogs b
    WHERE b.isPublished = true
    ORDER BY b.createdAt DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching blogs:', err);
      console.log('DB Error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch blogs', details: err.message });
    }

    const blogs = rows.map(row => ({
      ...row,
      images: row.images || [], // PostgreSQL returns json directly
      videos: row.videos || [], // PostgreSQL returns json directly
      // Handle both PostgreSQL boolean and SQLite integer
      isPublished: typeof row.isPublished === 'boolean' ? row.isPublished : row.isPublished === 1
    }));

    res.json({ blogs });
  });
});

// Get latest N blogs (for homepage)
router.get('/latest', (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /blogs/latest request from: ${req.get('x-request-origin') || req.get('host') || 'unknown'}`);
  
  // Set correct content type
  res.setHeader('Content-Type', 'application/json');
  
  const limit = parseInt(req.query.limit) || 5;

  const query = `
    SELECT b.*,
      (SELECT json_agg(
        json_build_object(
          'id', img.id,
          'imageUrl', img.imageUrl,
          'thumbnailUrl', img.thumbnailUrl,
          'displayOrder', img.displayOrder,
          'caption', img.caption
        )
      )
      FROM blog_images img
      WHERE img.blogId = b.id
      ORDER BY img.displayOrder) as images,
      (SELECT json_agg(
        json_build_object(
          'id', vid.id,
          'videoUrl', vid.videoUrl,
          'thumbnailUrl', vid.thumbnailUrl,
          'displayOrder', vid.displayOrder,
          'caption', vid.caption
        )
      )
      FROM blog_videos vid
      WHERE vid.blogId = b.id
      ORDER BY vid.displayOrder) as videos
    FROM blogs b
    WHERE b.isPublished = true
    ORDER BY b.createdAt DESC
    LIMIT $1
  `;

  db.all(query, [limit], (err, rows) => {
    if (err) {
      console.error('Error fetching latest blogs:', err);
      console.log('DB Error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch latest blogs', details: err.message });
    }

    const blogs = rows.map(row => ({
      ...row,
      images: row.images || [], // PostgreSQL returns json directly
      videos: row.videos || [], // PostgreSQL returns json directly
      // Handle both PostgreSQL boolean and SQLite integer
      isPublished: typeof row.isPublished === 'boolean' ? row.isPublished : row.isPublished === 1
    }));

    res.json({ blogs });
  });
});

// Get single blog (public)
router.get('/:id', (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /blogs/${req.params.id} request from: ${req.get('x-request-origin') || req.get('host') || 'unknown'}`);
  
  // Set correct content type
  res.setHeader('Content-Type', 'application/json');
  
  const blogId = req.params.id;

  const query = `
    SELECT b.*,
      (SELECT json_agg(
        json_build_object(
          'id', img.id,
          'imageUrl', img.imageUrl,
          'thumbnailUrl', img.thumbnailUrl,
          'displayOrder', img.displayOrder,
          'caption', img.caption
        )
      )
      FROM blog_images img
      WHERE img.blogId = b.id
      ORDER BY img.displayOrder) as images,
      (SELECT json_agg(
        json_build_object(
          'id', vid.id,
          'videoUrl', vid.videoUrl,
          'thumbnailUrl', vid.thumbnailUrl,
          'displayOrder', vid.displayOrder,
          'caption', vid.caption
        )
      )
      FROM blog_videos vid
      WHERE vid.blogId = b.id
      ORDER BY vid.displayOrder) as videos
    FROM blogs b
    WHERE b.id = $1 AND b.isPublished = true
  `;

  db.get(query, [blogId], (err, row) => {
    if (err) {
      console.error('Error fetching blog:', err);
      console.log('DB Error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch blog', details: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const blog = {
      ...row,
      images: row.images || [], // PostgreSQL returns json directly
      videos: row.videos || [], // PostgreSQL returns json directly
      // Handle both PostgreSQL boolean and SQLite integer
      isPublished: typeof row.isPublished === 'boolean' ? row.isPublished : row.isPublished === 1
    };

    res.json({ blog });
  });
});

module.exports = router;

