/**
 * PostgreSQL Compatible Updates for Authentication Routes
 * 
 * This file contains updated query patterns for the auth.js routes
 * to be fully compatible with PostgreSQL.
 */

// CHANGES FOR POSTGRESQL COMPATIBILITY:

// 1. Replace SQLite datetime('now') with PostgreSQL CURRENT_TIMESTAMP
// In the /me route and authenticate middleware:

// Original SQLite version:
db.get(
  `SELECT u.* FROM users u
   INNER JOIN user_sessions s ON u.id = s.userId
   WHERE s.token = ? AND s.expiresAt > datetime('now')`,
  [token],
  // handler
);

// PostgreSQL version:
db.get(
  `SELECT u.* FROM users u
   INNER JOIN user_sessions s ON u.id = s.userId
   WHERE s.token = $1 AND s.expiresAt > CURRENT_TIMESTAMP`,
  [token],
  // handler
);

// 2. User Registration - Get lastID using RETURNING
// Original SQLite version:
db.run(
  'INSERT INTO users (email, password, firstName, lastName, phone) VALUES (?, ?, ?, ?, ?)',
  [email, hashedPassword, firstName || null, lastName || null, phone || null],
  function(err) {
    // Access this.lastID here
    const userId = this.lastID;
    
    // Create session with this.lastID
    db.run(
      'INSERT INTO user_sessions (userId, token, expiresAt) VALUES (?, ?, ?)',
      [this.lastID, token, expiresAt.toISOString()],
      // handler
    );
  }
);

// PostgreSQL version:
db.run(
  'INSERT INTO users (email, password, firstName, lastName, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id',
  [email, hashedPassword, firstName || null, lastName || null, phone || null],
  async function(err, result) {
    // Get ID from result
    const userId = result && result.rows ? result.rows[0].id : null;
    
    // Create session with returned userId
    await db.run(
      'INSERT INTO user_sessions (userId, token, expiresAt) VALUES ($1, $2, $3)',
      [userId, token, expiresAt.toISOString()]
    );
    
    // Return response...
  }
);

// 3. Session Creation - No need to use lastID for user sign-in
// Original:
db.run(
  'INSERT INTO user_sessions (userId, token, expiresAt) VALUES (?, ?, ?)',
  [user.id, token, expiresAt.toISOString()],
  // handler
);

// PostgreSQL version:
db.run(
  'INSERT INTO user_sessions (userId, token, expiresAt) VALUES ($1, $2, $3)',
  [user.id, token, expiresAt.toISOString()],
  // handler
);

// 4. Sync Log Creation - Same issue with lastID
// Original SQLite version (from mlsService.js):
db.run(
  'INSERT INTO mls_sync_log (syncType, status) VALUES (?, ?)',
  [syncType, 'in_progress'],
  function(err) {
    // Access this.lastID
  }
);

// PostgreSQL version:
db.run(
  'INSERT INTO mls_sync_log (syncType, status) VALUES ($1, $2) RETURNING id',
  [syncType, 'in_progress'],
  function(err, result) {
    // Access result.rows[0].id instead of this.lastID
  }
);

/**
 * General Conversion Guidelines:
 * 
 * 1. Replace "?" placeholders with "$1", "$2", etc.
 * 2. Replace SQLite datetime('now') with PostgreSQL CURRENT_TIMESTAMP
 * 3. For INSERT statements where you need the ID, add RETURNING id
 * 4. Access result.rows[0].id instead of this.lastID
 * 5. Use true/false instead of 1/0 for boolean values
 * 6. Make sure all string literals are properly quoted (single quotes)
 */
