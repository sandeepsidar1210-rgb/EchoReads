const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Simple sign-in: create or find by email (if provided) otherwise by name
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
    if (email) user = await User.findOne({ email });
    if (!user && trimmedName) user = await User.findOne({ name: trimmedName });
    
    if (!user) {
      const userData = { name: trimmedName || email.split('@')[0] };
      if (email) userData.email = email;
      user = await User.create(userData);
    }

    res.json({ success: true, data: { userId: user._id.toString(), name: user.name, email: user.email || null } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to sign in' });
  }
});

module.exports = router;
