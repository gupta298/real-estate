const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Advanced search endpoint
router.post('/', (req, res) => {
  try {
    const {
      query,
      city,
      state,
      zipCode,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      propertyType,
      minSquareFeet,
      maxSquareFeet,
      minLotSize,
      maxLotSize,
      yearBuilt,
      features,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.body;

    let whereConditions = ['status = ?'];
    let params = ['active'];

    // Text search
    if (query) {
      whereConditions.push(`(
        title LIKE ? OR
        description LIKE ? OR
        address LIKE ? OR
        city LIKE ?
      )`);
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Location filters
    if (city) {
      whereConditions.push('city = ?');
      params.push(city);
    }

    if (state) {
      whereConditions.push('state = ?');
      params.push(state);
    }

    if (zipCode) {
      whereConditions.push('zipCode = ?');
      params.push(zipCode);
    }

    // Price range
    if (minPrice) {
      whereConditions.push('price >= ?');
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      whereConditions.push('price <= ?');
      params.push(parseFloat(maxPrice));
    }

    // Property details
    if (bedrooms) {
      whereConditions.push('bedrooms >= ?');
      params.push(parseInt(bedrooms));
    }

    if (bathrooms) {
      whereConditions.push('bathrooms >= ?');
      params.push(parseFloat(bathrooms));
    }

    if (propertyType) {
      if (Array.isArray(propertyType)) {
        whereConditions.push(`propertyType IN (${propertyType.map(() => '?').join(',')})`);
        params.push(...propertyType);
      } else {
        whereConditions.push('propertyType = ?');
        params.push(propertyType);
      }
    }

    if (minSquareFeet) {
      whereConditions.push('squareFeet >= ?');
      params.push(parseInt(minSquareFeet));
    }

    if (maxSquareFeet) {
      whereConditions.push('squareFeet <= ?');
      params.push(parseInt(maxSquareFeet));
    }

    if (minLotSize) {
      whereConditions.push('lotSize >= ?');
      params.push(parseFloat(minLotSize));
    }

    if (maxLotSize) {
      whereConditions.push('lotSize <= ?');
      params.push(parseFloat(maxLotSize));
    }

    if (yearBuilt) {
      whereConditions.push('yearBuilt >= ?');
      params.push(parseInt(yearBuilt));
    }

    const whereClause = whereConditions.join(' AND ');

    // Valid sort columns
    const validSortColumns = ['price', 'createdAt', 'squareFeet', 'bedrooms', 'bathrooms'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM properties WHERE ${whereClause}`;
    
    db.get(countQuery, params, (err, countRow) => {
      if (err) {
        console.error('Error counting search results:', err);
        return res.status(500).json({ error: 'Search failed' });
      }

      const total = countRow.total;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Get properties with images
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
        WHERE ${whereClause}
        ORDER BY p.${sortColumn} ${order}
        LIMIT ? OFFSET ?
      `;

      const queryParams = [...params, parseInt(limit), offset];

      db.all(query, queryParams, (err, rows) => {
        if (err) {
          console.error('Error searching properties:', err);
          return res.status(500).json({ error: 'Search failed' });
        }

        // Filter by features if specified
        let properties = rows.map(row => ({
          ...row,
          images: row.images ? JSON.parse(row.images) : [],
          price: parseFloat(row.price)
        }));

        // If features filter is specified, get properties with those features
        if (features && Array.isArray(features) && features.length > 0) {
          const propertyIds = properties.map(p => p.id);
          const placeholders = propertyIds.map(() => '?').join(',');
          const featurePlaceholders = features.map(() => '?').join(',');

          const featureQuery = `
            SELECT DISTINCT propertyId
            FROM property_features
            WHERE propertyId IN (${placeholders})
            AND feature IN (${featurePlaceholders})
            GROUP BY propertyId
            HAVING COUNT(DISTINCT feature) = ?
          `;

          db.all(featureQuery, [...propertyIds, ...features, features.length], (err, featureRows) => {
            if (err) {
              console.error('Error filtering by features:', err);
              return res.status(500).json({ error: 'Search failed' });
            }

            const validPropertyIds = new Set(featureRows.map(r => r.propertyId));
            properties = properties.filter(p => validPropertyIds.has(p.id));

            res.json({
              properties,
              pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: properties.length,
                totalPages: Math.ceil(properties.length / parseInt(limit))
              }
            });
          });
        } else {
          res.json({
            properties,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total,
              totalPages: Math.ceil(total / parseInt(limit))
            }
          });
        }
      });
    });
  } catch (error) {
    console.error('Error in search:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get search suggestions (cities, property types, etc.)
router.get('/suggestions', (req, res) => {
  const { type, query } = req.query;

  if (type === 'cities') {
    db.all(
      `SELECT DISTINCT city, state, COUNT(*) as count
       FROM properties
       WHERE status = 'active' AND city LIKE ?
       GROUP BY city, state
       ORDER BY count DESC
       LIMIT 10`,
      [`%${query || ''}%`],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch suggestions' });
        }
        res.json({ suggestions: rows });
      }
    );
  } else if (type === 'propertyTypes') {
    db.all(
      `SELECT DISTINCT propertyType, COUNT(*) as count
       FROM properties
       WHERE status = 'active'
       GROUP BY propertyType
       ORDER BY count DESC`,
      [],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch suggestions' });
        }
        res.json({ suggestions: rows });
      }
    );
  } else {
    res.json({ suggestions: [] });
  }
});

module.exports = router;

