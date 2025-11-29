const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all properties with pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'active',
      propertyType,
      city,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      minSquareFeet,
      maxSquareFeet
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereConditions = ['status = ?'];
    let params = [status];

    if (propertyType) {
      whereConditions.push('propertyType = ?');
      params.push(propertyType);
    }

    if (city) {
      whereConditions.push('city = ?');
      params.push(city);
    }

    if (minPrice) {
      whereConditions.push('price >= ?');
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      whereConditions.push('price <= ?');
      params.push(parseFloat(maxPrice));
    }

    if (bedrooms) {
      whereConditions.push('bedrooms >= ?');
      params.push(parseInt(bedrooms));
    }

    if (bathrooms) {
      whereConditions.push('bathrooms >= ?');
      params.push(parseFloat(bathrooms));
    }

    if (minSquareFeet) {
      whereConditions.push('squareFeet >= ?');
      params.push(parseInt(minSquareFeet));
    }

    if (maxSquareFeet) {
      whereConditions.push('squareFeet <= ?');
      params.push(parseInt(maxSquareFeet));
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM properties WHERE ${whereClause}`;
    const total = await new Promise((resolve, reject) => {
      db.get(countQuery, params, (err, row) => {
        if (err) reject(err);
        else resolve(row.total);
      });
    });

    // Get properties with images
    const query = `
      SELECT p.*,
        (SELECT json_group_array(
          json_object(
            'id', pi.id,
            'imageUrl', pi.imageUrl,
            'thumbnailUrl', pi.thumbnailUrl,
            'isPrimary', pi.isPrimary,
            'displayOrder', pi.displayOrder
          )
        )
        FROM property_images pi
        WHERE pi.propertyId = p.id
        ORDER BY pi.displayOrder) as images
      FROM properties p
      WHERE ${whereClause}
      ORDER BY p.featured DESC, p.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), offset);

    db.all(query, params, async (err, rows) => {
      if (err) {
        console.error('Error fetching properties:', err);
        return res.status(500).json({ error: 'Failed to fetch properties' });
      }

      // Parse images JSON
      const properties = rows.map(row => ({
        ...row,
        images: row.images ? JSON.parse(row.images) : [],
        price: parseFloat(row.price),
        latitude: row.latitude ? parseFloat(row.latitude) : null,
        longitude: row.longitude ? parseFloat(row.longitude) : null
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
  } catch (error) {
    console.error('Error in GET /properties:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get featured properties
router.get('/featured', (req, res) => {
  const limit = parseInt(req.query.limit) || 6;

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
    WHERE p.featured = 1 AND p.status = 'active'
    ORDER BY p.createdAt DESC
    LIMIT ?
  `;

  db.all(query, [limit], (err, rows) => {
    if (err) {
      console.error('Error fetching featured properties:', err);
      return res.status(500).json({ error: 'Failed to fetch featured properties' });
    }

    const properties = rows.map(row => ({
      ...row,
      images: row.images ? JSON.parse(row.images) : [],
      price: parseFloat(row.price)
    }));

    res.json({ properties });
  });
});

// Get single property by ID
router.get('/:id', (req, res) => {
  const propertyId = req.params.id;

  // Get property with images and features
  const query = `
    SELECT p.*,
      (SELECT json_group_array(
        json_object(
          'id', pi.id,
          'imageUrl', pi.imageUrl,
          'thumbnailUrl', pi.thumbnailUrl,
          'isPrimary', pi.isPrimary,
          'displayOrder', pi.displayOrder,
          'caption', pi.caption
        )
      )
      FROM property_images pi
      WHERE pi.propertyId = p.id
      ORDER BY pi.displayOrder) as images,
      (SELECT json_group_array(
        json_object(
          'id', pf.id,
          'feature', pf.feature,
          'category', pf.category
        )
      )
      FROM property_features pf
      WHERE pf.propertyId = p.id) as features
    FROM properties p
    WHERE p.id = ?
  `;

  db.get(query, [propertyId], (err, row) => {
    if (err) {
      console.error('Error fetching property:', err);
      return res.status(500).json({ error: 'Failed to fetch property' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const property = {
      ...row,
      images: row.images ? JSON.parse(row.images) : [],
      features: row.features ? JSON.parse(row.features) : [],
      price: parseFloat(row.price),
      latitude: row.latitude ? parseFloat(row.latitude) : null,
      longitude: row.longitude ? parseFloat(row.longitude) : null
    };

    res.json({ property });
  });
});

// Get property by MLS number
router.get('/mls/:mlsNumber', (req, res) => {
  const mlsNumber = req.params.mlsNumber;

  const query = `
    SELECT p.*,
      (SELECT json_group_array(
        json_object(
          'id', pi.id,
          'imageUrl', pi.imageUrl,
          'thumbnailUrl', pi.thumbnailUrl,
          'isPrimary', pi.isPrimary,
          'displayOrder', pi.displayOrder
        )
      )
      FROM property_images pi
      WHERE pi.propertyId = p.id
      ORDER BY pi.displayOrder) as images,
      (SELECT json_group_array(pf.feature)
      FROM property_features pf
      WHERE pf.propertyId = p.id) as features
    FROM properties p
    WHERE p.mlsNumber = ?
  `;

  db.get(query, [mlsNumber], (err, row) => {
    if (err) {
      console.error('Error fetching property:', err);
      return res.status(500).json({ error: 'Failed to fetch property' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const property = {
      ...row,
      images: row.images ? JSON.parse(row.images) : [],
      features: row.features ? JSON.parse(row.features) : [],
      price: parseFloat(row.price)
    };

    res.json({ property });
  });
});

module.exports = router;

