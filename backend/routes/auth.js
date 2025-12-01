const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Simple sign-in: create or find by email (if provided) otherwise by name
router.post('/signin', async (req, res) => {
  try {
    const { name, email } = req.body || {};
    if (!name && !email) return res.status(400).json({ success: false, message: 'Name or email is required' });

    let user = null;
    if (email) user = await User.findOne({ email });
    if (!user && name) user = await User.findOne({ name });
    if (!user) user = await User.create({ name: name || email.split('@')[0], email });

    res.json({ success: true, data: { userId: user._id.toString(), name: user.name, email: user.email || null } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to sign in' });
  }
});

module.exports = router;
