const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all agents
router.get('/', (req, res) => {
  const { active } = req.query;

  let query = 'SELECT * FROM agents';
  let params = [];

  if (active === 'true') {
    query += ' WHERE isActive = 1';
  }

  query += ' ORDER BY isBroker DESC, displayOrder ASC, lastName ASC';

  db.all(query, params, (err, agents) => {
    if (err) {
      console.error('Error fetching agents:', err);
      return res.status(500).json({ error: 'Failed to fetch agents' });
    }

    res.json({ agents });
  });
});

// Get single agent by ID
router.get('/:id', (req, res) => {
  const agentId = req.params.id;

  db.get('SELECT * FROM agents WHERE id = ?', [agentId], (err, agent) => {
    if (err) {
      console.error('Error fetching agent:', err);
      return res.status(500).json({ error: 'Failed to fetch agent' });
    }

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Get agent's properties count
    db.get(
      'SELECT COUNT(*) as count FROM properties WHERE id IN (SELECT propertyId FROM property_inquiries WHERE agentId = ?)',
      [agentId],
      (err, result) => {
        if (!err && result) {
          agent.propertiesCount = result.count;
        }
        res.json({ agent });
      }
    );
  });
});

// Get broker (managing broker)
router.get('/broker/info', (req, res) => {
  db.get(
    'SELECT * FROM agents WHERE isBroker = 1 AND isActive = 1 LIMIT 1',
    [],
    (err, broker) => {
      if (err) {
        console.error('Error fetching broker:', err);
        return res.status(500).json({ error: 'Failed to fetch broker' });
      }

      res.json({ broker });
    }
  );
});

module.exports = router;

