const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all published blogs (public) - sorted by latest
router.get('/', (req, res) => {
  const query = `
    SELECT b.*,
      (SELECT json_group_array(
        json_object(
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
      (SELECT json_group_array(
        json_object(
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
    WHERE b.isPublished = 1
    ORDER BY b.createdAt DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching blogs:', err);
      return res.status(500).json({ error: 'Failed to fetch blogs' });
    }

    const blogs = rows.map(row => ({
      ...row,
      images: row.images ? JSON.parse(row.images) : [],
      videos: row.videos ? JSON.parse(row.videos) : [],
      isPublished: row.isPublished === 1
    }));

    res.json({ blogs });
  });
});

// Get latest N blogs (for homepage)
router.get('/latest', (req, res) => {
  const limit = parseInt(req.query.limit) || 5;

  const query = `
    SELECT b.*,
      (SELECT json_group_array(
        json_object(
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
      (SELECT json_group_array(
        json_object(
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
    WHERE b.isPublished = 1
    ORDER BY b.createdAt DESC
    LIMIT ?
  `;

  db.all(query, [limit], (err, rows) => {
    if (err) {
      console.error('Error fetching latest blogs:', err);
      return res.status(500).json({ error: 'Failed to fetch latest blogs' });
    }

    const blogs = rows.map(row => ({
      ...row,
      images: row.images ? JSON.parse(row.images) : [],
      videos: row.videos ? JSON.parse(row.videos) : [],
      isPublished: row.isPublished === 1
    }));

    res.json({ blogs });
  });
});

// Get single blog (public)
router.get('/:id', (req, res) => {
  const blogId = req.params.id;

  const query = `
    SELECT b.*,
      (SELECT json_group_array(
        json_object(
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
      (SELECT json_group_array(
        json_object(
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
    WHERE b.id = ? AND b.isPublished = 1
  `;

  db.get(query, [blogId], (err, row) => {
    if (err) {
      console.error('Error fetching blog:', err);
      return res.status(500).json({ error: 'Failed to fetch blog' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const blog = {
      ...row,
      images: row.images ? JSON.parse(row.images) : [],
      videos: row.videos ? JSON.parse(row.videos) : [],
      isPublished: row.isPublished === 1
    };

    res.json({ blog });
  });
});

module.exports = router;

