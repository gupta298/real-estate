/**
 * Database connection configuration
 * Uses PostgreSQL in production (on Render) or SQLite in development
 */
const path = require('path');
const fs = require('fs');

// IMPORTANT: Force production mode when DATABASE_URL is present
// This ensures we don't create both database connections
const forcedProductionMode = !!process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production' || forcedProductionMode;

// Always log explicit database connection information
console.log('---------- DATABASE CONNECTION ----------');
console.log(`🔍 FORCED DATABASE MODE: ${forcedProductionMode ? 'PRODUCTION' : 'Auto-detect'}`);
console.log(`🔍 FINAL DATABASE MODE: ${isProduction ? 'PRODUCTION (PostgreSQL)' : 'DEVELOPMENT (SQLite)'}`);
console.log(`🔍 NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`🔍 DATABASE_URL: ${process.env.DATABASE_URL ? 'is set' : 'not set'}`);
console.log('-----------------------------------------');

// Ensure only one instance gets created
let db = null;

if (isProduction) {
  // PostgreSQL for production
  console.log('🌐 Using PostgreSQL database');
  const { Pool } = require('pg');

  // Configure PostgreSQL connection with more aggressive settings
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // Even more aggressive timeout and connection settings
    connectionTimeoutMillis: 60000,  // 1 minute connection timeout
    query_timeout: 60000,           // 1 minute query timeout
    statement_timeout: 60000,       // 1 minute statement timeout
    max: 25,                        // Increased max connections to 25
    idleTimeoutMillis: 300000,      // 5 minutes idle timeout
    application_name: 'real-estate-website',  // For better identification in logs
  });
  
  // Add more robust error handling for the connection pool
  pool.on('error', (err) => {
    console.error('❌ PostgreSQL pool error:', err.message);
    console.error('Stack trace:', err.stack);
    // Try to recover from connection errors
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      console.log('🔄 Attempting to reconnect to PostgreSQL...');
    }
  });
  
  // Enhanced helper function to retry operations with exponential backoff
  const retryOperation = async (operation, maxRetries = 5, initialDelay = 1000) => {
    let lastError;
    let retries = 0;
    
    // Log the initial attempt
    console.log('🔄 Executing database operation with retry logic...');
    
    while (retries < maxRetries) {
      try {
        const startTime = Date.now();
        const result = await operation();
        const duration = Date.now() - startTime;
        
        // Log slow queries (taking more than 1 second)
        if (duration > 1000) {
          console.log(`⚠️ Slow query completed in ${duration}ms`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        const isTimeout = error.message && (
          error.message.includes('timeout') || 
          error.message.includes('terminated') || 
          error.message.includes('connection') ||
          error.code === '57014' ||
          error.code === '57P01' ||
          error.code === '08006' ||
          error.code === '08001'
        );
        
        if (!isTimeout && retries >= 1) {
          // Only retry connection or timeout related errors after first attempt
          console.error('❌ Non-timeout error, not retrying:', error.message);
          throw error;
        }
        
        retries++;
        if (retries >= maxRetries) break;
        
        // Calculate delay with exponential backoff (1s, 2s, 4s, 8s, 16s)
        const delay = initialDelay * Math.pow(2, retries - 1);
        console.log(`⚠️ Database operation error. Retrying in ${delay}ms... (Attempt ${retries} of ${maxRetries})`);
        console.log(`Error details: ${error.message}`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // If we get here, all retries failed
    console.error(`❌ All ${maxRetries} retry attempts failed. Last error: ${lastError.message}`);
    throw lastError;
  };
  
  // Test connection and warm up the database
  (async () => {
    try {
      console.log('🔥 Warming up database connection...');
      const startTime = Date.now();
      const client = await pool.connect();
      console.log('✅ Successfully connected to PostgreSQL database!');
      
      // Perform a simple query to fully initialize the connection
      await client.query('SELECT 1');
      console.log(`🔥 Database warm-up completed in ${Date.now() - startTime}ms`);
      
      // Pre-check if blogs table exists
      try {
        await client.query('SELECT COUNT(*) FROM blogs');
        console.log('✅ Successfully verified blogs table exists');
      } catch (tableErr) {
        console.warn('⚠️ Blogs table check failed:', tableErr.message);
      }
      
      client.release();
    } catch (err) {
      console.error('❌ Error connecting to PostgreSQL:', err.message);
      console.error('Stack trace:', err.stack);
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
} else if (!forcedProductionMode && process.env.NODE_ENV !== 'production') {
  // SQLite for development ONLY - add double safety check to prevent this in production
  console.log('\ud83e\uddea Using SQLite database (DEVELOPMENT MODE ONLY)');
  try {
    const sqlite3 = require('sqlite3').verbose();
    
    const dbDir = path.join(__dirname);
    const dbPath = path.join(dbDir, 'realestate.db');

    // Ensure database directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    console.log(`SQLite database path: ${dbPath}`);
    console.log('IMPORTANT: SQLite should NEVER be used in production!');

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
  } catch (err) {
    console.error('Error initializing SQLite:', err.message);
  }
} else {
  // EMERGENCY FALLBACK - this should never happen in production
  console.error('\n\n❌❌❌ NO DATABASE SELECTED - THIS IS A CRITICAL ERROR! ❌❌❌');
  console.error('Database environment detection failed:');
  console.error(`- NODE_ENV = ${process.env.NODE_ENV || 'not set'}`);
  console.error(`- DATABASE_URL ${process.env.DATABASE_URL ? 'is set' : 'is NOT set'}`);
  console.error('This might indicate a configuration error.');
  console.error('For production, ensure DATABASE_URL is set.');
  console.error('For development, ensure NODE_ENV is not "production".');
  
  // Create dummy DB that throws errors on all operations
  db = {
    run: async () => { throw new Error('No database connection established'); },
    get: async () => { throw new Error('No database connection established'); },
    all: async () => { throw new Error('No database connection established'); }
  };
}

module.exports = db;