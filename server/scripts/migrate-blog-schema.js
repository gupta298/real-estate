const db = require('../database/db');

console.log('Creating blog tables...');

// Create blogs table
db.run(`
  CREATE TABLE IF NOT EXISTS blogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featuredImageUrl TEXT,
    isPublished BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error('Error creating blogs table:', err);
    process.exit(1);
  }
  console.log('✅ Blogs table created');

  // Create blog_images table
  db.run(`
    CREATE TABLE IF NOT EXISTS blog_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      blogId INTEGER NOT NULL,
      imageUrl TEXT NOT NULL,
      thumbnailUrl TEXT,
      displayOrder INTEGER DEFAULT 0,
      caption TEXT,
      FOREIGN KEY (blogId) REFERENCES blogs(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error creating blog_images table:', err);
      process.exit(1);
    }
    console.log('✅ Blog images table created');

    // Create indexes
    db.run('CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(isPublished)', (err) => {
      if (err) {
        console.error('Error creating index:', err);
      } else {
        console.log('✅ Index created: idx_blogs_published');
      }

      db.run('CREATE INDEX IF NOT EXISTS idx_blogs_created ON blogs(createdAt)', (err) => {
        if (err) {
          console.error('Error creating index:', err);
        } else {
          console.log('✅ Index created: idx_blogs_created');
        }

        db.run('CREATE INDEX IF NOT EXISTS idx_blog_images ON blog_images(blogId)', (err) => {
          if (err) {
            console.error('Error creating index:', err);
          } else {
            console.log('✅ Index created: idx_blog_images');
          }

          // Close database connection
          db.close((err) => {
            if (err) {
              console.error('Error closing database:', err);
            } else {
              console.log('✅ Database migration completed');
            }
            process.exit(0);
          });
        });
      });
    });
  });
});

