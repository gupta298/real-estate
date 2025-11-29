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
    'UPDATE properties SET featured = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    [featured ? 1 : 0, propertyId],
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

  if (search) {
    whereConditions.push('(title LIKE ? OR address LIKE ? OR city LIKE ?)');
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (isOffMarket === 'true') {
    whereConditions.push('isOffMarket = 1');
  } else if (isOffMarket === 'false') {
    whereConditions.push('(isOffMarket = 0 OR isOffMarket IS NULL)');
  }

  if (featured === 'true') {
    whereConditions.push('featured = 1');
  } else if (featured === 'false') {
    whereConditions.push('featured = 0');
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
        (SELECT json_group_array(
          json_object(
            'id', pi.id,
            'imageUrl', pi.imageUrl,
            'thumbnailUrl', pi.thumbnailUrl,
            'isPrimary', pi.isPrimary
          )
        )
        FROM property_images pi
        WHERE pi.propertyId = p.id AND pi.isPrimary = 1) as images
      FROM properties p
      ${whereClause}
      ORDER BY p.featured DESC, p.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    const queryParams = [...params, parseInt(limit), offset];

    db.all(query, queryParams, (err, rows) => {
      if (err) {
        console.error('Error fetching properties:', err);
        return res.status(500).json({ error: 'Failed to fetch properties' });
      }

      const properties = rows.map(row => ({
        ...row,
        images: row.images ? JSON.parse(row.images) : [],
        price: parseFloat(row.price),
        featured: row.featured === 1
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
      (SELECT json_group_array(
        json_object(
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
    query += ' WHERE d.isActive = 1';
  } else if (active === 'false') {
    query += ' WHERE d.isActive = 0';
  }

  query += ' ORDER BY d.isHotDeal DESC, d.displayOrder ASC, d.createdAt DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching off-market deals:', err);
      return res.status(500).json({ error: 'Failed to fetch off-market deals' });
    }

    const deals = rows.map(row => ({
      ...row,
      images: row.images ? JSON.parse(row.images) : [],
      isActive: row.isActive === 1,
      isHotDeal: row.isHotDeal === 1
    }));

    res.json({ deals });
  });
});

// Get single off-market deal
router.get('/off-market-deals/:id', authenticate, requireAdmin, (req, res) => {
  const dealId = req.params.id;

  const query = `
    SELECT d.*,
      (SELECT json_group_array(
        json_object(
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
    WHERE d.id = ?
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
      images: row.images ? JSON.parse(row.images) : [],
      isActive: row.isActive === 1,
      isHotDeal: row.isHotDeal === 1
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
    isActive = true,
    isHotDeal = false,
    displayOrder = 0,
    images = []
  } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  db.run(
    `INSERT INTO off_market_deals 
     (title, content, propertyType, propertySubType, area, status, contactName, contactPhone, contactEmail, contactTitle, isActive, isHotDeal, displayOrder)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, content, propertyType || null, propertySubType || null, area || null, status || 'open', contactName || null, contactPhone || null, contactEmail || null, contactTitle || null, isActive ? 1 : 0, isHotDeal ? 1 : 0, displayOrder],
    function(err) {
      if (err) {
        console.error('Error creating off-market deal:', err);
        return res.status(500).json({ error: 'Failed to create off-market deal' });
      }

      const dealId = this.lastID;

      // Insert images if provided
      if (images.length > 0) {
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

      res.json({
        success: true,
        dealId,
        message: 'Off-market deal created successfully'
      });
    }
  );
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
    isActive,
    isHotDeal,
    displayOrder,
    images
  } = req.body;

  db.run(
    `UPDATE off_market_deals SET
      title = ?, content = ?, propertyType = ?, propertySubType = ?, area = ?, status = ?,
      contactName = ?, contactPhone = ?,
      contactEmail = ?, contactTitle = ?, isActive = ?, isHotDeal = ?,
      displayOrder = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      title, content, propertyType || null, propertySubType || null, area || null, status || 'open',
      contactName || null, contactPhone || null,
      contactEmail || null, contactTitle || null,
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

module.exports = router;

