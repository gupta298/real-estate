/**
 * Simple seeding script for PostgreSQL compatibility
 * Creates just one blog post and one off-market listing
 */

require('dotenv').config();
const db = require('../database/db');
const bcrypt = require('bcrypt');

// Determine if we're using PostgreSQL or SQLite
const isPostgres = process.env.DATABASE_URL || process.env.NODE_ENV === 'production';
console.log(`Using database: ${isPostgres ? 'PostgreSQL' : 'SQLite'}`);

// Helper function to hash passwords
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function seedSampleData() {
  try {
    console.log('🌱 Creating minimal seed data...');

    // Start transaction
    if (isPostgres) {
      await db.run('BEGIN;');
    }

    // Create one blog post
    console.log('Creating sample blog post...');
    const blogInsertSql = isPostgres ? 
      `INSERT INTO blogs (title, content, excerpt, isPublished) 
       VALUES ($1, $2, $3, $4) RETURNING id;` :
      `INSERT INTO blogs (title, content, excerpt, isPublished) 
       VALUES (?, ?, ?, ?);`;
    
    const blogParams = [
      "Welcome to Blue Flag Indianapolis",
      "<p>Welcome to our new real estate website! Here you'll find the latest listings and real estate news for Indianapolis.</p><p>Our team is dedicated to helping you find the perfect property.</p>",
      "Welcome to our new real estate website! Here you'll find the latest listings and real estate news...",
      true
    ];
    
    let blogId;
    if (isPostgres) {
      const result = await db.get(blogInsertSql, blogParams);
      blogId = result.id;
    } else {
      const result = await db.run(blogInsertSql, blogParams);
      blogId = result.lastID;
    }
    
    // Create one blog image
    if (blogId) {
      const blogImageSql = isPostgres ?
        `INSERT INTO blog_images (blogId, imageUrl, thumbnailUrl, displayOrder) 
         VALUES ($1, $2, $3, $4);` :
        `INSERT INTO blog_images (blogId, imageUrl, thumbnailUrl, displayOrder)
         VALUES (?, ?, ?, ?);`;
      
      await db.run(blogImageSql, [
        blogId,
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80",
        0
      ]);
    }
    
    // Create one off-market listing
    console.log('Creating sample off-market listing...');
    const offMarketSql = isPostgres ?
      `INSERT INTO off_market_deals (title, content, propertyType, propertySubType, 
         area, status, contactName, contactEmail, isActive)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id;` :
      `INSERT INTO off_market_deals (title, content, propertyType, propertySubType, 
         area, status, contactName, contactEmail, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`;
    
    const offMarketParams = [
      "Downtown Indianapolis Investment Opportunity",
      "<p>Exclusive off-market opportunity in downtown Indianapolis. This property features multiple units and is perfect for investors looking for steady income.</p><p>Contact us for more details!</p>",
      "Residential",
      "Multi-family",
      "Downtown Indianapolis",
      "Available",
      "Blue Flag Realty Team",
      "contact@blueflagindy.com",
      true
    ];
    
    let dealId;
    if (isPostgres) {
      const result = await db.get(offMarketSql, offMarketParams);
      dealId = result.id;
    } else {
      const result = await db.run(offMarketSql, offMarketParams);
      dealId = result.lastID;
    }
    
    // Create one off-market image
    if (dealId) {
      const dealImageSql = isPostgres ?
        `INSERT INTO off_market_deal_images (dealId, imageUrl, thumbnailUrl, displayOrder)
         VALUES ($1, $2, $3, $4);` :
        `INSERT INTO off_market_deal_images (dealId, imageUrl, thumbnailUrl, displayOrder)
         VALUES (?, ?, ?, ?);`;
      
      await db.run(dealImageSql, [
        dealId,
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80",
        0
      ]);
    }

    // Create admin user
    console.log('Creating admin user...');
    
    // Default admin credentials - can be overridden with environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@blueflagrealty.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    // Check if admin already exists
    const checkUserQuery = isPostgres
      ? "SELECT id FROM users WHERE email = $1;"
      : "SELECT id FROM users WHERE email = ?;";
    
    const existingUser = await db.get(checkUserQuery, [adminEmail]);
    
    // Hash the password
    const hashedPassword = await hashPassword(adminPassword);
    
    if (existingUser) {
      // Update existing user
      const updateUserQuery = isPostgres
        ? "UPDATE users SET password = $1, role = $2, updatedAt = CURRENT_TIMESTAMP WHERE email = $3;"
        : "UPDATE users SET password = ?, role = ?, updatedAt = CURRENT_TIMESTAMP WHERE email = ?;";
      
      await db.run(updateUserQuery, [hashedPassword, 'admin', adminEmail]);
      console.log(`✅ Admin user updated: ${adminEmail}`);
    } else {
      // Create new admin user
      const insertUserQuery = isPostgres
        ? "INSERT INTO users (email, password, role) VALUES ($1, $2, $3);"
        : "INSERT INTO users (email, password, role) VALUES (?, ?, ?);"
      
      await db.run(insertUserQuery, [adminEmail, hashedPassword, 'admin']);
      console.log(`✅ Admin user created: ${adminEmail}`);
    }
    
    // Commit transaction if using PostgreSQL
    if (isPostgres) {
      await db.run('COMMIT;');
    }
    
    console.log('✅ Minimal seed data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating seed data:', error);
    
    // Rollback if using PostgreSQL
    if (isPostgres) {
      try {
        await db.run('ROLLBACK;');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
    }
    
    process.exit(1);
  }
}

// Check if database is initialized before seeding
async function checkAndSeed() {
  try {
    // Different check query based on database type
    const checkQuery = isPostgres 
      ? "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blogs';"
      : "SELECT name FROM sqlite_master WHERE type='table' AND name='blogs';";
    
    const row = await db.get(checkQuery);
    
    if (!row) {
      console.error('❌ Database not initialized. Please run: npm run init-db');
      process.exit(1);
    }
    
    // Database is ready, run seeding
    await seedSampleData();
  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }
}

// Run the script
checkAndSeed();
