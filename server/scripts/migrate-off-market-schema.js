require('dotenv').config();
const db = require('../database/db');

console.log('🔄 Migrating off_market_deals table...');

db.serialize(() => {
  // Add new columns if they don't exist
  db.run('ALTER TABLE off_market_deals ADD COLUMN propertyType TEXT', (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding propertyType:', err);
    }
  });

  db.run('ALTER TABLE off_market_deals ADD COLUMN propertySubType TEXT', (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding propertySubType:', err);
    }
  });

  db.run('ALTER TABLE off_market_deals ADD COLUMN area TEXT', (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding area:', err);
    }
  });

  db.run('ALTER TABLE off_market_deals ADD COLUMN status TEXT DEFAULT "open"', (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding status:', err);
    }
  });

  // Create indexes
  db.run('CREATE INDEX IF NOT EXISTS idx_offmarket_type ON off_market_deals(propertyType)', (err) => {
    if (err) {
      console.error('Error creating type index:', err);
    }
  });

  db.run('CREATE INDEX IF NOT EXISTS idx_offmarket_status ON off_market_deals(status)', (err) => {
    if (err) {
      console.error('Error creating status index:', err);
    } else {
      console.log('✅ Migration complete!');
      process.exit(0);
    }
  });
});

