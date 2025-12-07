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
    let whereConditions = ['status = $1'];
    let params = [status];
    let paramCounter = 2;

    if (propertyType) {
      whereConditions.push(`propertyType = $${paramCounter}`);
      params.push(propertyType);
      paramCounter++;
    }

    if (city) {
      whereConditions.push(`city = $${paramCounter}`);
      params.push(city);
      paramCounter++;
    }

    if (minPrice) {
      whereConditions.push(`price >= $${paramCounter}`);
      params.push(parseFloat(minPrice));
      paramCounter++;
    }

    if (maxPrice) {
      whereConditions.push(`price <= $${paramCounter}`);
      params.push(parseFloat(maxPrice));
      paramCounter++;
    }

    if (bedrooms) {
      whereConditions.push(`bedrooms >= $${paramCounter}`);
      params.push(parseInt(bedrooms));
      paramCounter++;
    }

    if (bathrooms) {
      whereConditions.push(`bathrooms >= $${paramCounter}`);
      params.push(parseFloat(bathrooms));
      paramCounter++;
    }

    if (minSquareFeet) {
      whereConditions.push(`squareFeet >= $${paramCounter}`);
      params.push(parseInt(minSquareFeet));
      paramCounter++;
    }

    if (maxSquareFeet) {
      whereConditions.push(`squareFeet <= $${paramCounter}`);
      params.push(parseInt(maxSquareFeet));
      paramCounter++;
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
        (SELECT json_agg(
          json_build_object(
            'id', pi.id,
            'imageUrl', pi.imageUrl,
            'thumbnailUrl', pi.thumbnailUrl,
            'isPrimary', pi.isPrimary,
            'displayOrder', pi.displayOrder
          )
          ORDER BY pi.displayOrder
        )
        FROM property_images pi
        WHERE pi.propertyId = p.id
        ) as images
      FROM properties p
      WHERE ${whereClause}
      ORDER BY p.featured DESC, p.createdAt DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter+1}
    `;

    params.push(parseInt(limit), offset);

    db.all(query, params, async (err, rows) => {
      if (err) {
        console.error('Error fetching properties:', err);
        return res.status(500).json({ error: 'Failed to fetch properties' });
      }

      // Handle images - PostgreSQL returns JSON directly
      const properties = rows.map(row => ({
        ...row,
        images: row.images || [], // PostgreSQL returns json directly
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
    WHERE p.featured = true AND p.status = 'active'
    ORDER BY p.createdAt DESC
    LIMIT $1
  `;

  db.all(query, [limit], (err, rows) => {
    if (err) {
      console.error('Error fetching featured properties:', err);
      return res.status(500).json({ error: 'Failed to fetch featured properties' });
    }

    const properties = rows.map(row => ({
      ...row,
      images: row.images || [], // PostgreSQL returns JSON directly
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
      (SELECT json_agg(
        json_build_object(
          'id', pi.id,
          'imageUrl', pi.imageUrl,
          'thumbnailUrl', pi.thumbnailUrl,
          'isPrimary', pi.isPrimary,
          'displayOrder', pi.displayOrder,
          'caption', pi.caption
        )
        ORDER BY pi.displayOrder
      )
      FROM property_images pi
      WHERE pi.propertyId = p.id) as images,
      (SELECT json_agg(
        json_build_object(
          'id', pf.id,
          'feature', pf.feature,
          'category', pf.category
        )
      )
      FROM property_features pf
      WHERE pf.propertyId = p.id) as features
    FROM properties p
    WHERE p.id = $1
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
      images: row.images || [], // PostgreSQL returns JSON directly
      features: row.features || [], // PostgreSQL returns JSON directly
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
      (SELECT json_agg(
        json_build_object(
          'id', pi.id,
          'imageUrl', pi.imageUrl,
          'thumbnailUrl', pi.thumbnailUrl,
          'isPrimary', pi.isPrimary,
          'displayOrder', pi.displayOrder
        )
        ORDER BY pi.displayOrder
      )
      FROM property_images pi
      WHERE pi.propertyId = p.id) as images,
      (SELECT json_agg(pf.feature)
      FROM property_features pf
      WHERE pf.propertyId = p.id) as features
    FROM properties p
    WHERE p.mlsNumber = $1
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
      images: row.images || [], // PostgreSQL returns JSON directly
      features: row.features || [], // PostgreSQL returns JSON directly
      price: parseFloat(row.price)
    };

    res.json({ property });
  });
});

module.exports = router;

