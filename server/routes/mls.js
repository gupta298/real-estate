const express = require('express');
const router = express.Router();
const mlsService = require('../services/mlsService');

// Trigger MLS sync
router.post('/sync', async (req, res) => {
  try {
    const { limit, status } = req.body;
    
    console.log('🔄 Starting MLS sync...');
    const result = await mlsService.syncListings({ limit, status });
    
    res.json({
      success: true,
      message: 'MLS sync completed successfully',
      ...result
    });
  } catch (error) {
    console.error('MLS sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get sync status/logs
router.get('/sync/status', (req, res) => {
  const db = require('../database/db');
  const limit = parseInt(req.query.limit) || 10;

  db.all(
    `SELECT * FROM mls_sync_log
     ORDER BY startedAt DESC
     LIMIT ?`,
    [limit],
    (err, rows) => {
      if (err) {
        console.error('Error fetching sync logs:', err);
        return res.status(500).json({ error: 'Failed to fetch sync logs' });
      }

      res.json({ logs: rows });
    }
  );
});

// Get MLS API configuration status
router.get('/config', (req, res) => {
  res.json({
    configured: !!process.env.MLS_API_KEY,
    apiUrl: process.env.MLS_API_URL || 'Not configured',
    hasApiKey: !!process.env.MLS_API_KEY
  });
});

module.exports = router;

