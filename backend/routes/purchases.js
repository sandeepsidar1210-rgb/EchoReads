const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const User = require('../models/User');
const Book = require('../models/Book');

// Create a purchase
router.post('/', async (req, res) => {
  try {
    const userId = req.header('x-user-id') || req.body.userId;
    const { bookId, price } = req.body || {};
    if (!userId) return res.status(401).json({ success: false, message: 'Missing user id' });
    if (!bookId || typeof price !== 'number') return res.status(400).json({ success: false, message: 'bookId and price are required' });

    const [user, book] = await Promise.all([
      User.findById(userId),
      Book.getById ? Book.getById(bookId) : Book.findById(bookId)
    ]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    const purchase = await Purchase.create({ 
      user: user._id,
      userName: user.name,
      userEmail: user.email || null,
      book: book._id,
      price 
    });
    res.json({ success: true, data: { id: purchase._id, user: { id: user._id, name: user.name }, book: { id: book._id, title: book.title }, price: purchase.price } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create purchase' });
  }
});

// List purchases for a user
router.get('/mine', async (req, res) => {
  try {
    const userId = req.header('x-user-id') || req.query.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Missing user id' });
    const items = await Purchase.find({ user: userId }).sort({ createdAt: -1 }).populate('book', 'title genre price');
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to list purchases' });
  }
});

module.exports = router;