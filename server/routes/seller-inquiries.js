const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticate } = require('./auth');

// Submit seller inquiry (public)
router.post('/', (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    propertyAddress,
    city,
    state,
    zipCode,
    propertyType,
    bedrooms,
    bathrooms,
    squareFeet,
    lotSize,
    yearBuilt,
    currentValueEstimate,
    reasonForSelling,
    timeline,
    hasMortgage,
    mortgageBalance,
    needsRepairs,
    repairDescription,
    additionalInfo
  } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !phone || !propertyAddress || !city || !state || !zipCode) {
    return res.status(400).json({ 
      error: 'Required fields: firstName, lastName, email, phone, propertyAddress, city, state, zipCode' 
    });
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
      `INSERT INTO seller_inquiries (
        firstName, lastName, email, phone, propertyAddress, city, state, zipCode,
        propertyType, bedrooms, bathrooms, squareFeet, lotSize, yearBuilt,
        currentValueEstimate, reasonForSelling, timeline, hasMortgage, mortgageBalance,
        needsRepairs, repairDescription, additionalInfo, userId, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        firstName, lastName, email, phone, propertyAddress, city, state, zipCode,
        propertyType || null, bedrooms || null, bathrooms || null, squareFeet || null,
        lotSize || null, yearBuilt || null, currentValueEstimate || null,
        reasonForSelling || null, timeline || null, hasMortgage ? 1 : 0,
        mortgageBalance || null, needsRepairs ? 1 : 0, repairDescription || null,
        additionalInfo || null, userId
      ],
      function(err) {
        if (err) {
          console.error('Error creating seller inquiry:', err);
          return res.status(500).json({ error: 'Failed to submit inquiry' });
        }

        res.json({
          success: true,
          inquiryId: this.lastID,
          message: 'Inquiry submitted successfully. We will reach out to you soon!'
        });
      }
    );
  }
});

// Get all seller inquiries (admin only)
router.get('/', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { status } = req.query;

  let query = `
    SELECT s.*, 
           a.firstName as agentFirstName, 
           a.lastName as agentLastName,
           a.email as agentEmail,
           a.phone as agentPhone
    FROM seller_inquiries s
    LEFT JOIN agents a ON s.assignedAgentId = a.id
    WHERE 1=1
  `;
  let params = [];

  if (status && status !== 'all') {
    query += ' AND s.status = ?';
    params.push(status);
  }

  query += ' ORDER BY s.createdAt DESC';

  db.all(query, params, (err, inquiries) => {
    if (err) {
      console.error('Error fetching seller inquiries:', err);
      return res.status(500).json({ error: 'Failed to fetch inquiries' });
    }

    // Convert boolean values
    const formattedInquiries = inquiries.map(inquiry => ({
      ...inquiry,
      hasMortgage: inquiry.hasMortgage === 1,
      needsRepairs: inquiry.needsRepairs === 1
    }));

    res.json({ inquiries: formattedInquiries });
  });
});

// Get single seller inquiry (admin only)
router.get('/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const inquiryId = req.params.id;

  db.get(
    `SELECT s.*, 
            a.firstName as agentFirstName, 
            a.lastName as agentLastName,
            a.email as agentEmail,
            a.phone as agentPhone
     FROM seller_inquiries s
     LEFT JOIN agents a ON s.assignedAgentId = a.id
     WHERE s.id = ?`,
    [inquiryId],
    (err, inquiry) => {
      if (err) {
        console.error('Error fetching seller inquiry:', err);
        return res.status(500).json({ error: 'Failed to fetch inquiry' });
      }

      if (!inquiry) {
        return res.status(404).json({ error: 'Inquiry not found' });
      }

      // Convert boolean values
      const formattedInquiry = {
        ...inquiry,
        hasMortgage: inquiry.hasMortgage === 1,
        needsRepairs: inquiry.needsRepairs === 1
      };

      res.json({ inquiry: formattedInquiry });
    }
  );
});

// Update seller inquiry status (admin only)
router.put('/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const inquiryId = req.params.id;
  const { status, assignedAgentId, adminNotes } = req.body;

  const updates = [];
  const params = [];

  if (status) {
    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: pending, in_progress, or completed' });
    }
    updates.push('status = ?');
    params.push(status);
  }

  if (assignedAgentId !== undefined) {
    updates.push('assignedAgentId = ?');
    params.push(assignedAgentId || null);
  }

  if (adminNotes !== undefined) {
    updates.push('adminNotes = ?');
    params.push(adminNotes || null);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push('updatedAt = CURRENT_TIMESTAMP');
  params.push(inquiryId);

  const query = `UPDATE seller_inquiries SET ${updates.join(', ')} WHERE id = ?`;

  db.run(query, params, function(err) {
    if (err) {
      console.error('Error updating seller inquiry:', err);
      return res.status(500).json({ error: 'Failed to update inquiry' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    // Get updated inquiry
    db.get(
      `SELECT s.*, 
              a.firstName as agentFirstName, 
              a.lastName as agentLastName,
              a.email as agentEmail,
              a.phone as agentPhone
       FROM seller_inquiries s
       LEFT JOIN agents a ON s.assignedAgentId = a.id
       WHERE s.id = ?`,
      [inquiryId],
      (err, inquiry) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch updated inquiry' });
        }

        const formattedInquiry = {
          ...inquiry,
          hasMortgage: inquiry.hasMortgage === 1,
          needsRepairs: inquiry.needsRepairs === 1
        };

        res.json({ success: true, inquiry: formattedInquiry });
      }
    );
  });
});

// Delete seller inquiry (admin only)
router.delete('/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const inquiryId = req.params.id;

  db.run('DELETE FROM seller_inquiries WHERE id = ?', [inquiryId], function(err) {
    if (err) {
      console.error('Error deleting seller inquiry:', err);
      return res.status(500).json({ error: 'Failed to delete inquiry' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    res.json({ success: true, message: 'Inquiry deleted successfully' });
  });
});

module.exports = router;

