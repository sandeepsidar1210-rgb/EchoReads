const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const User = require('../models/User');
const Book = require('../models/Book');
const CartItem = require('../models/CartItem');
const { protect, adminOnly } = require('../middleware/auth');

// Create a purchase
router.post('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const { bookId, name, address, pincode, paymentMethod } = req.body || {};
    if (!bookId) return res.status(400).json({ success: false, message: 'bookId is required' });

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ success: false, message: 'Invalid Book ID format' });
    }

    const book = await (Book.getById ? Book.getById(bookId) : Book.findById(bookId));
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    const purchase = await Purchase.create({ 
      user: userId,
      userName: name || req.user.name,
      userEmail: req.user.email || null,
      book: book._id,
      price: book.price,
      address: address || '',
      pincode: pincode || '',
      paymentMethod: paymentMethod || 'Cash on Delivery'
    });
    res.json({ success: true, data: { id: purchase._id, user: { id: userId, name: req.user.name }, book: { id: book._id, title: book.title }, price: purchase.price } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create purchase' });
  }
});

// List purchases for a user
router.get('/mine', async (req, res) => {
  try {
    const userId = req.user._id;
    const items = await Purchase.find({ user: userId }).sort({ createdAt: -1 }).populate('book', 'title genre price');
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to list purchases' });
  }
});

// Checkout from cart
router.post('/checkout', async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, address, pincode, paymentMethod } = req.body || {};
    if (!address || !pincode || !paymentMethod) return res.status(400).json({ success: false, message: 'Address, pincode, and payment method are required' });

    const cartItems = await CartItem.find({ user: userId }).populate('book');
    if (cartItems.length === 0) return res.status(400).json({ success: false, message: 'Cart is empty' });

    const purchases = [];
    for (const item of cartItems) {
      if (!item.book) continue;
      const purchase = await Purchase.create({
        user: userId,
        userName: name || req.user.name,
        userEmail: req.user.email || null,
        book: item.book._id,
        price: item.book.price * item.quantity,
        address: address || '',
        pincode: pincode || '',
        paymentMethod: paymentMethod || 'Cash on Delivery'
      });
      purchases.push(purchase);
    }

    // Clear cart
    await CartItem.deleteMany({ user: userId });

    res.json({ success: true, data: purchases.map(p => ({ id: p._id, book: p.book, price: p.price })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to checkout' });
  }
});

// Get all purchases (for admin)
router.get('/', adminOnly, async (req, res) => {
  try {
    const purchases = await Purchase.find().sort({ createdAt: -1 }).populate('book', 'title genre price').populate('user', 'name email');
    res.json({ success: true, data: purchases });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch purchases' });
  }
});

module.exports = router;