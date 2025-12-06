const db = require('../database/db');
const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Checking and running database migrations...\n');

// Check if migration is needed
function checkVideoSchemaMigration(callback) {
  db.all("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('blog_videos', 'off_market_deal_videos')", (err, rows) => {
    if (err) {
      callback(err, false);
      return;
    }
    const hasBothTables = rows.length === 2;
    callback(null, !hasBothTables);
  });
}

function checkOffMarketThumbnailMigration(callback) {
  db.all("PRAGMA table_info(off_market_deals)", (err, columns) => {
    if (err) {
      callback(err, false);
      return;
    }
    const hasThumbnailUrl = columns.some(col => col.name === 'thumbnailUrl');
    const hasThumbnailType = columns.some(col => col.name === 'thumbnailType');
    callback(null, !hasThumbnailUrl || !hasThumbnailType);
  });
}

function checkBlogThumbnailMigration(callback) {
  db.all("PRAGMA table_info(blogs)", (err, columns) => {
    if (err) {
      callback(err, false);
      return;
    }
    const hasThumbnailUrl = columns.some(col => col.name === 'thumbnailUrl');
    const hasThumbnailType = columns.some(col => col.name === 'thumbnailType');
    callback(null, !hasThumbnailUrl || !hasThumbnailType);
  });
}

const migrations = [
  { 
    name: 'Video Schema', 
    script: 'migrate-video-schema.js',
    checkNeeded: checkVideoSchemaMigration
  },
  { 
    name: 'Off-Market Thumbnail', 
    script: 'migrate-off-market-thumbnail.js',
    checkNeeded: checkOffMarketThumbnailMigration
  },
  { 
    name: 'Blog Thumbnail', 
    script: 'migrate-blog-thumbnail.js',
    checkNeeded: checkBlogThumbnailMigration
  },
];

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

async function runMigrations() {
  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i];
    
    try {
      // Check if migration is needed
      const needsMigration = await new Promise((resolve, reject) => {
        migration.checkNeeded((err, needed) => {
          if (err) reject(err);
          else resolve(needed);
        });
      });

      if (!needsMigration) {
        console.log(`[${i + 1}/${migrations.length}] ⏭️  ${migration.name} migration not needed (already applied)\n`);
        skipCount++;
        continue;
      }

      console.log(`[${i + 1}/${migrations.length}] 🔄 Running ${migration.name} migration...`);
      const scriptPath = path.join(__dirname, migration.script);
      execSync(`node "${scriptPath}"`, { 
        stdio: 'inherit',
        cwd: __dirname 
      });
      successCount++;
      console.log(`✅ ${migration.name} migration completed\n`);
    } catch (error) {
      // If exit code is non-zero, it's an error
      if (error.status !== 0 && error.status !== undefined) {
        console.error(`❌ ${migration.name} migration failed\n`);
        errorCount++;
      } else if (error.message) {
        console.error(`❌ Error checking ${migration.name} migration:`, error.message);
        errorCount++;
      } else {
        // Exit code 0 means success (even if migration was skipped)
        successCount++;
      }
    }
  }

  console.log(`\n✨ Migration summary:`);
  console.log(`   ✅ Completed: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  if (errorCount > 0) {
    console.log(`   ❌ Errors: ${errorCount}`);
  }
  console.log(`   📊 Total: ${migrations.length}\n`);

  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    }

    if (errorCount > 0) {
      console.log('⚠️  Some migrations had errors. Please check the output above.');
      process.exit(1);
    } else {
      console.log('✅ All migrations completed successfully!');
      process.exit(0);
    }
  });
}

runMigrations();

