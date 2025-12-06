const db = require('../database/db');

console.log('Adding thumbnailUrl and thumbnailType columns to blogs table...');

db.serialize(() => {
  // Check if columns already exist
  db.get("PRAGMA table_info(blogs)", (err, rows) => {
    if (err) {
      console.error('Error checking table info:', err);
      process.exit(1);
    }

    db.all("PRAGMA table_info(blogs)", (err, columns) => {
      if (err) {
        console.error('Error getting table info:', err);
        process.exit(1);
      }

      const hasThumbnailUrl = columns.some(col => col.name === 'thumbnailUrl');
      const hasThumbnailType = columns.some(col => col.name === 'thumbnailType');

      if (hasThumbnailUrl && hasThumbnailType) {
        console.log('Columns already exist. Migration not needed.');
        process.exit(0);
      }

      // Add columns if they don't exist
      if (!hasThumbnailUrl) {
        db.run('ALTER TABLE blogs ADD COLUMN thumbnailUrl TEXT', (err) => {
          if (err) {
            console.error('Error adding thumbnailUrl column:', err);
            process.exit(1);
          }
          console.log('✓ Added thumbnailUrl column');
        });
      }

      if (!hasThumbnailType) {
        db.run('ALTER TABLE blogs ADD COLUMN thumbnailType TEXT', (err) => {
          if (err) {
            console.error('Error adding thumbnailType column:', err);
            process.exit(1);
          }
          console.log('✓ Added thumbnailType column');
          console.log('Migration completed successfully!');
          process.exit(0);
        });
      }
    });
  });
});

