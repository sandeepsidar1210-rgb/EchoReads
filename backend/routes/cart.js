const express = require('express');
const router = express.Router();
const CartItem = require('../models/CartItem');
const User = require('../models/User');
const Book = require('../models/Book');

// Add to cart
router.post('/', async (req, res) => {
  try {
    const userId = req.header('x-user-id') || req.body.userId;
    const { bookId, quantity = 1 } = req.body || {};
    if (!userId) return res.status(401).json({ success: false, message: 'Missing user id' });
    if (!bookId) return res.status(400).json({ success: false, message: 'bookId is required' });

    const [user, book] = await Promise.all([
      User.findById(userId),
      Book.getById ? Book.getById(bookId) : Book.findById(bookId)
    ]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    // upsert: if exists, increase quantity
    const item = await CartItem.findOneAndUpdate(
      { user: user._id, book: book._id },
      { $setOnInsert: { userName: user.name }, $inc: { quantity: Number(quantity) || 1 } },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: { id: item._id, user: { id: user._id, name: user.name }, book: { id: book._id, title: book.title }, quantity: item.quantity } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add to cart' });
  }
});

// List my cart
router.get('/mine', async (req, res) => {
  try {
    const userId = req.header('x-user-id') || req.query.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Missing user id' });
    const items = await CartItem.find({ user: userId }).sort({ createdAt: -1 }).populate('book', 'title genre price');
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to list cart' });
  }
});

// Remove from cart
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.header('x-user-id') || req.body.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Missing user id' });
    const deleted = await CartItem.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!deleted) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
});

module.exports = router;
