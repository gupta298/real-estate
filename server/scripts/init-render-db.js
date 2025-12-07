require('dotenv').config();
const { exec } = require('child_process');

// Use the EXTERNAL connection string from Render dashboard
// Format should be: postgres://user:password@host.render.com:5432/database?sslmode=require
process.env.DATABASE_URL = 'EXTERNAL_DATABASE_URL_FROM_RENDER';

console.log('Initializing Render database from local machine...');

// Run init-db command
exec('cd server && npm run init-db', (err, stdout, stderr) => {
  if (err) {
    console.error('Error initializing schema:', err);
    return;
  }
  console.log(stdout);
  
  // Then seed the database
  exec('cd server && npm run simple-seed', (err, stdout, stderr) => {
    if (err) {
      console.error('Error seeding database:', err);
      return;
    }
    console.log(stdout);
    console.log('Database initialization complete!');
  });
});
