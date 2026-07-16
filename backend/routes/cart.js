const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const CartItem = require('../models/CartItem');
const User = require('../models/User');
const Book = require('../models/Book');

// Add to cart
router.post('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const { bookId, quantity = 1 } = req.body || {};
    if (!bookId) return res.status(400).json({ success: false, message: 'bookId is required' });

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ success: false, message: 'Invalid Book ID format' });
    }

    const book = await (Book.getById ? Book.getById(bookId) : Book.findById(bookId));
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    // upsert: if exists, increase quantity
    const item = await CartItem.findOneAndUpdate(
      { user: userId, book: book._id },
      { $setOnInsert: { userName: req.user.name }, $inc: { quantity: Number(quantity) || 1 } },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: { id: item._id, user: { id: userId, name: req.user.name }, book: { id: book._id, title: book.title }, quantity: item.quantity } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add to cart' });
  }
});

// List my cart
router.get('/mine', async (req, res) => {
  try {
    const userId = req.user._id;
    const items = await CartItem.find({ user: userId }).sort({ createdAt: -1 }).populate('book', 'title imageUrl genre price author');
    
    // Filter out items with null books (orphan references due to database re-seeding)
    const validItems = [];
    const orphanIds = [];
    
    for (const item of items) {
      if (item.book) {
        validItems.push(item);
      } else {
        orphanIds.push(item._id);
      }
    }
    
    // Clean up orphans asynchronously in the background
    if (orphanIds.length > 0) {
      CartItem.deleteMany({ _id: { $in: orphanIds } }).catch(err => {
        console.error('Error deleting orphan cart items:', err);
      });
    }
    
    res.json({ success: true, data: validItems });
  } catch (err) {
    console.error('Error listing cart:', err);
    res.status(500).json({ success: false, message: 'Failed to list cart' });
  }
});

// Remove from cart
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const deleted = await CartItem.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!deleted) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
});

module.exports = router;
