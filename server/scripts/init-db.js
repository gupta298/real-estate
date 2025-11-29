const db = require('../database/db');
const fs = require('fs');
const path = require('path');

// Read and execute schema
const schemaPath = path.join(__dirname, '../database/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

console.log('📊 Initializing database...');

db.exec(schema, (err) => {
  if (err) {
    console.error('❌ Error creating tables:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Database tables created successfully');
    console.log('\n✅ Database initialization complete!');
    console.log('💡 Next steps:');
    console.log('   1. Configure MLS_API_KEY in server/.env');
    console.log('   2. Run: npm run sync-mls (or POST to /api/mls/sync)');
    process.exit(0);
  }
});

