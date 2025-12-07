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
      `SELECT userId FROM user_sessions WHERE token = $1 AND expiresAt > CURRENT_TIMESTAMP`,
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, 'pending') RETURNING id`,
      [
        firstName, lastName, email, phone, propertyAddress, city, state, zipCode,
        propertyType || null, bedrooms || null, bathrooms || null, squareFeet || null,
        lotSize || null, yearBuilt || null, currentValueEstimate || null,
        reasonForSelling || null, timeline || null, hasMortgage ? true : false,
        mortgageBalance || null, needsRepairs ? true : false, repairDescription || null,
        additionalInfo || null, userId
      ],
      function(err, result) {
        if (err) {
          console.error('Error creating seller inquiry:', err);
          return res.status(500).json({ error: 'Failed to submit inquiry' });
        }
        
        // Get inquiry ID from result object for PostgreSQL or use lastID for SQLite
        const inquiryId = result && result.rows && result.rows[0] ? result.rows[0].id : this.lastID;

        res.json({
          success: true,
          inquiryId,
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
    query += ' AND s.status = $1';
    params.push(status);
  }

  query += ' ORDER BY s.createdAt DESC';

  db.all(query, params, (err, inquiries) => {
    if (err) {
      console.error('Error fetching seller inquiries:', err);
      return res.status(500).json({ error: 'Failed to fetch inquiries' });
    }

    // Convert boolean values if needed (PostgreSQL already returns true/false)
    const formattedInquiries = inquiries.map(inquiry => ({
      ...inquiry,
      hasMortgage: typeof inquiry.hasMortgage === 'boolean' ? inquiry.hasMortgage : inquiry.hasMortgage === 1,
      needsRepairs: typeof inquiry.needsRepairs === 'boolean' ? inquiry.needsRepairs : inquiry.needsRepairs === 1
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
     WHERE s.id = $1`,
    [inquiryId],
    (err, inquiry) => {
      if (err) {
        console.error('Error fetching seller inquiry:', err);
        return res.status(500).json({ error: 'Failed to fetch inquiry' });
      }

      if (!inquiry) {
        return res.status(404).json({ error: 'Inquiry not found' });
      }

      // Convert boolean values if needed (PostgreSQL already returns true/false)
      const formattedInquiry = {
        ...inquiry,
        hasMortgage: typeof inquiry.hasMortgage === 'boolean' ? inquiry.hasMortgage : inquiry.hasMortgage === 1,
        needsRepairs: typeof inquiry.needsRepairs === 'boolean' ? inquiry.needsRepairs : inquiry.needsRepairs === 1
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

  let paramCounter = 1;

  if (status) {
    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: pending, in_progress, or completed' });
    }
    updates.push(`status = $${paramCounter}`);
    params.push(status);
    paramCounter++;
  }

  if (assignedAgentId !== undefined) {
    updates.push(`assignedAgentId = $${paramCounter}`);
    params.push(assignedAgentId || null);
    paramCounter++;
  }

  if (adminNotes !== undefined) {
    updates.push(`adminNotes = $${paramCounter}`);
    params.push(adminNotes || null);
    paramCounter++;
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push('updatedAt = CURRENT_TIMESTAMP');
  params.push(inquiryId);

  const query = `UPDATE seller_inquiries SET ${updates.join(', ')} WHERE id = $${paramCounter}`;

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
       WHERE s.id = $1`,
      [inquiryId],
      (err, inquiry) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch updated inquiry' });
        }

        const formattedInquiry = {
          ...inquiry,
          hasMortgage: typeof inquiry.hasMortgage === 'boolean' ? inquiry.hasMortgage : inquiry.hasMortgage === 1,
          needsRepairs: typeof inquiry.needsRepairs === 'boolean' ? inquiry.needsRepairs : inquiry.needsRepairs === 1
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

  db.run('DELETE FROM seller_inquiries WHERE id = $1', [inquiryId], function(err, result) {
    if (err) {
      console.error('Error deleting seller inquiry:', err);
      return res.status(500).json({ error: 'Failed to delete inquiry' });
    }

    // Check if any rows were affected
    // In PostgreSQL, result.rowCount contains the number of affected rows
    // In SQLite, this.changes contains the number of affected rows
    const rowsAffected = result && result.rowCount ? result.rowCount : this.changes;
    if (rowsAffected === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    res.json({ success: true, message: 'Inquiry deleted successfully' });
  });
});

module.exports = router;

