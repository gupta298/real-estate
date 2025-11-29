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
  db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error('Error checking user:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    try {
      // Hash password securely using bcrypt
      const hashedPassword = await hashPassword(password);
      
      // Create user
      db.run(
        'INSERT INTO users (email, password, firstName, lastName, phone) VALUES (?, ?, ?, ?, ?)',
        [email, hashedPassword, firstName || null, lastName || null, phone || null],
        function(err) {
          if (err) {
            console.error('Error creating user:', err);
            return res.status(500).json({ error: 'Failed to create user' });
          }

          // Create session
          const token = generateToken();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

          db.run(
            'INSERT INTO user_sessions (userId, token, expiresAt) VALUES (?, ?, ?)',
            [this.lastID, token, expiresAt.toISOString()],
            (err) => {
              if (err) {
                console.error('Error creating session:', err);
                return res.status(500).json({ error: 'Failed to create session' });
              }

              res.json({
                success: true,
                token,
                user: {
                  id: this.lastID,
                  email,
                  firstName,
                  lastName,
                  phone
                }
              });
            }
          );
        }
      );
    } catch (error) {
      console.error('Error hashing password:', error);
      return res.status(500).json({ error: 'Failed to create user' });
    }
  });
});

// Sign in
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Find user by email
  db.get(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (err, user) => {
      if (err) {
        console.error('Error finding user:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!user) {
        // Don't reveal if user exists or not (security best practice)
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      try {
        // Compare password with stored hash using bcrypt
        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Create session
        const token = generateToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

        db.run(
          'INSERT INTO user_sessions (userId, token, expiresAt) VALUES (?, ?, ?)',
          [user.id, token, expiresAt.toISOString()],
          (err) => {
            if (err) {
              console.error('Error creating session:', err);
              return res.status(500).json({ error: 'Failed to create session' });
            }

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
          }
        );
      } catch (error) {
        console.error('Error comparing password:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );
});

// Sign out
router.post('/signout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  db.run('DELETE FROM user_sessions WHERE token = ?', [token], (err) => {
    if (err) {
      console.error('Error deleting session:', err);
      return res.status(500).json({ error: 'Failed to sign out' });
    }

    res.json({ success: true });
  });
});

// Get current user
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  db.get(
    `SELECT u.* FROM users u
     INNER JOIN user_sessions s ON u.id = s.userId
     WHERE s.token = ? AND s.expiresAt > datetime('now')`,
    [token],
    (err, user) => {
      if (err) {
        console.error('Error finding user:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      delete user.password;
      res.json({ user });
    }
  );
});

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  const { firstName, lastName, phone, email } = req.body;
  const userId = req.user.id;

  // Check if email is being changed and if it's already taken
  if (email && email !== req.user.email) {
    db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId], async (err, existingUser) => {
      if (err) {
        console.error('Error checking email:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }

      // Update user
      db.run(
        'UPDATE users SET firstName = ?, lastName = ?, phone = ?, email = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [firstName || null, lastName || null, phone || null, email, userId],
        (err) => {
          if (err) {
            console.error('Error updating profile:', err);
            return res.status(500).json({ error: 'Failed to update profile' });
          }

          // Get updated user
          db.get('SELECT id, email, firstName, lastName, phone, role FROM users WHERE id = ?', [userId], (err, user) => {
            if (err) {
              return res.status(500).json({ error: 'Internal server error' });
            }
            res.json({ success: true, user });
          });
        }
      );
    });
  } else {
    // Update user without email change
    db.run(
      'UPDATE users SET firstName = ?, lastName = ?, phone = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [firstName || null, lastName || null, phone || null, userId],
      (err) => {
        if (err) {
          console.error('Error updating profile:', err);
          return res.status(500).json({ error: 'Failed to update profile' });
        }

        // Get updated user
        db.get('SELECT id, email, firstName, lastName, phone, role FROM users WHERE id = ?', [userId], (err, user) => {
          if (err) {
            return res.status(500).json({ error: 'Internal server error' });
          }
          res.json({ success: true, user });
        });
      }
    );
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

  // Get current user with password
  db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
    if (err) {
      console.error('Error finding user:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    try {
      // Verify current password
      const isPasswordValid = await comparePassword(currentPassword, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password
      db.run(
        'UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedNewPassword, userId],
        (err) => {
          if (err) {
            console.error('Error updating password:', err);
            return res.status(500).json({ error: 'Failed to update password' });
          }

          res.json({ success: true, message: 'Password updated successfully' });
        }
      );
    } catch (error) {
      console.error('Error comparing password:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
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
     WHERE s.token = ? AND s.expiresAt > datetime('now')`,
    [token],
    (err, user) => {
      if (err) {
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

