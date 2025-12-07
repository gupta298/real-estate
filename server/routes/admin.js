const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticate } = require('./auth');

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// ========== FEATURED LISTINGS MANAGEMENT ==========

// Toggle featured status of a property
router.post('/properties/:id/featured', authenticate, requireAdmin, (req, res) => {
  const propertyId = req.params.id;
  const { featured } = req.body;

  db.run(
    'UPDATE properties SET featured = $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2',
    [featured ? true : false, propertyId],
    function(err) {
      if (err) {
        console.error('Error updating featured status:', err);
        return res.status(500).json({ error: 'Failed to update featured status' });
      }

      res.json({
        success: true,
        message: `Property ${featured ? 'featured' : 'unfeatured'} successfully`
      });
    }
  );
});

// Get all properties for management (with featured status)
router.get('/properties', authenticate, requireAdmin, (req, res) => {
  const { page = 1, limit = 50, search, isOffMarket, featured } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let whereConditions = [];
  let params = [];

  let paramCounter = 1;

  if (search) {
    const searchTerm = `%${search}%`;
    whereConditions.push(`(title LIKE $${paramCounter} OR address LIKE $${paramCounter+1} OR city LIKE $${paramCounter+2})`);
    params.push(searchTerm, searchTerm, searchTerm);
    paramCounter += 3;
  }

  if (isOffMarket === 'true') {
    whereConditions.push('isOffMarket = true');
  } else if (isOffMarket === 'false') {
    whereConditions.push('(isOffMarket = false OR isOffMarket IS NULL)');
  }

  if (featured === 'true') {
    whereConditions.push('featured = true');
  } else if (featured === 'false') {
    whereConditions.push('featured = false');
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM properties ${whereClause}`;
  
  db.get(countQuery, params, (err, countRow) => {
    if (err) {
      console.error('Error counting properties:', err);
      return res.status(500).json({ error: 'Failed to fetch properties' });
    }

    const total = countRow.total;

    // Get properties
    const query = `
      SELECT p.*,
        (SELECT json_agg(
          json_build_object(
            'id', pi.id,
            'imageUrl', pi.imageUrl,
            'thumbnailUrl', pi.thumbnailUrl,
            'isPrimary', pi.isPrimary
          )
        )
        FROM property_images pi
        WHERE pi.propertyId = p.id AND pi.isPrimary = true) as images
      FROM properties p
      ${whereClause}
      ORDER BY p.featured DESC, p.createdAt DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter+1}
    `;

    const queryParams = [...params, parseInt(limit), offset];
    paramCounter += 2;

    db.all(query, queryParams, (err, rows) => {
      if (err) {
        console.error('Error fetching properties:', err);
        return res.status(500).json({ error: 'Failed to fetch properties' });
      }

      const properties = rows.map(row => ({
        ...row,
        images: row.images || [], // PostgreSQL will return the JSON array directly
        price: parseFloat(row.price),
        // In PostgreSQL, booleans are already boolean values
        featured: typeof row.featured === 'boolean' ? row.featured : row.featured === 1
      }));

      res.json({
        properties,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    });
  });
});

// ========== OFF-MARKET DEALS MANAGEMENT ==========

// Get unique property types and sub-types for autocomplete
router.get('/off-market-deals/options', authenticate, requireAdmin, (req, res) => {
  const query = `
    SELECT DISTINCT propertyType, propertySubType
    FROM off_market_deals
    WHERE propertyType IS NOT NULL OR propertySubType IS NOT NULL
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching property options:', err);
      return res.status(500).json({ error: 'Failed to fetch property options' });
    }

    const propertyTypes = new Set();
    const propertySubTypes = new Set();

    rows.forEach(row => {
      if (row.propertyType) propertyTypes.add(row.propertyType);
      if (row.propertySubType) propertySubTypes.add(row.propertySubType);
    });

    res.json({
      propertyTypes: Array.from(propertyTypes).sort(),
      propertySubTypes: Array.from(propertySubTypes).sort()
    });
  });
});

// Get all off-market deals
router.get('/off-market-deals', authenticate, requireAdmin, (req, res) => {
  const { active } = req.query;

  let query = `
    SELECT d.*,
      (SELECT json_agg(
        json_build_object(
          'id', img.id,
          'imageUrl', img.imageUrl,
          'thumbnailUrl', img.thumbnailUrl,
          'displayOrder', img.displayOrder,
          'caption', img.caption
        )
      )
      FROM off_market_deal_images img
      WHERE img.dealId = d.id
      ORDER BY img.displayOrder) as images
    FROM off_market_deals d
  `;
  let params = [];

  if (active === 'true') {
    query += ' WHERE d.isActive = true';
  } else if (active === 'false') {
    query += ' WHERE d.isActive = false';
  }

  query += ' ORDER BY d.isHotDeal DESC, d.displayOrder ASC, d.createdAt DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching off-market deals:', err);
      return res.status(500).json({ error: 'Failed to fetch off-market deals' });
    }

    const deals = rows.map(row => ({
      ...row,
      images: row.images || [],  // PostgreSQL returns json directly
      videos: row.videos || [],  // PostgreSQL returns json directly
      thumbnailUrl: row.thumbnailUrl || null,
      thumbnailType: row.thumbnailType || null,
      // Handle both PostgreSQL boolean and SQLite integer
      isActive: typeof row.isActive === 'boolean' ? row.isActive : row.isActive === 1,
      isHotDeal: typeof row.isHotDeal === 'boolean' ? row.isHotDeal : row.isHotDeal === 1
    }));

    res.json({ deals });
  });
});

// Get single off-market deal
router.get('/off-market-deals/:id', authenticate, requireAdmin, (req, res) => {
  const dealId = req.params.id;

  const query = `
    SELECT d.*,
      (SELECT json_agg(
        json_build_object(
          'id', img.id,
          'imageUrl', img.imageUrl,
          'thumbnailUrl', img.thumbnailUrl,
          'displayOrder', img.displayOrder,
          'caption', img.caption
        )
      )
      FROM off_market_deal_images img
      WHERE img.dealId = d.id
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
      FROM off_market_deal_videos vid
      WHERE vid.dealId = d.id
      ORDER BY vid.displayOrder) as videos
    FROM off_market_deals d
    WHERE d.id = $1
  `;

  db.get(query, [dealId], (err, row) => {
    if (err) {
      console.error('Error fetching off-market deal:', err);
      return res.status(500).json({ error: 'Failed to fetch off-market deal' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Off-market deal not found' });
    }

    const deal = {
      ...row,
      images: row.images || [],  // PostgreSQL returns json directly
      videos: row.videos || [],  // PostgreSQL returns json directly
      thumbnailUrl: row.thumbnailUrl || null,
      thumbnailType: row.thumbnailType || null,
      // Handle both PostgreSQL boolean and SQLite integer
      isActive: typeof row.isActive === 'boolean' ? row.isActive : row.isActive === 1,
      isHotDeal: typeof row.isHotDeal === 'boolean' ? row.isHotDeal : row.isHotDeal === 1
    };

    res.json({ deal });
  });
});

// Create off-market deal
router.post('/off-market-deals', authenticate, requireAdmin, (req, res) => {
  const {
    title,
    content,
    propertyType,
    propertySubType,
    area,
    status = 'open',
    contactName,
    contactPhone,
    contactEmail,
    contactTitle,
    thumbnailUrl,
    thumbnailType,
    isActive = true,
    isHotDeal = false,
    displayOrder = 0,
    images = [],
    videos = []
  } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  // Convert to async function to properly use await
  (async () => {
    try {
      // Insert the off-market deal
      const result = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO off_market_deals 
           (title, content, propertyType, propertySubType, area, status, contactName, contactPhone, contactEmail, contactTitle, thumbnailUrl, thumbnailType, isActive, isHotDeal, displayOrder)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id`,
          [title, content, propertyType || null, propertySubType || null, area || null, status || 'open', contactName || null, contactPhone || null, contactEmail || null, contactTitle || null, thumbnailUrl || null, thumbnailType || null, isActive ? true : false, isHotDeal ? true : false, displayOrder],
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });

      // Get dealId from the result object for PostgreSQL or use lastID for SQLite
      const dealId = result && result.rows && result.rows[0] ? result.rows[0].id : result.lastID;

      // Insert images if provided
      if (images && images.length > 0) {
        try {
          // Start transaction
          await new Promise((resolve, reject) => {
            db.run('BEGIN;', [], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
          
          // Insert each image
          for (const [index, img] of images.entries()) {
            await new Promise((resolve, reject) => {
              db.run(
                `INSERT INTO off_market_deal_images (dealId, imageUrl, thumbnailUrl, displayOrder, caption)
                VALUES ($1, $2, $3, $4, $5)`,
                [
                  dealId,
                  img.imageUrl,
                  img.thumbnailUrl || img.imageUrl,
                  img.displayOrder !== undefined ? img.displayOrder : index,
                  img.caption || null
                ],
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            });
          }
          
          // Commit transaction
          await new Promise((resolve, reject) => {
            db.run('COMMIT;', [], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        } catch (err) {
          console.error('Error inserting images:', err);
          await new Promise((resolve) => {
            db.run('ROLLBACK;', [], () => resolve());
          });
        }
      }

      // Insert videos if provided
      if (videos && videos.length > 0) {
        try {
          // Start transaction
          await new Promise((resolve, reject) => {
            db.run('BEGIN;', [], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
          
          // Insert each video
          for (const [index, vid] of videos.entries()) {
            await new Promise((resolve, reject) => {
              db.run(
                `INSERT INTO off_market_deal_videos (dealId, videoUrl, thumbnailUrl, displayOrder, caption)
                VALUES ($1, $2, $3, $4, $5)`,
                [
                  dealId,
                  vid.videoUrl,
                  vid.thumbnailUrl || null,
                  vid.displayOrder !== undefined ? vid.displayOrder : index,
                  vid.caption || null
                ],
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            });
          }
          
          // Commit transaction
          await new Promise((resolve, reject) => {
            db.run('COMMIT;', [], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        } catch (err) {
          console.error('Error inserting videos:', err);
          await new Promise((resolve) => {
            db.run('ROLLBACK;', [], () => resolve());
          });
        }
      }
      
      // Send response
      res.json({
        success: true,
        dealId,
        message: 'Off-market deal created successfully'
      });
    } catch (err) {
      console.error('Error creating off-market deal:', err);
      res.status(500).json({ error: 'Failed to create off-market deal' });
    }
  })();
});

// Update off-market deal
router.put('/off-market-deals/:id', authenticate, requireAdmin, (req, res) => {
  const dealId = req.params.id;
  const {
    title,
    content,
    propertyType,
    propertySubType,
    area,
    status,
    contactName,
    contactPhone,
    contactEmail,
    contactTitle,
    thumbnailUrl,
    thumbnailType,
    isActive,
    isHotDeal,
    displayOrder,
    images,
    videos
  } = req.body;

  db.run(
    `UPDATE off_market_deals SET
      title = ?, content = ?, propertyType = ?, propertySubType = ?, area = ?, status = ?,
      contactName = ?, contactPhone = ?,
      contactEmail = ?, contactTitle = ?, thumbnailUrl = ?, thumbnailType = ?,
      isActive = ?, isHotDeal = ?,
      displayOrder = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      title, content, propertyType || null, propertySubType || null, area || null, status || 'open',
      contactName || null, contactPhone || null,
      contactEmail || null, contactTitle || null, thumbnailUrl || null, thumbnailType || null,
      isActive ? 1 : 0, isHotDeal ? 1 : 0, displayOrder || 0, dealId
    ],
    function(err) {
      if (err) {
        console.error('Error updating off-market deal:', err);
        return res.status(500).json({ error: 'Failed to update off-market deal' });
      }

      // Update images if provided
      if (images !== undefined) {
        // Delete existing images
        db.run('DELETE FROM off_market_deal_images WHERE dealId = ?', [dealId], (err) => {
          if (err) {
            console.error('Error deleting images:', err);
          }

          // Insert new images
          if (Array.isArray(images) && images.length > 0) {
            const imageStmt = db.prepare(`
              INSERT INTO off_market_deal_images (dealId, imageUrl, thumbnailUrl, displayOrder, caption)
              VALUES (?, ?, ?, ?, ?)
            `);

            images.forEach((img, index) => {
              imageStmt.run(
                dealId,
                img.imageUrl,
                img.thumbnailUrl || img.imageUrl,
                img.displayOrder !== undefined ? img.displayOrder : index,
                img.caption || null
              );
            });

            imageStmt.finalize();
          }
        });
      }

      // Update videos if provided
      if (videos !== undefined) {
        // Delete existing videos
        db.run('DELETE FROM off_market_deal_videos WHERE dealId = ?', [dealId], (err) => {
          if (err) {
            console.error('Error deleting videos:', err);
          }

          // Insert new videos
          if (Array.isArray(videos) && videos.length > 0) {
            const videoStmt = db.prepare(`
              INSERT INTO off_market_deal_videos (dealId, videoUrl, thumbnailUrl, displayOrder, caption)
              VALUES (?, ?, ?, ?, ?)
            `);

            videos.forEach((vid, index) => {
              videoStmt.run(
                dealId,
                vid.videoUrl,
                vid.thumbnailUrl || null,
                vid.displayOrder !== undefined ? vid.displayOrder : index,
                vid.caption || null
              );
            });

            videoStmt.finalize();
          }
        });
      }

      res.json({
        success: true,
        message: 'Off-market deal updated successfully'
      });
    }
  );
});

// Delete off-market deal
router.delete('/off-market-deals/:id', authenticate, requireAdmin, (req, res) => {
  const dealId = req.params.id;

  db.run('DELETE FROM off_market_deals WHERE id = ?', [dealId], function(err) {
    if (err) {
      console.error('Error deleting off-market deal:', err);
      return res.status(500).json({ error: 'Failed to delete off-market deal' });
    }

    res.json({
      success: true,
      message: 'Off-market deal deleted successfully'
    });
  });
});

// ========== BLOG MANAGEMENT ==========

// Get all blogs (admin)
router.get('/blogs', authenticate, requireAdmin, (req, res) => {
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
      ORDER BY img.displayOrder) as images
    FROM blogs b
    ORDER BY b.createdAt DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching blogs:', err);
      return res.status(500).json({ error: 'Failed to fetch blogs' });
    }

    const blogs = rows.map(row => ({
      ...row,
      images: row.images || [], // PostgreSQL returns json directly
      // Handle both PostgreSQL boolean and SQLite integer
      isPublished: typeof row.isPublished === 'boolean' ? row.isPublished : row.isPublished === 1
    }));

    res.json({ blogs });
  });
});

// Get single blog (admin)
router.get('/blogs/:id', authenticate, requireAdmin, (req, res) => {
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
    WHERE b.id = $1
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
      images: row.images || [], // PostgreSQL returns json directly
      videos: row.videos || [], // PostgreSQL returns json directly
      // Handle both PostgreSQL boolean and SQLite integer
      isPublished: typeof row.isPublished === 'boolean' ? row.isPublished : row.isPublished === 1
    };

    res.json({ blog });
  });
});

// Create blog
router.post('/blogs', authenticate, requireAdmin, (req, res) => {
  const {
    title,
    content,
    excerpt,
    thumbnailUrl,
    thumbnailType,
    isPublished = true,
    images = [],
    videos = []
  } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  db.run(
    `INSERT INTO blogs (title, content, excerpt, thumbnailUrl, thumbnailType, isPublished)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [title, content, excerpt || null, thumbnailUrl || null, thumbnailType || null, isPublished ? 1 : 0],
    function(err) {
      if (err) {
        console.error('Error creating blog:', err);
        return res.status(500).json({ error: 'Failed to create blog' });
      }

      const blogId = this.lastID;

      // Insert images if provided
      if (images.length > 0) {
        const imageStmt = db.prepare(`
          INSERT INTO blog_images (blogId, imageUrl, thumbnailUrl, displayOrder, caption)
          VALUES (?, ?, ?, ?, ?)
        `);

        images.forEach((img, index) => {
          imageStmt.run(
            blogId,
            img.imageUrl,
            img.thumbnailUrl || img.imageUrl,
            img.displayOrder !== undefined ? img.displayOrder : index,
            img.caption || null
          );
        });

        imageStmt.finalize();
      }

      // Insert videos if provided
      if (videos.length > 0) {
        const videoStmt = db.prepare(`
          INSERT INTO blog_videos (blogId, videoUrl, thumbnailUrl, displayOrder, caption)
          VALUES (?, ?, ?, ?, ?)
        `);

        videos.forEach((vid, index) => {
          videoStmt.run(
            blogId,
            vid.videoUrl,
            vid.thumbnailUrl || null,
            vid.displayOrder !== undefined ? vid.displayOrder : index,
            vid.caption || null
          );
        });

        videoStmt.finalize();
      }

      res.json({
        success: true,
        blogId,
        message: 'Blog created successfully'
      });
    }
  );
});

// Update blog
router.put('/blogs/:id', authenticate, requireAdmin, (req, res) => {
  const blogId = req.params.id;
  const {
    title,
    content,
    excerpt,
    thumbnailUrl,
    thumbnailType,
    isPublished,
    images,
    videos
  } = req.body;

  db.run(
    `UPDATE blogs SET
      title = ?, content = ?, excerpt = ?,
      thumbnailUrl = ?, thumbnailType = ?,
      isPublished = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      title, content, excerpt || null,
      thumbnailUrl || null, thumbnailType || null,
      isPublished ? 1 : 0, blogId
    ],
    function(err) {
      if (err) {
        console.error('Error updating blog:', err);
        return res.status(500).json({ error: 'Failed to update blog' });
      }

      // Update images if provided
      if (images !== undefined) {
        // Delete existing images
        db.run('DELETE FROM blog_images WHERE blogId = ?', [blogId], (err) => {
          if (err) {
            console.error('Error deleting images:', err);
          }

          // Insert new images
          if (Array.isArray(images) && images.length > 0) {
            const imageStmt = db.prepare(`
              INSERT INTO blog_images (blogId, imageUrl, thumbnailUrl, displayOrder, caption)
              VALUES (?, ?, ?, ?, ?)
            `);

            images.forEach((img, index) => {
              imageStmt.run(
                blogId,
                img.imageUrl,
                img.thumbnailUrl || img.imageUrl,
                img.displayOrder !== undefined ? img.displayOrder : index,
                img.caption || null
              );
            });

            imageStmt.finalize();
          }
        });
      }

      // Update videos if provided
      if (videos !== undefined) {
        // Delete existing videos
        db.run('DELETE FROM blog_videos WHERE blogId = ?', [blogId], (err) => {
          if (err) {
            console.error('Error deleting videos:', err);
          }

          // Insert new videos
          if (Array.isArray(videos) && videos.length > 0) {
            const videoStmt = db.prepare(`
              INSERT INTO blog_videos (blogId, videoUrl, thumbnailUrl, displayOrder, caption)
              VALUES (?, ?, ?, ?, ?)
            `);

            videos.forEach((vid, index) => {
              videoStmt.run(
                blogId,
                vid.videoUrl,
                vid.thumbnailUrl || null,
                vid.displayOrder !== undefined ? vid.displayOrder : index,
                vid.caption || null
              );
            });

            videoStmt.finalize();
          }
        });
      }

      res.json({
        success: true,
        message: 'Blog updated successfully'
      });
    }
  );
});

// Delete blog
router.delete('/blogs/:id', authenticate, requireAdmin, (req, res) => {
  const blogId = req.params.id;

  db.run('DELETE FROM blogs WHERE id = ?', [blogId], function(err) {
    if (err) {
      console.error('Error deleting blog:', err);
      return res.status(500).json({ error: 'Failed to delete blog' });
    }

    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  });
});

module.exports = router;

