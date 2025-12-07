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

// Sign in
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find user by email
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE email = $1',
        [email],
        (err, user) => {
          if (err) reject(err);
          else resolve(user);
        }
      );
    });

    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare password with stored hash using bcrypt
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create session
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO user_sessions (userId, token, expiresAt) VALUES ($1, $2, $3)',
        [user.id, token, expiresAt.toISOString()],
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
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in signin process:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Sign out
router.post('/signout', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM user_sessions WHERE token = $1', [token], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return res.status(500).json({ error: 'Failed to sign out' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await new Promise((resolve, reject) => {
      db.get(
        `SELECT u.* FROM users u
         INNER JOIN user_sessions s ON u.id = s.userId
         WHERE s.token = $1 AND s.expiresAt > CURRENT_TIMESTAMP`,
        [token],
        (err, user) => {
          if (err) reject(err);
          else resolve(user);
        }
      );
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    delete user.password;
    res.json({ user });
  } catch (error) {
    console.error('Error finding user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  const { firstName, lastName, phone, email } = req.body;
  const userId = req.user.id;

  try {
    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const existingUser = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId], (err, user) => {
          if (err) reject(err);
          else resolve(user);
        });
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }

      // Update user with email change
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE users SET firstName = $1, lastName = $2, phone = $3, email = $4, updatedAt = CURRENT_TIMESTAMP WHERE id = $5',
          [firstName || null, lastName || null, phone || null, email, userId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    } else {
      // Update user without email change
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE users SET firstName = $1, lastName = $2, phone = $3, updatedAt = CURRENT_TIMESTAMP WHERE id = $4',
          [firstName || null, lastName || null, phone || null, userId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    // Get updated user
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, email, firstName, lastName, phone, role FROM users WHERE id = $1', [userId], (err, user) => {
        if (err) reject(err);
        else resolve(user);
      });
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  try {
    // Get current user with password
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT password FROM users WHERE id = $1', [userId], (err, user) => {
        if (err) reject(err);
        else resolve(user);
      });
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password = $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedNewPassword, userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error in password change process:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to verify authentication
function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  db.get(
    `SELECT u.* FROM users u
     INNER JOIN user_sessions s ON u.id = s.userId
     WHERE s.token = $1 AND s.expiresAt > CURRENT_TIMESTAMP`,
    [token],
    (err, user) => {
      if (err) {
        console.error('Authentication error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      req.user = user;
      next();
    }
  );
}

module.exports = { router, authenticate };

