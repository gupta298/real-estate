/**
 * Script to manually set up the PostgreSQL database on Render
 * This script is designed to be run in the Render environment directly
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// No need to specify connection string - it's taken from DATABASE_URL env var
console.log('Running database setup script for Render environment...');

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  console.error('Make sure this script is run in the Render environment or set DATABASE_URL manually.');
  process.exit(1);
}

// Configure PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Path to schema file
const schemaPath = path.join(__dirname, '../database/schema.postgres.sql');

async function setupDatabase() {
  console.log('Connecting to PostgreSQL database...');
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('Connection successful!');
    client.release();
    
    // Read schema file
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    console.log('Schema file loaded successfully.');
    
    // Execute schema
    console.log('Creating database schema...');
    
    // Split into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // Process each statement
    for (const stmt of statements) {
      try {
        await pool.query(stmt);
      } catch (error) {
        console.log(`Warning: Error executing statement (might already exist): ${error.message}`);
      }
    }
    
    console.log('Database schema created successfully!');
    
    // Create admin user
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    try {
      // Check if admin exists
      const adminCheck = await pool.query("SELECT id FROM users WHERE email = 'admin@blueflagrealty.com'");
      
      if (adminCheck.rows.length > 0) {
        // Update existing admin
        await pool.query(
          "UPDATE users SET password = $1, role = 'admin', updatedAt = CURRENT_TIMESTAMP WHERE email = 'admin@blueflagrealty.com'",
          [hashedPassword]
        );
        console.log('Admin user updated successfully.');
      } else {
        // Create new admin
        await pool.query(
          "INSERT INTO users (email, password, role) VALUES ('admin@blueflagrealty.com', $1, 'admin')",
          [hashedPassword]
        );
        console.log('Admin user created successfully.');
      }
    } catch (error) {
      console.error('Error creating admin user:', error.message);
    }
    
    // Create a sample blog post
    try {
      await pool.query(`
        INSERT INTO blogs (title, content, excerpt, isPublished) 
        VALUES ('Welcome to Blue Flag Indianapolis', 
                '<p>Welcome to our new real estate website! Here you will find the latest listings.</p>', 
                'Welcome to our new real estate website!', 
                true)
        ON CONFLICT DO NOTHING
      `);
      console.log('Sample blog post created successfully.');
    } catch (error) {
      console.error('Error creating sample blog post:', error.message);
    }
    
    // Create a sample off-market deal
    try {
      await pool.query(`
        INSERT INTO off_market_deals (title, content, propertyType, area, status, isActive) 
        VALUES ('Downtown Investment Opportunity', 
                '<p>Exclusive off-market opportunity in downtown Indianapolis.</p>', 
                'Residential', 
                'Downtown Indianapolis',
                'Available',
                true)
        ON CONFLICT DO NOTHING
      `);
      console.log('Sample off-market deal created successfully.');
    } catch (error) {
      console.error('Error creating sample off-market deal:', error.message);
    }
    
    console.log('\n✅ Database setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up database:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // End pool
    await pool.end();
  }
}

// Run setup
setupDatabase();
