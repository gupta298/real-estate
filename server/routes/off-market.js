const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all active off-market deals (public)
router.get('/', (req, res) => {
  const { propertyType, propertySubType, status } = req.query;

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
    WHERE d.isActive = 1
  `;
  let params = [];

  if (propertyType && propertyType !== 'all') {
    query += ' AND d.propertyType = ?';
    params.push(propertyType);
  }

  if (propertySubType && propertySubType !== 'all') {
    query += ' AND d.propertySubType = ?';
    params.push(propertySubType);
  }

  if (status && status !== 'all') {
    query += ' AND d.status = ?';
    params.push(status);
  }

  query += ' ORDER BY d.displayOrder ASC, d.createdAt DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching off-market deals:', err);
      return res.status(500).json({ error: 'Failed to fetch off-market deals' });
    }

    const deals = rows.map(row => ({
      ...row,
      images: row.images ? JSON.parse(row.images) : [],
      isHotDeal: row.isHotDeal === 1
    }));

    res.json({ deals });
  });
});

// Get single off-market deal (public)
router.get('/:id', (req, res) => {
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
    WHERE d.id = ? AND d.isActive = 1
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
      isHotDeal: row.isHotDeal === 1
    };

    res.json({ deal });
  });
});

module.exports = router;

