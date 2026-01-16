const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const User = require('../models/User');
const Book = require('../models/Book');
const CartItem = require('../models/CartItem');

// Create a purchase
router.post('/', async (req, res) => {
  try {
    const userId = req.header('x-user-id') || req.body.userId;
    const { bookId, price, name, address, pincode, paymentMethod } = req.body || {};
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
      userName: name || user.name,
      userEmail: user.email || null,
      book: book._id,
      price,
      address: address || '',
      pincode: pincode || '',
      paymentMethod: paymentMethod || 'Cash on Delivery'
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

// Checkout from cart
router.post('/checkout', async (req, res) => {
  try {
    const userId = req.header('x-user-id') || req.body.userId;
    const { name, address, pincode, paymentMethod } = req.body || {};
    if (!userId) return res.status(401).json({ success: false, message: 'Missing user id' });
    if (!address || !pincode || !paymentMethod) return res.status(400).json({ success: false, message: 'Address, pincode, and payment method are required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const cartItems = await CartItem.find({ user: userId }).populate('book');
    if (cartItems.length === 0) return res.status(400).json({ success: false, message: 'Cart is empty' });

    const purchases = [];
    for (const item of cartItems) {
      const purchase = await Purchase.create({
        user: user._id,
        userName: name || user.name,
        userEmail: user.email || null,
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
    res.status(500).json({ success: false, message: 'Failed to checkout' });
  }
});

// Get all purchases (for admin)
router.get('/', async (req, res) => {
  try {
    const purchases = await Purchase.find().sort({ createdAt: -1 }).populate('book', 'title genre price').populate('user', 'name email');
    res.json({ success: true, data: purchases });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch purchases' });
  }
});

module.exports = router;