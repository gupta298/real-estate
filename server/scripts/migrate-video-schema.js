const db = require('../database/db');
const path = require('path');

console.log('Starting video schema migration...');

// Add blog_videos table
db.run(`
  CREATE TABLE IF NOT EXISTS blog_videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blogId INTEGER NOT NULL,
    videoUrl TEXT NOT NULL,
    thumbnailUrl TEXT,
    displayOrder INTEGER DEFAULT 0,
    caption TEXT,
    FOREIGN KEY (blogId) REFERENCES blogs(id) ON DELETE CASCADE
  )
`, (err) => {
  if (err) {
    console.error('Error creating blog_videos table:', err);
    process.exit(1);
  }
  console.log('✓ blog_videos table created');

  // Add index for blog_videos
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_blog_videos ON blog_videos(blogId)
  `, (err) => {
    if (err) {
      console.error('Error creating blog_videos index:', err);
      process.exit(1);
    }
    console.log('✓ blog_videos index created');

    // Add off_market_deal_videos table
    db.run(`
      CREATE TABLE IF NOT EXISTS off_market_deal_videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dealId INTEGER NOT NULL,
        videoUrl TEXT NOT NULL,
        thumbnailUrl TEXT,
        displayOrder INTEGER DEFAULT 0,
        caption TEXT,
        FOREIGN KEY (dealId) REFERENCES off_market_deals(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('Error creating off_market_deal_videos table:', err);
        process.exit(1);
      }
      console.log('✓ off_market_deal_videos table created');

      // Add index for off_market_deal_videos
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_offmarket_videos ON off_market_deal_videos(dealId)
      `, (err) => {
        if (err) {
          console.error('Error creating off_market_deal_videos index:', err);
          process.exit(1);
        }
        console.log('✓ off_market_deal_videos index created');
        console.log('\n✅ Video schema migration completed successfully!');
        
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
  });
});

