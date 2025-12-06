const db = require('../database/db');

console.log('Starting off-market deals thumbnail migration...');

// Add thumbnailUrl and thumbnailType columns to off_market_deals table
db.run(`
  ALTER TABLE off_market_deals 
  ADD COLUMN thumbnailUrl TEXT
`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Error adding thumbnailUrl column:', err);
    process.exit(1);
  }
  console.log('✓ thumbnailUrl column added (or already exists)');

  db.run(`
    ALTER TABLE off_market_deals 
    ADD COLUMN thumbnailType TEXT
  `, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding thumbnailType column:', err);
      process.exit(1);
    }
    console.log('✓ thumbnailType column added (or already exists)');
    console.log('\n✅ Off-market deals thumbnail migration completed successfully!');
    
    // Close database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
        process.exit(1);
      }
      process.exit(0);
    });
  });
});

