/**
 * Database connection configuration
 * Uses PostgreSQL in production (on Render) or SQLite in development
 */
const path = require('path');
const fs = require('fs');

// Determine environment
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL;

let db;

if (isProduction) {
  // PostgreSQL for production
  console.log('🌐 Using PostgreSQL database');
  const { Pool } = require('pg');

  // Configure PostgreSQL connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  // Create wrapper API that matches SQLite API
  db = {
    /**
     * Run a query that doesn't return data
     * @param {string} query - SQL query with $1, $2, etc. for parameters
     * @param {Array} params - Array of parameters
     * @returns {Promise} - Promise resolving to query result
     */
    run: async (query, params = []) => {
      // Convert ? placeholders to $1, $2, etc.
      let pgQuery = query;
      let paramCount = 0;
      pgQuery = pgQuery.replace(/\?/g, () => `$${++paramCount}`);
      
      // Handle PRAGMA statements
      if (pgQuery.trim().startsWith('PRAGMA')) {
        return { changes: 0 }; // Ignore PRAGMA statements in PostgreSQL
      }
      
      try {
        const result = await pool.query(pgQuery, params);
        return { changes: result.rowCount || 0, ...result };
      } catch (error) {
        console.error('Database run error:', error);
        throw error;
      }
    },

    /**
     * Run a query that returns a single row
     * @param {string} query - SQL query with $1, $2, etc. for parameters
     * @param {Array} params - Array of parameters
     * @returns {Promise} - Promise resolving to single row or undefined
     */
    get: async (query, params = []) => {
      // Convert ? placeholders to $1, $2, etc.
      let pgQuery = query;
      let paramCount = 0;
      pgQuery = pgQuery.replace(/\?/g, () => `$${++paramCount}`);
      
      try {
        const result = await pool.query(pgQuery, params);
        return result.rows[0];
      } catch (error) {
        console.error('Database get error:', error);
        throw error;
      }
    },

    /**
     * Run a query that returns multiple rows
     * @param {string} query - SQL query with $1, $2, etc. for parameters
     * @param {Array} params - Array of parameters
     * @returns {Promise} - Promise resolving to array of rows
     */
    all: async (query, params = []) => {
      // Convert ? placeholders to $1, $2, etc.
      let pgQuery = query;
      let paramCount = 0;
      pgQuery = pgQuery.replace(/\?/g, () => `$${++paramCount}`);
      
      try {
        const result = await pool.query(pgQuery, params);
        return result.rows;
      } catch (error) {
        console.error('Database all error:', error);
        throw error;
      }
    },
    
    // Allow direct access to pool
    pool: pool
  };
  
  // Log connection status
  pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
  });

  pool.on('error', (err) => {
    console.error('❌ PostgreSQL connection error:', err.message);
  });
} else {
  // SQLite for development
  console.log('🧪 Using SQLite database');
  const sqlite3 = require('sqlite3').verbose();
  
  const dbDir = path.join(__dirname);
  const dbPath = path.join(dbDir, 'realestate.db');

  // Ensure database directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Create SQLite database connection
  const sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('✅ Connected to SQLite database');
    }
  });

  // Enable foreign keys and WAL mode for better performance
  sqliteDb.run('PRAGMA foreign_keys = ON');
  sqliteDb.run('PRAGMA journal_mode = WAL');
  
  // Create promise wrappers for SQLite functions
  db = {
    run: (query, params = []) => {
      return new Promise((resolve, reject) => {
        sqliteDb.run(query, params, function(err) {
          if (err) return reject(err);
          resolve({ changes: this.changes, lastID: this.lastID });
        });
      });
    },
    
    get: (query, params = []) => {
      return new Promise((resolve, reject) => {
        sqliteDb.get(query, params, (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      });
    },
    
    all: (query, params = []) => {
      return new Promise((resolve, reject) => {
        sqliteDb.all(query, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      });
    },
    
    // Keep reference to original SQLite database for compatibility
    sqliteDb: sqliteDb
  };
}

module.exports = db;

