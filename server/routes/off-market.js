const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all active off-market deals (public)
// Simple health check for off-market API
router.get('/health', async (req, res) => {
  console.log('🏥 Off-market API health check requested');
  try {
    // Try a very simple query to test DB connectivity
    const startTime = Date.now();
    const client = await db.pool.connect();
    await client.query('SELECT 1 as health');
    client.release();
    const duration = Date.now() - startTime;
    console.log(`✅ Off-market database health check successful in ${duration}ms`);
    res.json({ status: 'healthy', dbResponseTime: `${duration}ms` });
  } catch (err) {
    console.error('❌ Off-market database health check failed:', err.message);
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

// Get all active off-market deals (public) with optimized connection handling
router.get('/', async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /off-market request`);
  console.log('⏱️ Starting off-market retrieval with direct connection approach');
  const { propertyType, propertySubType, status } = req.query;

  // Set a safety timeout to prevent hanging requests
  const requestTimeout = setTimeout(() => {
    console.error('⚠️ EMERGENCY TIMEOUT - Off-market request taking too long');
    return res.json({ 
      deals: [], 
      _emergency: true, 
      _message: 'Request timed out, returning empty deals to prevent complete failure'
    });
  }, 15000); // 15 second safety net
  
  const startTime = Date.now();
  
  try {
    // First try a simplified approach to get just the basic data
    console.log('⏱️ Step 1: Getting direct connection to database');
    const client = await db.pool.connect();
    
    try {
      // Use a simpler query first to get just the off-market deals
      let dealsQuery = `
        SELECT * FROM off_market_deals d
        WHERE d.isActive = true
      `;
      let params = [];
      let paramCounter = 1;

      if (propertyType && propertyType !== 'all') {
        dealsQuery += ` AND d.propertyType = $${paramCounter}`;
        params.push(propertyType);
        paramCounter++;
      }

      if (propertySubType && propertySubType !== 'all') {
        dealsQuery += ` AND d.propertySubType = $${paramCounter}`;
        params.push(propertySubType);
        paramCounter++;
      }

      if (status && status !== 'all') {
        dealsQuery += ` AND d.status = $${paramCounter}`;
        params.push(status);
        paramCounter++;
      }

      dealsQuery += ' ORDER BY d.displayOrder ASC, d.createdAt DESC';
      
      console.log('⏱️ Step 2: Executing off-market deals query');
      const dealsResult = await client.query(dealsQuery, params);
      const deals = dealsResult.rows;
      console.log(`⏱️ Deals fetched in ${Date.now() - startTime}ms - Found ${deals.length} deals`);
      
      // Early return if no deals found
      if (deals.length === 0) {
        client.release();
        clearTimeout(requestTimeout);
        return res.json({ deals: [] });
      }
      
      // Step 3: Get images if there are any deals
      let dealImages = [];
      if (deals.length > 0) {
        try {
          console.log('⏱️ Step 3: Fetching deal images');
          const dealIds = deals.map(d => d.id);
          const imageResult = await client.query(`
            SELECT * FROM off_market_deal_images 
            WHERE dealId IN (${dealIds.map((_, i) => `$${i+1}`).join(',')}) 
            ORDER BY dealId, displayOrder
          `, dealIds);
          dealImages = imageResult.rows;
          console.log(`⏱️ Images fetched in ${Date.now() - startTime}ms - Found ${dealImages.length} images`);
        } catch (err) {
          console.log(`Warning: Could not fetch deal images: ${err.message}`);
          dealImages = [];
        }
      }
      
      // Step 4: Get videos if there are any deals
      let dealVideos = [];
      if (deals.length > 0) {
        try {
          console.log('⏱️ Step 4: Fetching deal videos');
          const dealIds = deals.map(d => d.id);
          const videoResult = await client.query(`
            SELECT * FROM off_market_deal_videos 
            WHERE dealId IN (${dealIds.map((_, i) => `$${i+1}`).join(',')}) 
            ORDER BY dealId, displayOrder
          `, dealIds);
          dealVideos = videoResult.rows;
          console.log(`⏱️ Videos fetched in ${Date.now() - startTime}ms - Found ${dealVideos.length} videos`);
        } catch (err) {
          console.log(`Warning: Could not fetch deal videos: ${err.message}`);
          dealVideos = [];
        }
      }
      
      // Group images by dealId
      const imagesByDealId = {};
      dealImages.forEach(img => {
        if (!imagesByDealId[img.dealid]) imagesByDealId[img.dealid] = [];
        imagesByDealId[img.dealid].push(img);
      });
      
      // Group videos by dealId
      const videosByDealId = {};
      dealVideos.forEach(vid => {
        if (!videosByDealId[vid.dealid]) videosByDealId[vid.dealid] = [];
        videosByDealId[vid.dealid].push(vid);
      });
      
      // Combine the data
      const result = deals.map(deal => ({
        ...deal,
        images: imagesByDealId[deal.id] || [],
        videos: videosByDealId[deal.id] || [],
        thumbnailUrl: deal.thumbnailUrl || null,
        thumbnailType: deal.thumbnailType || null,
        isHotDeal: typeof deal.isHotDeal === 'boolean' ? deal.isHotDeal : deal.isHotDeal === 1
      }));
      
      // Release the client
      client.release();
      
      // Return the result
      console.log(`⏱️ Off-market data processing completed in ${Date.now() - startTime}ms`);
      clearTimeout(requestTimeout);
      res.json({ deals: result });
    } catch (err) {
      // Handle errors and release client
      client.release();
      console.error('Error processing off-market deals:', err);
      clearTimeout(requestTimeout);
      return res.status(500).json({ error: 'Failed to fetch off-market deals', details: err.message });
    }
  } catch (err) {
    // Handle connection errors
    console.error('Error connecting to database for off-market deals:', err);
    clearTimeout(requestTimeout);
    return res.status(500).json({ error: 'Failed to connect to database', details: err.message });
  }
});

// Get single off-market deal (public)
router.get('/:id', async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /off-market/${req.params.id} request`);
  console.log('⏱️ Starting single off-market deal retrieval with direct connection approach');
  const dealId = req.params.id;

  // Set a safety timeout to prevent hanging requests
  const requestTimeout = setTimeout(() => {
    console.error('⚠️ EMERGENCY TIMEOUT - Single off-market deal request taking too long');
    return res.status(504).json({ error: 'Request timeout', _emergency: true });
  }, 10000); // 10 second safety net
  
  const startTime = Date.now();
  
  try {
    // Use direct pool connection for best performance
    console.log('⏱️ Step 1: Getting direct connection to database');
    const client = await db.pool.connect();
    
    try {
      // Step 1: Get the deal
      console.log('⏱️ Step 2: Fetching single deal');
      const dealResult = await client.query(`
        SELECT * FROM off_market_deals
        WHERE id = $1 AND isActive = true
      `, [dealId]);
      
      const deal = dealResult.rows[0];
      console.log(`⏱️ Deal fetch completed in ${Date.now() - startTime}ms - ${deal ? 'Found' : 'Not found'}`);
      
      // Return 404 if not found
      if (!deal) {
        client.release();
        clearTimeout(requestTimeout);
        return res.status(404).json({ error: 'Off-market deal not found' });
      }
      
      // Step 2: Get images for this deal
      let dealImages = [];
      try {
        console.log('⏱️ Step 3: Fetching deal images');
        const imageResult = await client.query(`
          SELECT * FROM off_market_deal_images 
          WHERE dealId = $1
          ORDER BY displayOrder
        `, [dealId]);
        dealImages = imageResult.rows;
        console.log(`⏱️ Images fetched in ${Date.now() - startTime}ms - Found ${dealImages.length} images`);
      } catch (err) {
        console.log(`Warning: Could not fetch deal images: ${err.message}`);
      }
      
      // Step 3: Get videos for this deal
      let dealVideos = [];
      try {
        console.log('⏱️ Step 4: Fetching deal videos');
        const videoResult = await client.query(`
          SELECT * FROM off_market_deal_videos 
          WHERE dealId = $1
          ORDER BY displayOrder
        `, [dealId]);
        dealVideos = videoResult.rows;
        console.log(`⏱️ Videos fetched in ${Date.now() - startTime}ms - Found ${dealVideos.length} videos`);
      } catch (err) {
        console.log(`Warning: Could not fetch deal videos: ${err.message}`);
      }
      
      // Combine the data
      const result = {
        ...deal,
        images: dealImages || [],
        videos: dealVideos || [],
        thumbnailUrl: deal.thumbnailUrl || null,
        thumbnailType: deal.thumbnailType || null,
        isHotDeal: typeof deal.isHotDeal === 'boolean' ? deal.isHotDeal : deal.isHotDeal === 1
      };
      
      // Release the client and return the result
      client.release();
      console.log(`⏱️ Single deal processing completed in ${Date.now() - startTime}ms`);
      clearTimeout(requestTimeout);
      res.json({ deal: result });
    } catch (err) {
      client.release();
      console.error('Error processing single deal:', err);
      clearTimeout(requestTimeout);
      return res.status(500).json({ error: 'Failed to fetch off-market deal', details: err.message });
    }
  } catch (err) {
    console.error('Error connecting to database for single deal:', err);
    clearTimeout(requestTimeout);
    return res.status(500).json({ error: 'Failed to connect to database', details: err.message });
  }
});

module.exports = router;

