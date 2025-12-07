const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Determine if we're in production (on Render) or development
const isProduction = process.env.NODE_ENV === 'production';

// Configure PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/realestate',
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

// Log connection status
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err.message);
  console.error('Unexpected error on idle client. Reconnecting...');
});

// Create a wrapper API that matches the SQLite API
// This allows existing code to work with minimal changes
const db = {
  /**
   * Run a query that doesn't return data (INSERT, UPDATE, DELETE)
   * @param {string} query - SQL query with $1, $2, etc for parameters
   * @param {Array} params - Array of parameters
   * @returns {Promise} - Promise resolving to query result
   */
  run: async (query, params = []) => {
    const convertedQuery = convertSqliteToPostgres(query);
    try {
      return await pool.query(convertedQuery, params);
    } catch (error) {
      console.error('Database run error:', error);
      throw error;
    }
  },

  /**
   * Run a query that returns a single row
   * @param {string} query - SQL query with $1, $2, etc for parameters
   * @param {Array} params - Array of parameters
   * @returns {Promise} - Promise resolving to single row or undefined
   */
  get: async (query, params = []) => {
    const convertedQuery = convertSqliteToPostgres(query);
    try {
      const result = await pool.query(convertedQuery, params);
      return result.rows[0];
    } catch (error) {
      console.error('Database get error:', error);
      throw error;
    }
  },

  /**
   * Run a query that returns multiple rows
   * @param {string} query - SQL query with $1, $2, etc for parameters
   * @param {Array} params - Array of parameters
   * @returns {Promise} - Promise resolving to array of rows
   */
  all: async (query, params = []) => {
    const convertedQuery = convertSqliteToPostgres(query);
    try {
      const result = await pool.query(convertedQuery, params);
      return result.rows;
    } catch (error) {
      console.error('Database all error:', error);
      throw error;
    }
  },

  /**
   * Execute a SQL script file
   * @param {string} filePath - Path to SQL file
   * @returns {Promise} - Promise resolving when script is executed
   */
  execScript: async (filePath) => {
    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      // Convert SQLite script to PostgreSQL
      const pgSql = convertSqliteToPostgres(sql);
      
      // Split script by semicolons to execute as separate statements
      const statements = pgSql
        .split(';')
        .filter(statement => statement.trim().length > 0);
      
      for (const statement of statements) {
        await pool.query(statement);
      }
      
      console.log(`Successfully executed script: ${filePath}`);
    } catch (error) {
      console.error(`Error executing script ${filePath}:`, error);
      throw error;
    }
  },

  // Allow direct access to pool if needed
  pool: pool
};

/**
 * Convert SQLite SQL syntax to PostgreSQL
 * @param {string} query - SQLite query
 * @returns {string} - PostgreSQL compatible query
 */
function convertSqliteToPostgres(query) {
  let pgQuery = query;
  
  // Replace SQLite's AUTOINCREMENT with PostgreSQL's SERIAL
  pgQuery = pgQuery.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');
  
  // Replace SQLite's ? parameters with PostgreSQL's $1, $2, etc.
  let paramCount = 0;
  pgQuery = pgQuery.replace(/\?/g, () => `$${++paramCount}`);
  
  // Replace SQLite's DATETIME with PostgreSQL's TIMESTAMP
  pgQuery = pgQuery.replace(/DATETIME/gi, 'TIMESTAMP');
  
  // Replace SQLite pragmas with empty strings
  pgQuery = pgQuery.replace(/PRAGMA .+;/g, '');
  
  // Convert CURRENT_TIMESTAMP to PostgreSQL format if needed
  pgQuery = pgQuery.replace(/CURRENT_TIMESTAMP/gi, 'CURRENT_TIMESTAMP');
  
  // Convert BOOLEAN literals (SQLite uses 0/1, PostgreSQL uses true/false)
  pgQuery = pgQuery.replace(/DEFAULT 0/gi, 'DEFAULT false');
  pgQuery = pgQuery.replace(/DEFAULT 1/gi, 'DEFAULT true');
  
  return pgQuery;
}

module.exports = db;
