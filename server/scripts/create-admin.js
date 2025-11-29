require('dotenv').config();
const db = require('../database/db');
const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

const email = process.argv[2] || 'admin@blueflagrealty.com';
const password = process.argv[3] || 'admin123';

if (!email || !password) {
  console.error('Usage: node create-admin.js <email> <password>');
  process.exit(1);
}

// Check if admin already exists
db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
  if (err) {
    console.error('Error checking user:', err);
    process.exit(1);
  }

  try {
    // Hash password securely using bcrypt
    const hashedPassword = await hashPassword(password);

    if (user) {
      // Update existing user to admin
      db.run(
        'UPDATE users SET password = ?, role = ?, updatedAt = CURRENT_TIMESTAMP WHERE email = ?',
        [hashedPassword, 'admin', email],
        (err) => {
          if (err) {
            console.error('Error updating user:', err);
            process.exit(1);
          }
          console.log(`✅ Admin user updated: ${email}`);
          console.log(`   Password has been securely hashed`);
          process.exit(0);
        }
      );
    } else {
      // Create new admin user
      db.run(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [email, hashedPassword, 'admin'],
        function(err) {
          if (err) {
            console.error('Error creating admin:', err);
            process.exit(1);
          }
          console.log(`✅ Admin user created: ${email}`);
          console.log(`   Password has been securely hashed`);
          console.log(`   Note: Password is stored securely and cannot be retrieved`);
          process.exit(0);
        }
      );
    }
  } catch (error) {
    console.error('Error hashing password:', error);
    process.exit(1);
  }
});

