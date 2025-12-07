const express = require('express');
const router = express.Router();
const db = require('../database/db');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// Helper function to hash password using bcrypt (secure, salted, slow-by-design)
async function hashPassword(password) {
  // bcrypt automatically generates a salt and includes it in the hash
  // rounds = 10 means 2^10 = 1024 iterations (good balance of security and performance)
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Helper function to compare password with hash
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Helper function to generate session token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Sign up
router.post('/signup', async (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Validate password strength
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  // Check if user exists
  try {
    const user = await db.get('SELECT id FROM users WHERE email = $1', [email]);
    
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password securely using bcrypt
    const hashedPassword = await hashPassword(password);
      
    // Create user with RETURNING id for PostgreSQL compatibility
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (email, password, firstName, lastName, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [email, hashedPassword, firstName || null, lastName || null, phone || null],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    
    // Get the new user ID from the result
    const userId = result && result.rows && result.rows[0] ? result.rows[0].id : null;
    
    if (!userId) {
      console.error('Error: Failed to get user ID after insert');
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Create session
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO user_sessions (userId, token, expiresAt) VALUES ($1, $2, $3)',
        [userId, token, expiresAt.toISOString()],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({
      success: true,
      token,
      user: {
        id: userId,
        email,
        firstName,
        lastName,
        phone
      }
    });
  } catch (error) {
    console.error('Error in signup process:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// Sign in - OPTIMIZED with direct connection
router.post('/signin', async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /auth/signin`);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Set a safety timeout to prevent hanging requests
  const requestTimeout = setTimeout(() => {
    console.error('⚠️ EMERGENCY TIMEOUT - Signin request taking too long');
    return res.status(504).json({ 
      error: 'Request timeout', 
      _emergency: true,
      message: 'Authentication request timed out'
    });
  }, 10000); // 10 second safety net
  
  try {
    const startTime = Date.now();
    const client = await db.pool.connect();
    
    try {
      // Step 1: Find user by email
      console.log('⏱️ Looking up user by email');
      const userResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (userResult.rows.length === 0) {
        // Don't reveal if user exists or not (security best practice)
        client.release();
        clearTimeout(requestTimeout);
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      const user = userResult.rows[0];
      console.log(`⏱️ User found in ${Date.now() - startTime}ms`);
      
      // Step 2: Compare password with stored hash using bcrypt
      console.log('⏱️ Verifying password');
      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        client.release();
        clearTimeout(requestTimeout);
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      console.log(`⏱️ Password verified in ${Date.now() - startTime}ms`);

      // Step 3: Create session
      console.log('⏱️ Creating user session');
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      await client.query(
        'INSERT INTO user_sessions (userId, token, expiresAt) VALUES ($1, $2, $3)',
        [user.id, token, expiresAt.toISOString()]
      );
      
      // Release the client and return results
      client.release();
      clearTimeout(requestTimeout);
      console.log(`⏱️ Signin completed in ${Date.now() - startTime}ms`);
      
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role
        }
      });
    } catch (err) {
      client.release();
      clearTimeout(requestTimeout);
      console.error('Error processing signin:', err);
      return res.status(500).json({ error: 'Authentication failed', details: err.message });
    }
  } catch (err) {
    clearTimeout(requestTimeout);
    console.error('Error connecting to database for signin:', err);
    return res.status(500).json({ error: 'Failed to connect to database', details: err.message });
  }
});

// Sign out - OPTIMIZED with direct connection
router.post('/signout', async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /auth/signout`);
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }
  
  try {
    const startTime = Date.now();
    const client = await db.pool.connect();
    
    try {
      console.log('⏱️ Deleting user session');
      await client.query('DELETE FROM user_sessions WHERE token = $1', [token]);
      
      client.release();
      console.log(`⏱️ Signout completed in ${Date.now() - startTime}ms`);
      res.json({ success: true });
    } catch (err) {
      client.release();
      console.error('Error processing signout:', err);
      return res.status(500).json({ error: 'Failed to sign out', details: err.message });
    }
  } catch (err) {
    console.error('Error connecting to database for signout:', err);
    return res.status(500).json({ error: 'Failed to connect to database', details: err.message });
  }
});

// Get current user - OPTIMIZED with direct connection
router.get('/me', async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /auth/me`);
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  // Set a safety timeout to prevent hanging requests
  const requestTimeout = setTimeout(() => {
    console.error('⚠️ EMERGENCY TIMEOUT - Get current user request taking too long');
    return res.status(504).json({ 
      error: 'Request timeout', 
      _emergency: true,
      message: 'User authentication request timed out'
    });
  }, 10000); // 10 second safety net
  
  try {
    const startTime = Date.now();
    const client = await db.pool.connect();
    
    try {
      console.log('⏱️ Getting current user by token');
      const userQuery = `
        SELECT u.* FROM users u
        INNER JOIN user_sessions s ON u.id = s.userId
        WHERE s.token = $1 AND s.expiresAt > CURRENT_TIMESTAMP
      `;
      
      const userResult = await client.query(userQuery, [token]);
      
      if (userResult.rows.length === 0) {
        client.release();
        clearTimeout(requestTimeout);
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      
      const user = userResult.rows[0];
      
      client.release();
      clearTimeout(requestTimeout);
      console.log(`⏱️ Got current user in ${Date.now() - startTime}ms`);
      
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role
        }
      });
    } catch (err) {
      client.release();
      clearTimeout(requestTimeout);
      console.error('Error getting current user:', err);
      return res.status(500).json({ error: 'Failed to get user information', details: err.message });
    }
  } catch (err) {
    clearTimeout(requestTimeout);
    console.error('Error connecting to database for user info:', err);
    return res.status(500).json({ error: 'Failed to connect to database', details: err.message });
  }
});

// Update profile - OPTIMIZED with direct connection
router.put('/profile', authenticate, async (req, res) => {
  console.log(`[${new Date().toISOString()}] PUT /auth/profile for user ${req.user.id}`);
  const { firstName, lastName, phone, email } = req.body;
  const userId = req.user.id;

  // Set a safety timeout to prevent hanging requests
  const requestTimeout = setTimeout(() => {
    console.error('⚠️ EMERGENCY TIMEOUT - Update profile request taking too long');
    return res.status(504).json({ 
      error: 'Request timeout', 
      _emergency: true,
      message: 'Profile update request timed out'
    });
  }, 10000); // 10 second safety net
  
  try {
    const startTime = Date.now();
    const client = await db.pool.connect();
    
    try {
      // Begin transaction for profile update
      await client.query('BEGIN');
      
      // Step 1: Check if email is being changed and if it's already taken
      if (email && email !== req.user.email) {
        console.log('⏱️ Checking if email is available');
        const existingUserResult = await client.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2', 
          [email, userId]
        );
        
        if (existingUserResult.rows.length > 0) {
          await client.query('ROLLBACK');
          client.release();
          clearTimeout(requestTimeout);
          return res.status(400).json({ error: 'Email already in use' });
        }
        
        // Step 2a: Update user with email change
        console.log('⏱️ Updating user profile with email change');
        await client.query(
          'UPDATE users SET firstName = $1, lastName = $2, phone = $3, email = $4, updatedAt = CURRENT_TIMESTAMP WHERE id = $5',
          [firstName || null, lastName || null, phone || null, email, userId]
        );
      } else {
        // Step 2b: Update user without email change
        console.log('⏱️ Updating user profile');
        await client.query(
          'UPDATE users SET firstName = $1, lastName = $2, phone = $3, updatedAt = CURRENT_TIMESTAMP WHERE id = $4',
          [firstName || null, lastName || null, phone || null, userId]
        );
      }
      
      // Step 3: Get updated user info
      console.log('⏱️ Getting updated user information');
      const userResult = await client.query(
        'SELECT id, email, firstName, lastName, phone, role FROM users WHERE id = $1', 
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        clearTimeout(requestTimeout);
        return res.status(404).json({ error: 'User not found after update' });
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      const user = userResult.rows[0];
      
      client.release();
      clearTimeout(requestTimeout);
      console.log(`⏱️ Profile update completed in ${Date.now() - startTime}ms`);
      
      res.json({ success: true, user });
    } catch (err) {
      // Rollback on error
      await client.query('ROLLBACK');
      client.release();
      clearTimeout(requestTimeout);
      console.error('Error updating user profile:', err);
      return res.status(500).json({ error: 'Failed to update profile', details: err.message });
    }
  } catch (err) {
    clearTimeout(requestTimeout);
    console.error('Error connecting to database for profile update:', err);
    return res.status(500).json({ error: 'Failed to connect to database', details: err.message });
  }
});

// Change password - OPTIMIZED with direct connection
router.put('/change-password', authenticate, async (req, res) => {
  console.log(`[${new Date().toISOString()}] PUT /auth/change-password for user ${req.user.id}`);
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  // Set a safety timeout to prevent hanging requests
  const requestTimeout = setTimeout(() => {
    console.error('⚠️ EMERGENCY TIMEOUT - Password change request taking too long');
    return res.status(504).json({ 
      error: 'Request timeout', 
      _emergency: true,
      message: 'Password change request timed out'
    });
  }, 10000); // 10 second safety net
  
  try {
    const startTime = Date.now();
    const client = await db.pool.connect();
    
    try {
      // Begin transaction for password change
      await client.query('BEGIN');
      
      // Step 1: Get current user with password
      console.log('⏱️ Getting user password information');
      const userResult = await client.query('SELECT password FROM users WHERE id = $1', [userId]);
      
      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        clearTimeout(requestTimeout);
        return res.status(404).json({ error: 'User not found' });
      }
      
      const user = userResult.rows[0];
      
      // Step 2: Verify current password
      console.log('⏱️ Verifying current password');
      const isPasswordValid = await comparePassword(currentPassword, user.password);

      if (!isPasswordValid) {
        await client.query('ROLLBACK');
        client.release();
        clearTimeout(requestTimeout);
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      
      console.log('⏱️ Current password verified');
      
      // Step 3: Hash new password
      console.log('⏱️ Hashing new password');
      const hashedNewPassword = await hashPassword(newPassword);

      // Step 4: Update password
      console.log('⏱️ Updating password');
      await client.query(
        'UPDATE users SET password = $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedNewPassword, userId]
      );
      
      // Commit transaction
      await client.query('COMMIT');
      
      client.release();
      clearTimeout(requestTimeout);
      console.log(`⏱️ Password change completed in ${Date.now() - startTime}ms`);
      
      res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
      // Rollback on error
      await client.query('ROLLBACK');
      client.release();
      clearTimeout(requestTimeout);
      console.error('Error changing password:', err);
      return res.status(500).json({ error: 'Failed to change password', details: err.message });
    }
  } catch (err) {
    clearTimeout(requestTimeout);
    console.error('Error connecting to database for password change:', err);
    return res.status(500).json({ error: 'Failed to connect to database', details: err.message });
  }
});

// Middleware to verify authentication - OPTIMIZED with direct connection
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Set a short safety timeout for this middleware since it's used frequently
  const requestTimeout = setTimeout(() => {
    console.error('⚠️ EMERGENCY TIMEOUT - Authentication middleware taking too long');
    return res.status(504).json({ 
      error: 'Authentication timeout', 
      _emergency: true
    });
  }, 5000); // 5 second safety net
  
  try {
    const startTime = Date.now();
    const client = await db.pool.connect();
    
    try {
      const userQuery = `
        SELECT u.* FROM users u
        INNER JOIN user_sessions s ON u.id = s.userId
        WHERE s.token = $1 AND s.expiresAt > CURRENT_TIMESTAMP
      `;
      
      const userResult = await client.query(userQuery, [token]);
      client.release();
      
      if (userResult.rows.length === 0) {
        clearTimeout(requestTimeout);
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      
      clearTimeout(requestTimeout);
      req.user = userResult.rows[0];
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`⏱️ Auth middleware completed in ${Date.now() - startTime}ms`);
      }
      
      next();
    } catch (err) {
      client.release();
      clearTimeout(requestTimeout);
      console.error('Authentication error:', err);
      return res.status(500).json({ error: 'Authentication error', details: err.message });
    }
  } catch (err) {
    clearTimeout(requestTimeout);
    console.error('Error connecting to database for authentication:', err);
    return res.status(500).json({ error: 'Failed to connect to database', details: err.message });
  }
}

module.exports = { router, authenticate };

