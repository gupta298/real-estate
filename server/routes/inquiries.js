const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticate } = require('./auth');

// Submit property inquiry (required form)
router.post('/', (req, res) => {
  const {
    propertyId,
    mlsNumber,
    firstName,
    lastName,
    email,
    phone,
    message,
    agentId
  } = req.body;

  if (!propertyId || !firstName || !lastName || !email) {
    return res.status(400).json({ error: 'Required fields: propertyId, firstName, lastName, email' });
  }

  // Get user ID from token if provided
  const token = req.headers.authorization?.replace('Bearer ', '');
  let userId = null;

  if (token) {
    db.get(
      `SELECT userId FROM user_sessions WHERE token = ? AND expiresAt > datetime('now')`,
      [token],
      (err, session) => {
        if (!err && session) {
          userId = session.userId;
        }
        createInquiry();
      }
    );
  } else {
    createInquiry();
  }

  function createInquiry() {
    db.run(
      `INSERT INTO property_inquiries 
       (propertyId, mlsNumber, firstName, lastName, email, phone, message, agentId, userId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [propertyId, mlsNumber || null, firstName, lastName, email, phone || null, message || null, agentId || null, userId],
      function(err) {
        if (err) {
          console.error('Error creating inquiry:', err);
          return res.status(500).json({ error: 'Failed to submit inquiry' });
        }

        res.json({
          success: true,
          inquiryId: this.lastID,
          message: 'Inquiry submitted successfully'
        });
      }
    );
  }
});

// Get inquiries (protected - requires authentication)
router.get('/', authenticate, (req, res) => {
  const { propertyId, agentId } = req.query;

  let query = `
    SELECT i.*, p.title as propertyTitle, p.mlsNumber, a.firstName as agentFirstName, a.lastName as agentLastName
    FROM property_inquiries i
    LEFT JOIN properties p ON i.propertyId = p.id
    LEFT JOIN agents a ON i.agentId = a.id
    WHERE 1=1
  `;
  let params = [];

  if (propertyId) {
    query += ' AND i.propertyId = ?';
    params.push(propertyId);
  }

  if (agentId) {
    query += ' AND i.agentId = ?';
    params.push(agentId);
  }

  query += ' ORDER BY i.createdAt DESC';

  db.all(query, params, (err, inquiries) => {
    if (err) {
      console.error('Error fetching inquiries:', err);
      return res.status(500).json({ error: 'Failed to fetch inquiries' });
    }

    res.json({ inquiries });
  });
});

module.exports = router;

