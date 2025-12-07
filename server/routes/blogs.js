const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Diagnostic route to analyze performance issues
router.get('/diagnostic', async (req, res) => {
  console.log('🔍 Running diagnostic checks for blog API');
  
  const diagnosticResults = {
    tests: [],
    issues: []
  };
  
  const addTest = (name, success, duration, details = null) => {
    diagnosticResults.tests.push({ name, success, duration, details });
    if (!success) {
      diagnosticResults.issues.push({ name, details });
    }
    console.log(`${success ? '✅' : '❌'} ${name}: ${duration}ms`);
  };

  try {
    // Test 1: Basic DB connection
    const startConnection = Date.now();
    let client;
    try {
      client = await db.pool.connect();
      const connectionTime = Date.now() - startConnection;
      addTest('Database connection', true, connectionTime);
    } catch (err) {
      const connectionTime = Date.now() - startConnection;
      addTest('Database connection', false, connectionTime, err.message);
      return res.json(diagnosticResults);
    }
    
    // Test 2: Simple query
    try {
      const startSimple = Date.now();
      await client.query('SELECT 1');
      const simpleTime = Date.now() - startSimple;
      addTest('Simple query', true, simpleTime);
    } catch (err) {
      addTest('Simple query', false, Date.now() - startSimple, err.message);
    }
    
    // Test 3: Check blogs table exists
    try {
      const startTableCheck = Date.now();
      const tableResult = await client.query(`SELECT to_regclass('public.blogs') IS NOT NULL as exists`);
      const tableExists = tableResult.rows[0].exists;
      const tableTime = Date.now() - startTableCheck;
      addTest('Blogs table exists', tableExists, tableTime);
    } catch (err) {
      addTest('Blogs table exists', false, 0, err.message);
    }
    
    // Test 4: Count blogs
    try {
      const startCount = Date.now();
      const countResult = await client.query('SELECT COUNT(*) FROM blogs');
      const blogCount = parseInt(countResult.rows[0].count);
      const countTime = Date.now() - startCount;
      addTest('Count blogs', true, countTime, { count: blogCount });
    } catch (err) {
      addTest('Count blogs', false, 0, err.message);
    }
    
    // Test 5: Fetch one blog without joins
    try {
      const startFetch = Date.now();
      const fetchResult = await client.query('SELECT * FROM blogs LIMIT 1');
      const hasBlog = fetchResult.rows.length > 0;
      const fetchTime = Date.now() - startFetch;
      addTest('Fetch one blog', hasBlog, fetchTime, { blog: hasBlog ? fetchResult.rows[0].id : null });
    } catch (err) {
      addTest('Fetch one blog', false, 0, err.message);
    }
    
    // Release the client
    if (client) client.release();
    
    // Return diagnostic results
    res.json(diagnosticResults);
  } catch (err) {
    console.error('Error in diagnostic route:', err);
    res.status(500).json({ error: 'Diagnostic failed', message: err.message });
  }
});

// Simple health check route to test database connectivity
router.get('/health', async (req, res) => {
  console.log('🏥 Blog API health check requested');
  try {
    // Try a very simple query to test DB connectivity
    const startTime = Date.now();
    await new Promise((resolve, reject) => {
      db.get('SELECT 1 as health', [], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
    const duration = Date.now() - startTime;
    console.log(`✅ Database health check successful in ${duration}ms`);
    res.json({ status: 'healthy', dbResponseTime: `${duration}ms` });
  } catch (err) {
    console.error('❌ Database health check failed:', err.message);
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

// Ultra-simple blogs route as a failsafe when the normal route is too slow
router.get('/simple', async (req, res) => {
  console.log('🔥 Using SIMPLE blogs route - emergency fallback');
  
  // Set response headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Handle CORS
  const origin = req.get('origin');
  if (origin && (origin.includes('blog.blueflagindy.com') || origin.includes('onrender.com'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  }
  
  try {
    const startTime = Date.now();
    // Use the direct pool connection for best performance
    const client = await db.pool.connect();
    
    try {
      // Just get the basic blog data without any complex joins
      const result = await client.query('SELECT * FROM blogs WHERE isPublished = true ORDER BY createdAt DESC LIMIT 50');
      const blogs = result.rows;
      
      client.release();
      console.log(`✅ Simple blogs query completed in ${Date.now() - startTime}ms - Found ${blogs.length} blogs`);
      
      // Return just the basic blogs without images or videos
      return res.json({
        blogs: blogs,
        simplified: true,
        executionTime: `${Date.now() - startTime}ms`
      });
    } catch (err) {
      client.release();
      console.error('Error in simple blogs route:', err);
      return res.status(500).json({ 
        error: 'Failed to fetch blogs', 
        details: err.message,
        simplified: true 
      });
    }
  } catch (err) {
    console.error('Database connection error in simple blogs route:', err);
    return res.status(500).json({ 
      error: 'Failed to connect to database', 
      details: err.message,
      simplified: true 
    });
  }
});

// Get all published blogs (public) - sorted by latest
router.get('/', async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /blogs request from: ${req.get('x-request-origin') || req.get('host') || 'unknown'}`);
  console.log('⏱️ Starting blog retrieval - optimized query');
  
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
  
  // Set a safety timeout to prevent hanging requests
  const requestTimeout = setTimeout(() => {
    console.error('⚠️ EMERGENCY TIMEOUT - Blog request taking too long');
    // Return an empty response rather than timing out completely
    return res.json({ 
      blogs: [], 
      _emergency: true, 
      _message: 'Request timed out, returning empty blogs to prevent complete failure'
    });
  }, 15000); // 15 second safety net
  
  try {
    // Use a simpler query to avoid expensive nested JSON aggregation
    // First get the blogs
    const blogsQuery = `
      SELECT * FROM blogs
      WHERE isPublished = true
      ORDER BY createdAt DESC
      LIMIT 50 -- Add limit to prevent huge result sets
    `;
    
    console.log('⏱️ Executing blogs query');
    const startTime = Date.now();
    
    // Convert to async/await to improve error handling
    const blogs = await new Promise((resolve, reject) => {
      db.all(blogsQuery, [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
    
    console.log(`⏱️ Blog query completed in ${Date.now() - startTime}ms - Found ${blogs.length} blogs`);
    
    // Early return if no blogs found
    if (blogs.length === 0) {
      return res.json({ blogs: [] });
    }
    
    // Extract blog IDs for the secondary queries
    const blogIds = blogs.map(blog => blog.id);
    
    // Get images in a separate query
    const imagesQuery = `
      SELECT * FROM blog_images 
      WHERE blogId = ANY($1) 
      ORDER BY blogId, displayOrder
    `;
    
    // Get videos in a separate query 
    const videosQuery = `
      SELECT * FROM blog_videos
      WHERE blogId = ANY($1)
      ORDER BY blogId, displayOrder
    `;
    
    // Execute both queries in parallel
    const [images, videos] = await Promise.all([
      new Promise((resolve, reject) => {
        // Handle case where the blog_images table doesn't exist yet
        db.all(imagesQuery.replace('ANY($1)', `ANY('{${blogIds.join(',')}}')::int[]`), [], (err, rows) => {
          if (err) {
            console.error('Error fetching blog images:', err.message);
            resolve([]);
          } else {
            resolve(rows || []);
          }
        });
      }),
      new Promise((resolve, reject) => {
        // Handle case where the blog_videos table doesn't exist yet
        db.all(videosQuery.replace('ANY($1)', `ANY('{${blogIds.join(',')}}')::int[]`), [], (err, rows) => {
          if (err) {
            console.error('Error fetching blog videos:', err.message);
            resolve([]);
          } else {
            resolve(rows || []);
          }
        });
      })
    ]);
    
    console.log(`⏱️ Image and video queries completed - Found ${images.length} images and ${videos.length} videos`);
    
    // Create a map for easier lookup
    const imagesByBlogId = {};
    const videosByBlogId = {};
    
    // Group images by blogId
    images.forEach(img => {
      if (!imagesByBlogId[img.blogId]) imagesByBlogId[img.blogId] = [];
      imagesByBlogId[img.blogId].push(img);
    });
    
    // Group videos by blogId
    videos.forEach(vid => {
      if (!videosByBlogId[vid.blogId]) videosByBlogId[vid.blogId] = [];
      videosByBlogId[vid.blogId].push(vid);
    });
    
    // Combine the data
    const result = blogs.map(blog => ({
      ...blog,
      images: imagesByBlogId[blog.id] || [],
      videos: videosByBlogId[blog.id] || [],
      isPublished: typeof blog.isPublished === 'boolean' ? blog.isPublished : blog.isPublished === 1
    }));
    
    console.log(`⏱️ Blog data processing completed in ${Date.now() - startTime}ms`);
    clearTimeout(requestTimeout); // Clear safety timeout
    res.json({ blogs: result });
  } catch (err) {
    console.error('Error fetching blogs:', err);
    console.log('DB Error:', err.message);
    clearTimeout(requestTimeout); // Clear safety timeout even on error
    return res.status(500).json({ error: 'Failed to fetch blogs', details: err.message });
  }
});

// Get latest N blogs (for homepage)
router.get('/latest', async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /blogs/latest request from: ${req.get('x-request-origin') || req.get('host') || 'unknown'}`);
  
  // Set correct content type
  res.setHeader('Content-Type', 'application/json');
  
  const limit = parseInt(req.query.limit) || 5;

  try {
    // First get the blogs with a limit
    const blogsQuery = `
      SELECT * FROM blogs
      WHERE isPublished = true
      ORDER BY createdAt DESC
      LIMIT $1
    `;
    
    // Convert to async/await to improve error handling
    const blogs = await new Promise((resolve, reject) => {
      db.all(blogsQuery, [limit], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
    
    // Early return if no blogs found
    if (blogs.length === 0) {
      return res.json({ blogs: [] });
    }
    
    // Extract blog IDs for the secondary queries
    const blogIds = blogs.map(blog => blog.id);
    
    // Get images in a separate query
    const imagesQuery = `
      SELECT * FROM blog_images 
      WHERE blogId = ANY($1) 
      ORDER BY blogId, displayOrder
    `;
    
    // Get videos in a separate query 
    const videosQuery = `
      SELECT * FROM blog_videos
      WHERE blogId = ANY($1)
      ORDER BY blogId, displayOrder
    `;
    
    // Execute both queries in parallel
    const [images, videos] = await Promise.all([
      new Promise((resolve, reject) => {
        // Handle case where the blog_images table doesn't exist yet
        db.all(imagesQuery.replace('ANY($1)', `ANY('{${blogIds.join(',')}}')::int[]`), [], (err, rows) => {
          if (err) {
            console.error('Error fetching blog images:', err.message);
            resolve([]);
          } else {
            resolve(rows || []);
          }
        });
      }),
      new Promise((resolve, reject) => {
        // Handle case where the blog_videos table doesn't exist yet
        db.all(videosQuery.replace('ANY($1)', `ANY('{${blogIds.join(',')}}')::int[]`), [], (err, rows) => {
          if (err) {
            console.error('Error fetching blog videos:', err.message);
            resolve([]);
          } else {
            resolve(rows || []);
          }
        });
      })
    ]);
    
    // Create a map for easier lookup
    const imagesByBlogId = {};
    const videosByBlogId = {};
    
    // Group images by blogId
    images.forEach(img => {
      if (!imagesByBlogId[img.blogId]) imagesByBlogId[img.blogId] = [];
      imagesByBlogId[img.blogId].push(img);
    });
    
    // Group videos by blogId
    videos.forEach(vid => {
      if (!videosByBlogId[vid.blogId]) videosByBlogId[vid.blogId] = [];
      videosByBlogId[vid.blogId].push(vid);
    });
    
    // Combine the data
    const result = blogs.map(blog => ({
      ...blog,
      images: imagesByBlogId[blog.id] || [],
      videos: videosByBlogId[blog.id] || [],
      isPublished: typeof blog.isPublished === 'boolean' ? blog.isPublished : blog.isPublished === 1
    }));
    
    res.json({ blogs: result });
  } catch (err) {
    console.error('Error fetching latest blogs:', err);
    console.log('DB Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch latest blogs', details: err.message });
  }
});

// Get single blog (public)
router.get('/:id', async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /blogs/${req.params.id} request from: ${req.get('x-request-origin') || req.get('host') || 'unknown'}`);
  
  // Set correct content type
  res.setHeader('Content-Type', 'application/json');
  
  const blogId = req.params.id;

  try {
    // Get the blog
    const blogQuery = `SELECT * FROM blogs WHERE id = $1 AND isPublished = true`;
    
    // Convert to async/await to improve error handling
    const blog = await new Promise((resolve, reject) => {
      db.get(blogQuery, [blogId], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Get images for this blog
    const imagesQuery = `
      SELECT * FROM blog_images 
      WHERE blogId = $1
      ORDER BY displayOrder
    `;
    
    // Get videos for this blog
    const videosQuery = `
      SELECT * FROM blog_videos
      WHERE blogId = $1
      ORDER BY displayOrder
    `;
    
    // Execute both queries in parallel
    const [images, videos] = await Promise.all([
      new Promise((resolve, reject) => {
        db.all(imagesQuery, [blogId], (err, rows) => {
          if (err) {
            console.error('Error fetching blog images:', err.message);
            resolve([]);
          } else {
            resolve(rows || []);
          }
        });
      }),
      new Promise((resolve, reject) => {
        db.all(videosQuery, [blogId], (err, rows) => {
          if (err) {
            console.error('Error fetching blog videos:', err.message);
            resolve([]);
          } else {
            resolve(rows || []);
          }
        });
      })
    ]);
    
    // Combine the data
    const result = {
      ...blog,
      images: images || [],
      videos: videos || [],
      isPublished: typeof blog.isPublished === 'boolean' ? blog.isPublished : blog.isPublished === 1
    };
    
    res.json({ blog: result });
  } catch (err) {
    console.error('Error fetching blog:', err);
    console.log('DB Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch blog', details: err.message });
  }
});

module.exports = router;
