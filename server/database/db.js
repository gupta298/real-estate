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
    ssl: { rejectUnauthorized: false },
    // Add connection timeout and retry logic with increased timeouts
    connectionTimeoutMillis: 30000,  // Increased from 10000ms to 30000ms
    query_timeout: 30000,           // Increased from 10000ms to 30000ms
    statement_timeout: 30000,       // Increased from 10000ms to 30000ms
    max: 20,                        // Increased max connections from 10 to 20
    idleTimeoutMillis: 60000        // Increased from 30000ms to 60000ms
  });
  
  // Helper function to retry operations with exponential backoff
  const retryOperation = async (operation, maxRetries = 3, initialDelay = 500) => {
    let lastError;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const isTimeout = error.message && error.message.includes('timeout');
        
        if (!isTimeout) {
          // Don't retry non-timeout errors
          throw error;
        }
        
        retries++;
        if (retries >= maxRetries) break;
        
        // Calculate delay with exponential backoff (500ms, 1000ms, 2000ms...)
        const delay = initialDelay * Math.pow(2, retries - 1);
        console.log(`⚠️ Query timeout. Retrying in ${delay}ms... (Attempt ${retries} of ${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // If we get here, all retries failed
    throw lastError;
  };
  
  // Test connection immediately
  (async () => {
    try {
      const client = await pool.connect();
      console.log('✅ Successfully connected to PostgreSQL database!');
      client.release();
    } catch (err) {
      console.error('❌ Error connecting to PostgreSQL:', err.message);
      console.error('Check your DATABASE_URL environment variable and network connectivity');
      // Don't exit - allow the application to handle connection issues
    }
  })();

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
        // Handle connection issues separately from query issues
        const client = await pool.connect();
        try {
          // Use retry operation for query execution
          const result = await retryOperation(async () => {
            console.log(`Executing query: ${pgQuery.substring(0, 100)}${pgQuery.length > 100 ? '...' : ''}`);
            return await client.query(pgQuery, params);
          }, 3, 1000); // retry up to 3 times, starting with 1 second delay
          
          // Safely access result properties
          return { 
            changes: result && result.rowCount ? result.rowCount : 0, 
            ...result 
          };
        } catch (queryError) {
          // Enhanced error logging for timeouts
          if (queryError.message && queryError.message.includes('timeout')) {
            console.error('⏱️ DATABASE QUERY TIMEOUT ERROR - All retry attempts failed');
            console.error('Query that timed out:', pgQuery);
            console.error('Parameters:', params);
            console.error('Timeout error details:', queryError.message);
            console.error('Consider optimizing this query or increasing timeout limits further');
          } else {
            console.error('Database query error:', queryError);
            console.error('Query was:', pgQuery);
            console.error('Parameters were:', params);
          }
          throw queryError;
        } finally {
          // Always release the client back to the pool
          client.release();
        }
      } catch (connectionError) {
        console.error('Database connection error:', connectionError);
        throw connectionError;
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
        // Handle connection issues separately from query issues
        const client = await pool.connect();
        try {
          // Use retry operation for query execution
          const result = await retryOperation(async () => {
            return await client.query(pgQuery, params);
          }, 3, 1000); // retry up to 3 times, starting with 1 second delay
          
          // Safely access rows - might be undefined if query fails
          return result && result.rows ? result.rows[0] : null;
        } catch (queryError) {
          // Enhanced error logging for timeouts
          if (queryError.message && queryError.message.includes('timeout')) {
            console.error('⏱️ DATABASE QUERY TIMEOUT ERROR - All retry attempts failed');
            console.error('Query that timed out:', pgQuery);
            console.error('Parameters:', params);
            console.error('Timeout error details:', queryError.message);
            console.error('Consider optimizing this query or increasing timeout limits further');
          } else {
            console.error('Database query error:', queryError);
            console.error('Query was:', pgQuery);
            console.error('Parameters were:', params);
          }
          throw queryError;
        } finally {
          // Always release the client back to the pool
          client.release();
        }
      } catch (connectionError) {
        console.error('Database connection error:', connectionError);
        throw connectionError;
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
        // Handle connection issues separately from query issues
        const client = await pool.connect();
        try {
          // Use retry operation for query execution
          const result = await retryOperation(async () => {
            return await client.query(pgQuery, params);
          }, 3, 1000); // retry up to 3 times, starting with 1 second delay
          
          // Safely access rows - might be undefined if query fails
          return result && result.rows ? result.rows : [];
        } catch (queryError) {
          // Enhanced error logging for timeouts
          if (queryError.message && queryError.message.includes('timeout')) {
            console.error('⏱️ DATABASE QUERY TIMEOUT ERROR - All retry attempts failed');
            console.error('Query that timed out:', pgQuery);
            console.error('Parameters:', params);
            console.error('Timeout error details:', queryError.message);
            console.error('Consider optimizing this query or increasing timeout limits further');
          } else {
            console.error('Database query error:', queryError);
            console.error('Query was:', pgQuery);
            console.error('Parameters were:', params);
          }
          throw queryError;
        } finally {
          // Always release the client back to the pool
          client.release();
        }
      } catch (connectionError) {
        console.error('Database connection error:', connectionError);
        throw connectionError;
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