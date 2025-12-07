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

    let whereConditions = ['status = $1'];
    let params = ['active'];
    let paramCounter = 2;

    // Text search
    if (query) {
      whereConditions.push(`(
        title LIKE $${paramCounter} OR
        description LIKE $${paramCounter+1} OR
        address LIKE $${paramCounter+2} OR
        city LIKE $${paramCounter+3}
      )`);
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      paramCounter += 4;
    }

    // Location filters
    if (city) {
      whereConditions.push(`city = $${paramCounter}`);
      params.push(city);
      paramCounter++;
    }

    if (state) {
      whereConditions.push(`state = $${paramCounter}`);
      params.push(state);
      paramCounter++;
    }

    if (zipCode) {
      whereConditions.push(`zipCode = $${paramCounter}`);
      params.push(zipCode);
      paramCounter++;
    }

    // Price range
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

    // Property details
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

    if (propertyType) {
      if (Array.isArray(propertyType)) {
        const placeholders = propertyType.map((_, i) => `$${paramCounter + i}`).join(',');
        whereConditions.push(`propertyType IN (${placeholders})`);
        params.push(...propertyType);
        paramCounter += propertyType.length;
      } else {
        whereConditions.push(`propertyType = $${paramCounter}`);
        params.push(propertyType);
        paramCounter++;
      }
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

    if (minLotSize) {
      whereConditions.push(`lotSize >= $${paramCounter}`);
      params.push(parseFloat(minLotSize));
      paramCounter++;
    }

    if (maxLotSize) {
      whereConditions.push(`lotSize <= $${paramCounter}`);
      params.push(parseFloat(maxLotSize));
      paramCounter++;
    }

    if (yearBuilt) {
      whereConditions.push(`yearBuilt >= $${paramCounter}`);
      params.push(parseInt(yearBuilt));
      paramCounter++;
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
        WHERE ${whereClause}
        ORDER BY p.${sortColumn} ${order}
        LIMIT $${paramCounter} OFFSET $${paramCounter+1}
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
          images: row.images || [], // PostgreSQL returns JSON directly
          price: parseFloat(row.price)
        }));

        // If features filter is specified, get properties with those features
        if (features && Array.isArray(features) && features.length > 0) {
          const propertyIds = properties.map(p => p.id);
          // Generate PostgreSQL parameter placeholders ($1, $2, etc.)
          let featureParamCounter = 1;
          const propPlaceholders = propertyIds.map(() => `$${featureParamCounter++}`).join(',');
          const featurePlaceholders = features.map(() => `$${featureParamCounter++}`).join(',');

          const featureQuery = `
            SELECT DISTINCT propertyId
            FROM property_features
            WHERE propertyId IN (${propPlaceholders})
            AND feature IN (${featurePlaceholders})
            GROUP BY propertyId
            HAVING COUNT(DISTINCT feature) = $${featureParamCounter}
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
       WHERE status = 'active' AND city LIKE $1
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

