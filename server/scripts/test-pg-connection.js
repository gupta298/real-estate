/**
 * Simple script to test PostgreSQL connection
 */
require('dotenv').config();
const { Pool } = require('pg');

// Get connection string from command line or environment variable
const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: No database connection string provided.');
  console.error('Usage: node test-pg-connection.js "postgres://user:password@host:port/database"');
  console.error('Or set the DATABASE_URL environment variable.');
  process.exit(1);
}

console.log('Testing PostgreSQL connection...');
console.log(`Connection string: ${connectionString.replace(/:[^:@]+@/, ':***@')}`); // Hide password in logs

// Create a new pool
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

// Test connection
async function testConnection() {
  let client;
  try {
    // Try to connect
    console.log('Connecting...');
    client = await pool.connect();
    console.log('✅ Connection successful!');
    
    // Try a simple query
    console.log('Running test query...');
    const result = await client.query('SELECT current_timestamp as time, current_database() as database');
    console.log('✅ Query successful!');
    console.log('Database:', result.rows[0].database);
    console.log('Server time:', result.rows[0].time);
    
    // Test done
    console.log('\n✅ Connection test completed successfully!');
    return true;
  } catch (err) {
    console.error('❌ Connection test failed!');
    console.error('Error:', err.message);
    
    if (err.message.includes('getaddrinfo')) {
      console.error('\nThe hostname could not be resolved. Possible causes:');
      console.error('- Incorrect hostname in connection string');
      console.error('- Network connectivity issues');
      console.error('- Firewall blocking outgoing connections');
    } else if (err.message.includes('password authentication failed')) {
      console.error('\nAuthentication failed. Possible causes:');
      console.error('- Incorrect username or password');
      console.error('- Database user does not have required permissions');
    } else if (err.message.includes('ECONNREFUSED')) {
      console.error('\nConnection refused. Possible causes:');
      console.error('- Database server is not running');
      console.error('- Incorrect port number');
      console.error('- Firewall blocking connections to that port');
    }
    
    return false;
  } finally {
    // Release client back to pool
    if (client) {
      client.release();
    }
    
    // End pool
    await pool.end();
  }
}

// Run the test
testConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
