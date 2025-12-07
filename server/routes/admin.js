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

// Health check for admin API - OPTIMIZED with direct connection
router.get('/health', authenticate, requireAdmin, async (req, res) => {
  console.log('🏥 Admin API health check requested');
  try {
    // Try a very simple query to test DB connectivity
    const startTime = Date.now();
    const client = await db.pool.connect();
    await client.query('SELECT 1 as health');
    client.release();
    const duration = Date.now() - startTime;
    console.log(`✅ Admin database health check successful in ${duration}ms`);
    res.json({ status: 'healthy', dbResponseTime: `${duration}ms` });
  } catch (err) {
    console.error('❌ Admin database health check failed:', err.message);
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

// ========== FEATURED LISTINGS MANAGEMENT ==========

// Toggle featured status of a property - OPTIMIZED with direct connection
router.post('/properties/:id/featured', authenticate, requireAdmin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /admin/properties/${req.params.id}/featured`);
  const propertyId = req.params.id;
  const { featured } = req.body;
  
  try {
    const client = await db.pool.connect();
    try {
      await client.query(
        'UPDATE properties SET featured = $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2',
        [featured ? true : false, propertyId]
      );
      client.release();
      
      res.json({
        success: true,
        message: `Property ${featured ? 'featured' : 'unfeatured'} successfully`
      });
    } catch (err) {
      client.release();
      console.error('Error updating featured status:', err);
      return res.status(500).json({ error: 'Failed to update featured status', details: err.message });
    }
  } catch (err) {
    console.error('Error connecting to database:', err);
    return res.status(500).json({ error: 'Failed to connect to database', details: err.message });
  }
});

// Get all properties for management (with featured status) - OPTIMIZED with direct connection
router.get('/properties', authenticate, requireAdmin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /admin/properties`);
  const { page = 1, limit = 50, search, isOffMarket, featured } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Set a safety timeout to prevent hanging requests
  const requestTimeout = setTimeout(() => {
    console.error('⚠️ EMERGENCY TIMEOUT - Admin properties request taking too long');
    return res.status(504).json({ 
      error: 'Request timeout', 
      _emergency: true,
      message: 'Request timed out, try with fewer items or more specific filters'
    });
  }, 20000); // 20 second safety net
  
  try {
    // Step 1: Get direct connection
    const client = await db.pool.connect();
    const startTime = Date.now();
    
    try {
      // Step 2: Build the query
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

      // Step 3: Get the total count with a simple query
      console.log('Step 1: Getting total count');
      const countQuery = `SELECT COUNT(*) as total FROM properties ${whereClause}`;
      const countResult = await client.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);
      console.log(`Total properties: ${total} (query took ${Date.now() - startTime}ms)`);
      
      // Step 4: Get properties with a simpler query approach
      console.log('Step 2: Getting properties');
      const propertiesQuery = `
        SELECT * FROM properties p
        ${whereClause}
        ORDER BY p.featured DESC, p.createdAt DESC
        LIMIT $${paramCounter} OFFSET $${paramCounter+1}
      `;
      
      const queryParams = [...params, parseInt(limit), offset];
      const propertiesResult = await client.query(propertiesQuery, queryParams);
      const properties = propertiesResult.rows;
      console.log(`Got ${properties.length} properties (query took ${Date.now() - startTime}ms)`);
      
      // Step 5: Get primary images for these properties
      const propertyIds = properties.map(p => p.id);
      let propertyImages = [];
      
      if (propertyIds.length > 0) {
        try {
          console.log('Step 3: Getting property images');
          const imagesQuery = `
            SELECT * FROM property_images 
            WHERE propertyId IN (${propertyIds.map((_, i) => `$${i+1}`).join(',')}) 
            AND isPrimary = true
          `;
          const imagesResult = await client.query(imagesQuery, propertyIds);
          propertyImages = imagesResult.rows;
          console.log(`Got ${propertyImages.length} property images (query took ${Date.now() - startTime}ms)`);
        } catch (imgErr) {
          console.warn('Warning: Could not fetch property images:', imgErr.message);
        }
      }
      
      // Step 6: Group images by propertyId
      const imagesByPropertyId = {};
      propertyImages.forEach(img => {
        if (!imagesByPropertyId[img.propertyid]) {
          imagesByPropertyId[img.propertyid] = [];
        }
        imagesByPropertyId[img.propertyid].push(img);
      });
      
      // Step 7: Combine data
      const result = properties.map(property => ({
        ...property,
        images: imagesByPropertyId[property.id] || [],
        price: parseFloat(property.price),
        featured: typeof property.featured === 'boolean' ? property.featured : property.featured === 1
      }));
      
      // Release the client and return results
      client.release();
      clearTimeout(requestTimeout);
      console.log(`Admin properties request completed in ${Date.now() - startTime}ms`);
      
      res.json({
        properties: result,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (err) {
      client.release();
      clearTimeout(requestTimeout);
      console.error('Error processing properties:', err);
      return res.status(500).json({ error: 'Failed to fetch properties', details: err.message });
    }
  } catch (err) {
    clearTimeout(requestTimeout);
    console.error('Error connecting to database:', err);
    return res.status(500).json({ error: 'Failed to connect to database', details: err.message });
  }
});

// ========== OFF-MARKET DEALS MANAGEMENT ==========

// Get unique property types and sub-types for autocomplete - OPTIMIZED with direct connection
router.get('/off-market-deals/options', authenticate, requireAdmin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /admin/off-market-deals/options`);
  
  try {
    // Get direct connection
    const client = await db.pool.connect();
    
    try {
      const query = `
        SELECT DISTINCT propertyType, propertySubType
        FROM off_market_deals
        WHERE propertyType IS NOT NULL OR propertySubType IS NOT NULL
      `;
      
      const result = await client.query(query);
      client.release();

      const propertyTypes = new Set();
      const propertySubTypes = new Set();

      result.rows.forEach(row => {
        if (row.propertyType) propertyTypes.add(row.propertyType);
        if (row.propertySubType) propertySubTypes.add(row.propertySubType);
      });

      res.json({
        propertyTypes: Array.from(propertyTypes).sort(),
        propertySubTypes: Array.from(propertySubTypes).sort()
      });
    } catch (err) {
      client.release();
      console.error('Error fetching property options:', err);
      return res.status(500).json({ error: 'Failed to fetch property options', details: err.message });
    }
  } catch (err) {
    console.error('Error connecting to database:', err);
    return res.status(500).json({ error: 'Failed to connect to database', details: err.message });
  }
});

// Get all off-market deals - OPTIMIZED with direct connection
router.get('/off-market-deals', authenticate, requireAdmin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /admin/off-market-deals`);
  const { active } = req.query;
  
  // Set a safety timeout to prevent hanging requests
  const requestTimeout = setTimeout(() => {
    console.error('⚠️ EMERGENCY TIMEOUT - Admin off-market deals request taking too long');
    return res.json({ 
      deals: [], 
      _emergency: true,
      message: 'Request timed out, returning empty deals to prevent complete failure'
    });
  }, 15000); // 15 second safety net

  try {
    const startTime = Date.now();
    const client = await db.pool.connect();
    
    try {
      // Step 1: Get deals with a simpler query
      console.log('⏱️ Getting off-market deals');
      let dealsQuery = `SELECT * FROM off_market_deals d`;
      let params = [];
      
      if (active === 'true') {
        dealsQuery += ' WHERE d.isActive = true';
      } else if (active === 'false') {
        dealsQuery += ' WHERE d.isActive = false';
      }

      dealsQuery += ' ORDER BY d.isHotDeal DESC, d.displayOrder ASC, d.createdAt DESC';
      
      const dealsResult = await client.query(dealsQuery, params);
      const deals = dealsResult.rows;
      console.log(`⏱️ Got ${deals.length} deals in ${Date.now() - startTime}ms`);
      
      if (deals.length === 0) {
        client.release();
        clearTimeout(requestTimeout);
        return res.json({ deals: [] });
      }
      
      // Step 2: Get images for all deals
      console.log('⏱️ Getting deal images');
      const dealIds = deals.map(d => d.id);
      let dealImages = [];
      
      if (dealIds.length > 0) {
        try {
          const imagesQuery = `
            SELECT * FROM off_market_deal_images 
            WHERE dealId IN (${dealIds.map((_, i) => `$${i+1}`).join(',')}) 
            ORDER BY dealId, displayOrder
          `;
          const imagesResult = await client.query(imagesQuery, dealIds);
          dealImages = imagesResult.rows;
          console.log(`⏱️ Got ${dealImages.length} deal images in ${Date.now() - startTime}ms`);
        } catch (imgErr) {
          console.warn('Warning: Could not fetch deal images:', imgErr.message);
        }
      }
      
      // Step 3: Group images by dealId
      const imagesByDealId = {};
      dealImages.forEach(img => {
        if (!imagesByDealId[img.dealid]) {
          imagesByDealId[img.dealid] = [];
        }
        imagesByDealId[img.dealid].push(img);
      });
      
      // Step 4: Combine data
      const result = deals.map(deal => ({
        ...deal,
        images: imagesByDealId[deal.id] || [],
        videos: [],  // No videos in this endpoint, but keeping for compatibility
        thumbnailUrl: deal.thumbnailUrl || null,
        thumbnailType: deal.thumbnailType || null,
        isActive: typeof deal.isActive === 'boolean' ? deal.isActive : deal.isActive === 1,
        isHotDeal: typeof deal.isHotDeal === 'boolean' ? deal.isHotDeal : deal.isHotDeal === 1
      }));
      
      // Release the client and return results
      client.release();
      clearTimeout(requestTimeout);
      console.log(`⏱️ Admin off-market deals request completed in ${Date.now() - startTime}ms`);
      
      res.json({ deals: result });
    } catch (err) {
      client.release();
      clearTimeout(requestTimeout);
      console.error('Error processing off-market deals:', err);
      return res.status(500).json({ error: 'Failed to fetch off-market deals', details: err.message });
    }
  } catch (err) {
    clearTimeout(requestTimeout);
    console.error('Error connecting to database:', err);
    return res.status(500).json({ error: 'Failed to connect to database', details: err.message });
  }
});

// Get single off-market deal - OPTIMIZED with direct connection
router.get('/off-market-deals/:id', authenticate, requireAdmin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /admin/off-market-deals/${req.params.id}`);
  const dealId = req.params.id;
  
  // Set a safety timeout to prevent hanging requests
  const requestTimeout = setTimeout(() => {
    console.error('⚠️ EMERGENCY TIMEOUT - Admin single off-market deal request taking too long');
    return res.status(504).json({ 
      error: 'Request timeout', 
      _emergency: true,
      message: 'Request timed out'
    });
  }, 10000); // 10 second safety net

  try {
    const startTime = Date.now();
    const client = await db.pool.connect();
    
    try {
      // Step 1: Get the deal
      console.log('⏱️ Getting single off-market deal');
      const dealQuery = `SELECT * FROM off_market_deals WHERE id = $1`;
      const dealResult = await client.query(dealQuery, [dealId]);
      
      if (dealResult.rows.length === 0) {
        client.release();
        clearTimeout(requestTimeout);
        return res.status(404).json({ error: 'Off-market deal not found' });
      }
      
      const deal = dealResult.rows[0];
      console.log(`⏱️ Found deal ${deal.id} in ${Date.now() - startTime}ms`);
      
      // Step 2: Get images
      console.log('⏱️ Getting deal images');
      let dealImages = [];
      try {
        const imagesQuery = `
          SELECT * FROM off_market_deal_images 
          WHERE dealId = $1 
          ORDER BY displayOrder
        `;
        const imagesResult = await client.query(imagesQuery, [dealId]);
        dealImages = imagesResult.rows;
        console.log(`⏱️ Got ${dealImages.length} deal images in ${Date.now() - startTime}ms`);
      } catch (imgErr) {
        console.warn('Warning: Could not fetch deal images:', imgErr.message);
      }
      
      // Step 3: Get videos
      console.log('⏱️ Getting deal videos');
      let dealVideos = [];
      try {
        const videosQuery = `
          SELECT * FROM off_market_deal_videos 
          WHERE dealId = $1 
          ORDER BY displayOrder
        `;
        const videosResult = await client.query(videosQuery, [dealId]);
        dealVideos = videosResult.rows;
        console.log(`⏱️ Got ${dealVideos.length} deal videos in ${Date.now() - startTime}ms`);
      } catch (vidErr) {
        console.warn('Warning: Could not fetch deal videos:', vidErr.message);
      }
      
      // Step 4: Combine data
      const result = {
        ...deal,
        images: dealImages || [],
        videos: dealVideos || [],
        thumbnailUrl: deal.thumbnailUrl || null,
        thumbnailType: deal.thumbnailType || null,
        isActive: typeof deal.isActive === 'boolean' ? deal.isActive : deal.isActive === 1,
        isHotDeal: typeof deal.isHotDeal === 'boolean' ? deal.isHotDeal : deal.isHotDeal === 1
      };
      
      // Release the client and return results
      client.release();
      clearTimeout(requestTimeout);
      console.log(`⏱️ Admin single deal request completed in ${Date.now() - startTime}ms`);
      
      res.json({ deal: result });
    } catch (err) {
      client.release();
      clearTimeout(requestTimeout);
      console.error('Error processing single off-market deal:', err);
      return res.status(500).json({ error: 'Failed to fetch off-market deal', details: err.message });
    }
  } catch (err) {
    clearTimeout(requestTimeout);
    console.error('Error connecting to database:', err);
    return res.status(500).json({ error: 'Failed to connect to database', details: err.message });
  }
});

// Create off-market deal - OPTIMIZED with direct connection
router.post('/off-market-deals', authenticate, requireAdmin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /admin/off-market-deals`);
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

  // Set a safety timeout to prevent hanging requests
  const requestTimeout = setTimeout(() => {
    console.error('⚠️ EMERGENCY TIMEOUT - Create off-market deal request taking too long');
    return res.status(504).json({ 
      error: 'Request timeout', 
      _emergency: true,
      message: 'Request timed out'
    });
  }, 30000); // 30 second safety net (longer for create operations)
  
  try {
    const startTime = Date.now();
    const client = await db.pool.connect();
    
    try {
      // Begin transaction for all operations
      await client.query('BEGIN');
      
      // Step 1: Insert the off-market deal
      console.log('⏱️ Creating off-market deal');
      const dealQuery = `
        INSERT INTO off_market_deals 
        (title, content, propertyType, propertySubType, area, status, contactName, contactPhone, contactEmail, contactTitle, thumbnailUrl, thumbnailType, isActive, isHotDeal, displayOrder)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id
      `;
      
      const dealResult = await client.query(dealQuery, [
        title, 
        content, 
        propertyType || null, 
        propertySubType || null, 
        area || null, 
        status || 'open', 
        contactName || null, 
        contactPhone || null, 
        contactEmail || null, 
        contactTitle || null, 
        thumbnailUrl || null, 
        thumbnailType || null, 
        isActive ? true : false, 
        isHotDeal ? true : false, 
        displayOrder
      ]);
      
      const dealId = dealResult.rows[0].id;
      console.log(`⏱️ Created deal ${dealId} in ${Date.now() - startTime}ms`);
      
      // Step 2: Insert images if provided
      if (images && images.length > 0) {
        console.log('⏱️ Adding images to deal');
        for (const [index, img] of images.entries()) {
          const imageQuery = `
            INSERT INTO off_market_deal_images (dealId, imageUrl, thumbnailUrl, displayOrder, caption)
            VALUES ($1, $2, $3, $4, $5)
          `;
          
          await client.query(imageQuery, [
            dealId,
            img.imageUrl,
            img.thumbnailUrl || img.imageUrl,
            img.displayOrder !== undefined ? img.displayOrder : index,
            img.caption || null
          ]);
        }
        console.log(`⏱️ Added ${images.length} images in ${Date.now() - startTime}ms`);
      }
      
      // Step 3: Insert videos if provided
      if (videos && videos.length > 0) {
        console.log('⏱️ Adding videos to deal');
        for (const [index, vid] of videos.entries()) {
          const videoQuery = `
            INSERT INTO off_market_deal_videos (dealId, videoUrl, thumbnailUrl, displayOrder, caption)
            VALUES ($1, $2, $3, $4, $5)
          `;
          
          await client.query(videoQuery, [
            dealId,
            vid.videoUrl,
            vid.thumbnailUrl || null,
            vid.displayOrder !== undefined ? vid.displayOrder : index,
            vid.caption || null
          ]);
        }
        console.log(`⏱️ Added ${videos.length} videos in ${Date.now() - startTime}ms`);
      }
      
      // Step 4: Commit the transaction
      await client.query('COMMIT');
      
      // Release the client and return result
      client.release();
      clearTimeout(requestTimeout);
      console.log(`⏱️ Create off-market deal completed in ${Date.now() - startTime}ms`);
      
      res.json({
        success: true,
        dealId,
        message: 'Off-market deal created successfully'
      });
    } catch (err) {
      // Rollback on error
      await client.query('ROLLBACK');
      client.release();
      clearTimeout(requestTimeout);
      console.error('Error creating off-market deal:', err);
      return res.status(500).json({ error: 'Failed to create off-market deal', details: err.message });
    }
  } catch (err) {
    clearTimeout(requestTimeout);
    console.error('Error connecting to database:', err);
    return res.status(500).json({ error: 'Failed to connect to database', details: err.message });
  }
});

// Update off-market deal - OPTIMIZED with direct connection
router.put('/off-market-deals/:id', authenticate, requireAdmin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] PUT /admin/off-market-deals/${req.params.id}`);
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

  // Set a safety timeout to prevent hanging requests
  const requestTimeout = setTimeout(() => {
    console.error('⚠️ EMERGENCY TIMEOUT - Update off-market deal request taking too long');
    return res.status(504).json({ 
      error: 'Request timeout', 
      _emergency: true,
      message: 'Request timed out'
    });
  }, 30000); // 30 second safety net (longer for update operations)
  
  try {
    const startTime = Date.now();
    const client = await db.pool.connect();
    
    try {
      // Begin transaction for all operations
      await client.query('BEGIN');
      
      // Step 1: Update the off-market deal
      console.log('⏱️ Updating off-market deal');
      const updateQuery = `
        UPDATE off_market_deals SET
          title = $1, content = $2, propertyType = $3, propertySubType = $4, area = $5, status = $6,
          contactName = $7, contactPhone = $8,
          contactEmail = $9, contactTitle = $10, thumbnailUrl = $11, thumbnailType = $12,
          isActive = $13, isHotDeal = $14,
          displayOrder = $15, updatedAt = CURRENT_TIMESTAMP
        WHERE id = $16
      `;
      
      await client.query(updateQuery, [
        title, 
        content, 
        propertyType || null, 
        propertySubType || null, 
        area || null, 
        status || 'open',
        contactName || null, 
        contactPhone || null,
        contactEmail || null, 
        contactTitle || null, 
        thumbnailUrl || null, 
        thumbnailType || null,
        isActive ? true : false, 
        isHotDeal ? true : false, 
        displayOrder || 0, 
        dealId
      ]);
      
      console.log(`⏱️ Updated deal base info in ${Date.now() - startTime}ms`);
      
      // Step 2: Update images if provided
      if (images !== undefined) {
        console.log('⏱️ Updating deal images');
        // Delete existing images
        await client.query('DELETE FROM off_market_deal_images WHERE dealId = $1', [dealId]);
        
        // Insert new images
        if (Array.isArray(images) && images.length > 0) {
          for (const [index, img] of images.entries()) {
            const imageQuery = `
              INSERT INTO off_market_deal_images (dealId, imageUrl, thumbnailUrl, displayOrder, caption)
              VALUES ($1, $2, $3, $4, $5)
            `;
            
            await client.query(imageQuery, [
              dealId,
              img.imageUrl,
              img.thumbnailUrl || img.imageUrl,
              img.displayOrder !== undefined ? img.displayOrder : index,
              img.caption || null
            ]);
          }
          console.log(`⏱️ Updated ${images.length} images in ${Date.now() - startTime}ms`);
        }
      }
      
      // Step 3: Update videos if provided
      if (videos !== undefined) {
        console.log('⏱️ Updating deal videos');
        // Delete existing videos
        await client.query('DELETE FROM off_market_deal_videos WHERE dealId = $1', [dealId]);
        
        // Insert new videos
        if (Array.isArray(videos) && videos.length > 0) {
          for (const [index, vid] of videos.entries()) {
            const videoQuery = `
              INSERT INTO off_market_deal_videos (dealId, videoUrl, thumbnailUrl, displayOrder, caption)
              VALUES ($1, $2, $3, $4, $5)
            `;
            
            await client.query(videoQuery, [
              dealId,
              vid.videoUrl,
              vid.thumbnailUrl || null,
              vid.displayOrder !== undefined ? vid.displayOrder : index,
              vid.caption || null
            ]);
          }
          console.log(`⏱️ Updated ${videos.length} videos in ${Date.now() - startTime}ms`);
        }
      }
      
      // Step 4: Commit the transaction
      await client.query('COMMIT');
      
      // Release the client and return result
      client.release();
      clearTimeout(requestTimeout);
      console.log(`⏱️ Update off-market deal completed in ${Date.now() - startTime}ms`);
      
      res.json({
        success: true,
        message: 'Off-market deal updated successfully'
      });
    } catch (err) {
      // Rollback on error
      await client.query('ROLLBACK');
      client.release();
      clearTimeout(requestTimeout);
      console.error('Error updating off-market deal:', err);
      return res.status(500).json({ error: 'Failed to update off-market deal', details: err.message });
    }
  } catch (err) {
    clearTimeout(requestTimeout);
    console.error('Error connecting to database:', err);
    return res.status(500).json({ error: 'Failed to connect to database', details: err.message });
  }
});

// Delete off-market deal - OPTIMIZED with direct connection
router.delete('/off-market-deals/:id', authenticate, requireAdmin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] DELETE /admin/off-market-deals/${req.params.id}`);
  const dealId = req.params.id;
  
  try {
    const startTime = Date.now();
    const client = await db.pool.connect();
    
    try {
      // Delete the off-market deal
      const result = await client.query('DELETE FROM off_market_deals WHERE id = $1', [dealId]);
      client.release();
      
      // Check if any rows were affected
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Off-market deal not found' });
      }
      
      console.log(`⏱️ Deleted off-market deal in ${Date.now() - startTime}ms`);
      res.json({
        success: true,
        message: 'Off-market deal deleted successfully'
      });
    } catch (err) {
      client.release();
      console.error('Error deleting off-market deal:', err);
      return res.status(500).json({ error: 'Failed to delete off-market deal', details: err.message });
    }
  } catch (err) {
    console.error('Error connecting to database:', err);
    return res.status(500).json({ error: 'Failed to connect to database', details: err.message });
  }
});

// ========== BLOG MANAGEMENT ==========

// Get all blogs (admin) - OPTIMIZED with direct connection
router.get('/blogs', authenticate, requireAdmin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /admin/blogs`);
  
  // Set a safety timeout to prevent hanging requests
  const requestTimeout = setTimeout(() => {
    console.error('⚠️ EMERGENCY TIMEOUT - Admin blogs request taking too long');
    return res.json({ 
      blogs: [], 
      _emergency: true,
      message: 'Request timed out, returning empty blogs to prevent complete failure'
    });
  }, 15000); // 15 second safety net
  
  const startTime = Date.now();
  
  try {
    // Step 1: Get direct connection
    const client = await db.pool.connect();
    
    try {
      // Step 2: Get blogs with a simpler query
      console.log('⏱️ Step 1: Getting blogs');
      const blogsQuery = `
        SELECT * FROM blogs
        ORDER BY createdAt DESC
      `;
      
      const blogsResult = await client.query(blogsQuery);
      const blogs = blogsResult.rows;
      console.log(`⏱️ Got ${blogs.length} blogs in ${Date.now() - startTime}ms`);
      
      if (blogs.length === 0) {
        client.release();
        clearTimeout(requestTimeout);
        return res.json({ blogs: [] });
      }
      
      // Step 3: Get images for all blogs
      console.log('⏱️ Step 2: Getting blog images');
      const blogIds = blogs.map(b => b.id);
      let blogImages = [];
      
      if (blogIds.length > 0) {
        try {
          const imagesQuery = `
            SELECT * FROM blog_images 
            WHERE blogId IN (${blogIds.map((_, i) => `$${i+1}`).join(',')}) 
            ORDER BY blogId, displayOrder
          `;
          const imagesResult = await client.query(imagesQuery, blogIds);
          blogImages = imagesResult.rows;
          console.log(`⏱️ Got ${blogImages.length} blog images in ${Date.now() - startTime}ms`);
        } catch (imgErr) {
          console.warn('Warning: Could not fetch blog images:', imgErr.message);
        }
      }
      
      // Step 4: Group images by blogId
      const imagesByBlogId = {};
      blogImages.forEach(img => {
        if (!imagesByBlogId[img.blogid]) {
          imagesByBlogId[img.blogid] = [];
        }
        imagesByBlogId[img.blogid].push(img);
      });
      
      // Step 5: Combine data
      const result = blogs.map(blog => ({
        ...blog,
        images: imagesByBlogId[blog.id] || [],
        isPublished: typeof blog.isPublished === 'boolean' ? blog.isPublished : blog.isPublished === 1
      }));
      
      // Release the client and return results
      client.release();
      clearTimeout(requestTimeout);
      console.log(`⏱️ Admin blogs request completed in ${Date.now() - startTime}ms`);
      
      res.json({ blogs: result });
    } catch (err) {
      client.release();
      clearTimeout(requestTimeout);
      console.error('Error processing blogs:', err);
      return res.status(500).json({ error: 'Failed to fetch blogs', details: err.message });
    }
  } catch (err) {
    clearTimeout(requestTimeout);
    console.error('Error connecting to database:', err);
    return res.status(500).json({ error: 'Failed to connect to database', details: err.message });
  }
});

// Get single blog (admin) - OPTIMIZED with direct connection
router.get('/blogs/:id', authenticate, requireAdmin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /admin/blogs/${req.params.id}`);
  const blogId = req.params.id;
  
  // Set a safety timeout to prevent hanging requests
  const requestTimeout = setTimeout(() => {
    console.error('⚠️ EMERGENCY TIMEOUT - Admin single blog request taking too long');
    return res.status(504).json({ 
      error: 'Request timeout', 
      _emergency: true,
      message: 'Request timed out'
    });
  }, 10000); // 10 second safety net

  try {
    const startTime = Date.now();
    const client = await db.pool.connect();
    
    try {
      // Step 1: Get the blog
      console.log('⏱️ Getting single blog');
      const blogQuery = `SELECT * FROM blogs WHERE id = $1`;
      const blogResult = await client.query(blogQuery, [blogId]);
      
      if (blogResult.rows.length === 0) {
        client.release();
        clearTimeout(requestTimeout);
        return res.status(404).json({ error: 'Blog not found' });
      }
      
      const blog = blogResult.rows[0];
      console.log(`⏱️ Found blog ${blog.id} in ${Date.now() - startTime}ms`);
      
      // Step 2: Get images
      console.log('⏱️ Getting blog images');
      let blogImages = [];
      try {
        const imagesQuery = `
          SELECT * FROM blog_images 
          WHERE blogId = $1 
          ORDER BY displayOrder
        `;
        const imagesResult = await client.query(imagesQuery, [blogId]);
        blogImages = imagesResult.rows;
        console.log(`⏱️ Got ${blogImages.length} blog images in ${Date.now() - startTime}ms`);
      } catch (imgErr) {
        console.warn('Warning: Could not fetch blog images:', imgErr.message);
      }
      
      // Step 3: Get videos
      console.log('⏱️ Getting blog videos');
      let blogVideos = [];
      try {
        const videosQuery = `
          SELECT * FROM blog_videos 
          WHERE blogId = $1 
          ORDER BY displayOrder
        `;
        const videosResult = await client.query(videosQuery, [blogId]);
        blogVideos = videosResult.rows;
        console.log(`⏱️ Got ${blogVideos.length} blog videos in ${Date.now() - startTime}ms`);
      } catch (vidErr) {
        console.warn('Warning: Could not fetch blog videos:', vidErr.message);
      }
      
      // Step 4: Combine data
      const result = {
        ...blog,
        images: blogImages || [],
        videos: blogVideos || [],
        isPublished: typeof blog.isPublished === 'boolean' ? blog.isPublished : blog.isPublished === 1
      };
      
      // Release the client and return results
      client.release();
      clearTimeout(requestTimeout);
      console.log(`⏱️ Admin single blog request completed in ${Date.now() - startTime}ms`);
      
      res.json({ blog: result });
    } catch (err) {
      client.release();
      clearTimeout(requestTimeout);
      console.error('Error processing single blog:', err);
      return res.status(500).json({ error: 'Failed to fetch blog', details: err.message });
    }
  } catch (err) {
    clearTimeout(requestTimeout);
    console.error('Error connecting to database:', err);
    return res.status(500).json({ error: 'Failed to connect to database', details: err.message });
  }
});

// Create blog - OPTIMIZED with direct connection
router.post('/blogs', authenticate, requireAdmin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /admin/blogs`);
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

  // Set a safety timeout to prevent hanging requests
  const requestTimeout = setTimeout(() => {
    console.error('⚠️ EMERGENCY TIMEOUT - Create blog request taking too long');
    return res.status(504).json({ 
      error: 'Request timeout', 
      _emergency: true,
      message: 'Request timed out'
    });
  }, 30000); // 30 second safety net (longer for create operations)
  
  try {
    const startTime = Date.now();
    const client = await db.pool.connect();
    
    try {
      // Begin transaction for all operations
      await client.query('BEGIN');
      
      // Step 1: Insert the blog
      console.log('⏱️ Creating blog');
      const blogQuery = `
        INSERT INTO blogs (title, content, excerpt, thumbnailUrl, thumbnailType, isPublished)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
      `;
      
      const blogResult = await client.query(blogQuery, [
        title, 
        content, 
        excerpt || null, 
        thumbnailUrl || null, 
        thumbnailType || null, 
        isPublished ? true : false
      ]);
      
      const blogId = blogResult.rows[0].id;
      console.log(`⏱️ Created blog ${blogId} in ${Date.now() - startTime}ms`);
      
      // Step 2: Insert images if provided
      if (images && images.length > 0) {
        console.log('⏱️ Adding images to blog');
        for (const [index, img] of images.entries()) {
          const imageQuery = `
            INSERT INTO blog_images (blogId, imageUrl, thumbnailUrl, displayOrder, caption)
            VALUES ($1, $2, $3, $4, $5)
          `;
          
          await client.query(imageQuery, [
            blogId,
            img.imageUrl,
            img.thumbnailUrl || img.imageUrl,
            img.displayOrder !== undefined ? img.displayOrder : index,
            img.caption || null
          ]);
        }
        console.log(`⏱️ Added ${images.length} images in ${Date.now() - startTime}ms`);
      }
      
      // Step 3: Insert videos if provided
      if (videos && videos.length > 0) {
        console.log('⏱️ Adding videos to blog');
        for (const [index, vid] of videos.entries()) {
          const videoQuery = `
            INSERT INTO blog_videos (blogId, videoUrl, thumbnailUrl, displayOrder, caption)
            VALUES ($1, $2, $3, $4, $5)
          `;
          
          await client.query(videoQuery, [
            blogId,
            vid.videoUrl,
            vid.thumbnailUrl || null,
            vid.displayOrder !== undefined ? vid.displayOrder : index,
            vid.caption || null
          ]);
        }
        console.log(`⏱️ Added ${videos.length} videos in ${Date.now() - startTime}ms`);
      }
      
      // Step 4: Commit the transaction
      await client.query('COMMIT');
      
      // Release the client and return result
      client.release();
      clearTimeout(requestTimeout);
      console.log(`⏱️ Create blog completed in ${Date.now() - startTime}ms`);
      
      res.json({
        success: true,
        blogId,
        message: 'Blog created successfully'
      });
    } catch (err) {
      // Rollback on error
      await client.query('ROLLBACK');
      client.release();
      clearTimeout(requestTimeout);
      console.error('Error creating blog:', err);
      return res.status(500).json({ error: 'Failed to create blog', details: err.message });
    }
  } catch (err) {
    clearTimeout(requestTimeout);
    console.error('Error connecting to database:', err);
    return res.status(500).json({ error: 'Failed to connect to database', details: err.message });
  }
});

// Update blog - OPTIMIZED with direct connection
router.put('/blogs/:id', authenticate, requireAdmin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] PUT /admin/blogs/${req.params.id}`);
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

  // Set a safety timeout to prevent hanging requests
  const requestTimeout = setTimeout(() => {
    console.error('⚠️ EMERGENCY TIMEOUT - Update blog request taking too long');
    return res.status(504).json({ 
      error: 'Request timeout', 
      _emergency: true,
      message: 'Request timed out'
    });
  }, 30000); // 30 second safety net (longer for update operations)
  
  try {
    const startTime = Date.now();
    const client = await db.pool.connect();
    
    try {
      // Begin transaction for all operations
      await client.query('BEGIN');
      
      // Step 1: Update the blog
      console.log('⏱️ Updating blog');
      const updateQuery = `
        UPDATE blogs SET
          title = $1, content = $2, excerpt = $3,
          thumbnailUrl = $4, thumbnailType = $5,
          isPublished = $6, updatedAt = CURRENT_TIMESTAMP
        WHERE id = $7
      `;
      
      const updateResult = await client.query(updateQuery, [
        title, 
        content, 
        excerpt || null,
        thumbnailUrl || null, 
        thumbnailType || null,
        isPublished ? true : false, 
        blogId
      ]);
      
      // Check if blog exists
      if (updateResult.rowCount === 0) {
        await client.query('ROLLBACK');
        client.release();
        clearTimeout(requestTimeout);
        return res.status(404).json({ error: 'Blog not found' });
      }
      
      console.log(`⏱️ Updated blog base info in ${Date.now() - startTime}ms`);
      
      // Step 2: Update images if provided
      if (images !== undefined) {
        console.log('⏱️ Updating blog images');
        // Delete existing images
        await client.query('DELETE FROM blog_images WHERE blogId = $1', [blogId]);
        
        // Insert new images
        if (Array.isArray(images) && images.length > 0) {
          for (const [index, img] of images.entries()) {
            const imageQuery = `
              INSERT INTO blog_images (blogId, imageUrl, thumbnailUrl, displayOrder, caption)
              VALUES ($1, $2, $3, $4, $5)
            `;
            
            await client.query(imageQuery, [
              blogId,
              img.imageUrl,
              img.thumbnailUrl || img.imageUrl,
              img.displayOrder !== undefined ? img.displayOrder : index,
              img.caption || null
            ]);
          }
          console.log(`⏱️ Updated ${images.length} images in ${Date.now() - startTime}ms`);
        }
      }
      
      // Step 3: Update videos if provided
      if (videos !== undefined) {
        console.log('⏱️ Updating blog videos');
        // Delete existing videos
        await client.query('DELETE FROM blog_videos WHERE blogId = $1', [blogId]);
        
        // Insert new videos
        if (Array.isArray(videos) && videos.length > 0) {
          for (const [index, vid] of videos.entries()) {
            const videoQuery = `
              INSERT INTO blog_videos (blogId, videoUrl, thumbnailUrl, displayOrder, caption)
              VALUES ($1, $2, $3, $4, $5)
            `;
            
            await client.query(videoQuery, [
              blogId,
              vid.videoUrl,
              vid.thumbnailUrl || null,
              vid.displayOrder !== undefined ? vid.displayOrder : index,
              vid.caption || null
            ]);
          }
          console.log(`⏱️ Updated ${videos.length} videos in ${Date.now() - startTime}ms`);
        }
      }
      
      // Step 4: Commit the transaction
      await client.query('COMMIT');
      
      // Release the client and return result
      client.release();
      clearTimeout(requestTimeout);
      console.log(`⏱️ Update blog completed in ${Date.now() - startTime}ms`);
      
      res.json({
        success: true,
        message: 'Blog updated successfully'
      });
    } catch (err) {
      // Rollback on error
      await client.query('ROLLBACK');
      client.release();
      clearTimeout(requestTimeout);
      console.error('Error updating blog:', err);
      return res.status(500).json({ error: 'Failed to update blog', details: err.message });
    }
  } catch (err) {
    clearTimeout(requestTimeout);
    console.error('Error connecting to database:', err);
    return res.status(500).json({ error: 'Failed to connect to database', details: err.message });
  }
});

// Delete blog - OPTIMIZED with direct connection
router.delete('/blogs/:id', authenticate, requireAdmin, async (req, res) => {
  console.log(`[${new Date().toISOString()}] DELETE /admin/blogs/${req.params.id}`);
  const blogId = req.params.id;
  
  try {
    const startTime = Date.now();
    const client = await db.pool.connect();
    
    try {
      // Delete the blog
      const result = await client.query('DELETE FROM blogs WHERE id = $1', [blogId]);
      client.release();
      
      // Check if any rows were affected
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Blog not found' });
      }
      
      console.log(`⏱️ Deleted blog in ${Date.now() - startTime}ms`);
      res.json({
        success: true,
        message: 'Blog deleted successfully'
      });
    } catch (err) {
      client.release();
      console.error('Error deleting blog:', err);
      return res.status(500).json({ error: 'Failed to delete blog', details: err.message });
    }
  } catch (err) {
    console.error('Error connecting to database:', err);
    return res.status(500).json({ error: 'Failed to connect to database', details: err.message });
  }
});

module.exports = router;

