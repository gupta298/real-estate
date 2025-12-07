const db = require('../database/db');
const fs = require('fs');
const path = require('path');

// Determine if we're using PostgreSQL or SQLite
const isPostgres = process.env.DATABASE_URL || process.env.NODE_ENV === 'production';

// Use appropriate schema based on database type
const schemaPath = isPostgres 
  ? path.join(__dirname, '../database/schema.postgres.sql')
  : path.join(__dirname, '../database/schema.sql');

console.log(`📊 Initializing ${isPostgres ? 'PostgreSQL' : 'SQLite'} database...`);
console.log(`Using schema: ${schemaPath}`);

const schema = fs.readFileSync(schemaPath, 'utf8');

async function initDatabase() {
  try {
    if (isPostgres) {
      // For PostgreSQL, we need to split the schema into separate statements
      // Split by semicolons and execute each statement
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        try {
          await db.run(statement);
        } catch (err) {
          // Log error but continue with other statements
          console.error(`Error executing statement: ${err.message}`);
          console.error(`Statement: ${statement.substring(0, 100)}...`);
        }
      }
      
      console.log('✅ PostgreSQL tables created or updated');
    } else {
      // For SQLite, we can just pass the entire schema to the database
      if (db.sqliteDb) {
        db.sqliteDb.exec(schema, (err) => {
          if (err) throw err;
        });
      } else {
        // If using promise wrapper
        const statements = schema.split(';').filter(s => s.trim().length > 0);
        for (const statement of statements) {
          await db.run(statement);
        }
      }
      console.log('✅ SQLite tables created or updated');
    }
    
    console.log('\n✅ Database initialization complete!');
    console.log('💡 Next steps:');
    console.log('   1. Configure MLS_API_KEY in server/.env');
    console.log('   2. Run: npm run sync-mls (or POST to /api/mls/sync)');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating database tables:', err.message);
    process.exit(1);
  }
}

initDatabase();

