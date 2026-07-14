const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // 1. Check JWT Authorization Header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  // 2. Check x-user-id Header (for Mobile)
  const xUserId = req.headers['x-user-id'];
  if (xUserId) {
    try {
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(xUserId)) {
        return res.status(401).json({ success: false, message: 'Not authorized, invalid user ID format' });
      }
      req.user = await User.findById(xUserId).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }
      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Not authorized, database error' });
    }
  }

  if (!token && !xUserId) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token or user ID provided' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  } else {
    return res.status(403).json({ success: false, message: 'Forbidden, admin access only' });
  }
};

module.exports = { protect, adminOnly };
