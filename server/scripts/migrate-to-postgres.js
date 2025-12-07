/**
 * Migration script to transfer data from SQLite to PostgreSQL
 * 
 * Usage:
 * 1. Set up your PostgreSQL database on Render
 * 2. Set DATABASE_URL environment variable
 * 3. Run: node server/scripts/migrate-to-postgres.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

// Get database path
const sqliteDbPath = path.join(__dirname, '../database/realestate.db');
const schemaPath = path.join(__dirname, '../database/schema.sql');

// Check if SQLite database exists
if (!fs.existsSync(sqliteDbPath)) {
  console.error(`SQLite database not found at ${sqliteDbPath}`);
  process.exit(1);
}

// Configuration
const postgresUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/realestate';

// Connect to SQLite
const sqliteDb = new sqlite3.Database(sqliteDbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database for migration');
});

// Connect to PostgreSQL
const pgPool = new Pool({
  connectionString: postgresUrl,
  ssl: postgresUrl.includes('render.com') ? { rejectUnauthorized: false } : false
});

// Convert SQLite schema to PostgreSQL
function convertSchemaToPostgres(sqliteSchema) {
  let pgSchema = sqliteSchema;
  
  // Replace SQLite's AUTOINCREMENT with PostgreSQL's SERIAL
  pgSchema = pgSchema.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');
  
  // Replace SQLite's DATETIME with PostgreSQL's TIMESTAMP
  pgSchema = pgSchema.replace(/DATETIME/gi, 'TIMESTAMP');
  
  // Convert BOOLEAN literals
  pgSchema = pgSchema.replace(/DEFAULT 0/gi, 'DEFAULT false');
  pgSchema = pgSchema.replace(/DEFAULT 1/gi, 'DEFAULT true');
  
  // Remove SQLite-specific PRAGMA statements
  pgSchema = pgSchema.split('\n')
    .filter(line => !line.trim().startsWith('PRAGMA'))
    .join('\n');
  
  return pgSchema;
}

// Get all tables from SQLite
async function getSQLiteTables() {
  return new Promise((resolve, reject) => {
    sqliteDb.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", [], (err, tables) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(tables.map(t => t.name));
    });
  });
}

// Get table schema from SQLite
async function getTableSchema(tableName) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(`PRAGMA table_info(${tableName})`, [], (err, columns) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(columns);
    });
  });
}

// Get all data from a table
async function getTableData(tableName) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

// Insert data into PostgreSQL
async function insertDataToPostgres(tableName, data, columns) {
  if (data.length === 0) {
    console.log(`No data to insert for table ${tableName}`);
    return;
  }

  // Skip id column for PostgreSQL since it's auto-generated with SERIAL
  const columnNames = columns
    .filter(col => col.name !== 'id')
    .map(col => col.name);
  
  // Create placeholders for prepared statement
  const placeholders = [];
  const values = [];
  let paramCount = 1;
  
  for (const row of data) {
    const rowPlaceholders = [];
    
    for (const colName of columnNames) {
      rowPlaceholders.push(`$${paramCount++}`);
      
      // Handle SQLite's BOOLEAN to PostgreSQL boolean conversion
      if (typeof row[colName] === 'number' && (row[colName] === 0 || row[colName] === 1)) {
        const columnInfo = columns.find(c => c.name === colName);
        if (columnInfo && columnInfo.type.toUpperCase() === 'BOOLEAN') {
          values.push(row[colName] === 1);
        } else {
          values.push(row[colName]);
        }
      } else {
        values.push(row[colName]);
      }
    }
    
    placeholders.push(`(${rowPlaceholders.join(', ')})`);
  }
  
  const query = `
    INSERT INTO ${tableName} (${columnNames.join(', ')})
    VALUES ${placeholders.join(', ')}
    ON CONFLICT DO NOTHING
  `;
  
  try {
    await pgPool.query(query, values);
    console.log(`✅ Inserted ${data.length} rows into ${tableName}`);
  } catch (err) {
    console.error(`❌ Error inserting data into ${tableName}:`, err);
    throw err;
  }
}

// Create PostgreSQL tables from schema
async function createPostgresTables() {
  try {
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    const pgSchema = convertSchemaToPostgres(schemaSQL);
    
    // Split by semicolons to execute each statement separately
    const statements = pgSchema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      try {
        await pgPool.query(statement);
      } catch (err) {
        console.error(`Error executing statement: ${statement}`);
        console.error(err);
      }
    }
    
    console.log('✅ PostgreSQL tables created successfully');
  } catch (err) {
    console.error('❌ Error creating PostgreSQL tables:', err);
    throw err;
  }
}

// Main migration function
async function migrateData() {
  try {
    // Create PostgreSQL tables
    await createPostgresTables();
    
    // Get all tables
    const tables = await getSQLiteTables();
    
    // Process each table
    for (const tableName of tables) {
      console.log(`\nMigrating table: ${tableName}`);
      
      // Get table schema
      const columns = await getTableSchema(tableName);
      
      // Get table data
      const data = await getTableData(tableName);
      console.log(`Found ${data.length} rows in ${tableName}`);
      
      // If we have data, insert it into PostgreSQL
      if (data.length > 0) {
        await insertDataToPostgres(tableName, data, columns);
      }
    }
    
    console.log('\n🎉 Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    // Close connections
    sqliteDb.close();
    await pgPool.end();
  }
}

// Start the migration
migrateData();
