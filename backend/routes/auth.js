const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

// Simple sign-in for mobile client: find or create by name/email
router.post('/signin', async (req, res) => {
  try {
    const { name } = req.body || {};
    let email = req.body?.email;
    
    if (typeof email === 'string') {
      email = email.trim().toLowerCase();
      if (email === '') email = undefined;
    }
    const trimmedName = typeof name === 'string' ? name.trim() : '';

    if (!trimmedName && !email) {
      return res.status(400).json({ success: false, message: 'Name or email is required' });
    }

    let user = null;
    if (email) {
      user = await User.findOne({ email });
    }
    if (!user && trimmedName) {
      user = await User.findOne({ name: trimmedName });
    }
    
    if (!user) {
      const targetEmail = email || `${trimmedName.replace(/\s+/g, '_').toLowerCase() || 'user'}_${Date.now()}@echoreads.local`;
      const targetPassword = 'mobile_user_default_password';
      user = await User.create({
        name: trimmedName || (email ? email.split('@')[0] : 'Mobile User'),
        email: targetEmail,
        password: targetPassword,
        role: 'user'
      });
    }

    res.json({
      success: true,
      data: {
        userId: user._id.toString(),
        name: user.name,
        email: user.email || null
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to sign in' });
  }
});

// Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({
      name: name.trim(),
      email: trimmedEmail,
      password,
      role: 'user'
    });

    res.status(201).json({
      success: true,
      data: {
        token: generateToken(user._id),
        user: {
          userId: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.json({
      success: true,
      data: {
        token: generateToken(user._id),
        user: {
          userId: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Get profile
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        userId: req.user._id.toString(),
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
  }
});

module.exports = router;
