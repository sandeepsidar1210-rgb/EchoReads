const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const User = require('../models/User');
const Book = require('../models/Book');
const CartItem = require('../models/CartItem');
const { protect, adminOnly } = require('../middleware/auth');
const Stripe = require('stripe');

// Initialize Stripe SDK if credentials exist
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log('💳 Stripe Payment Gateway active.');
  } catch (err) {
    console.error('⚠️ Error initializing Stripe SDK:', err);
  }
} else {
  console.warn('⚠️ STRIPE_SECRET_KEY not set. Falling back to sandbox mock checkout payments.');
}

// Create a single purchase (direct checkout from book details)
router.post('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { bookId, name, address, pincode, paymentMethod } = req.body || {};
    if (!bookId) return res.status(400).json({ success: false, message: 'bookId is required' });

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ success: false, message: 'Invalid Book ID format' });
    }

    const book = await Book.findById(bookId);
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

// Create Stripe Checkout Session for Shopping Cart
router.post('/create-checkout-session', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, address, pincode } = req.body || {};

    let cartItems = await CartItem.find({ user: userId }).populate('book');
    
    // Clean up null/orphan items dynamically
    const orphanIds = cartItems.filter(item => !item.book).map(item => item._id);
    if (orphanIds.length > 0) {
      await CartItem.deleteMany({ _id: { $in: orphanIds } });
      cartItems = cartItems.filter(item => item.book);
    }
    
    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Shopping cart is empty.' });
    }

    // 1. Fallback if Stripe is not configured: checkout instantly as mock purchase
    if (!stripe) {
      const purchases = [];
      for (const item of cartItems) {
        if (!item.book) continue;
        const purchase = await Purchase.create({
          user: userId,
          userName: name || req.user.name,
          userEmail: req.user.email || null,
          book: item.book._id,
          price: item.book.price * item.quantity,
          address: address || 'Mock Address',
          pincode: pincode || '000000',
          paymentMethod: 'Mock Stripe Payment',
          transactionId: 'mock_tx_' + Date.now() + Math.random().toString(36).substring(7)
        });
        purchases.push(purchase);
      }

      // Clear cart
      await CartItem.deleteMany({ user: userId });

      return res.json({ 
        success: true, 
        mock: true, 
        message: 'Mock Stripe checkout successful! Book unlocked.',
        data: purchases 
      });
    }

    // 2. Stripe Checkout Session Flow
    const lineItems = cartItems.map(item => {
      // Ensure image is valid URL path
      let imageUrls = [];
      if (item.book.imageUrl && item.book.imageUrl.startsWith('http')) {
        imageUrls.push(item.book.imageUrl);
      }
      
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.book.title,
            description: `by ${item.book.author} | Genre: ${item.book.genre}`,
            images: imageUrls,
          },
          unit_amount: Math.round(item.book.price * 100), // stripe accepts pricing in cents
        },
        quantity: item.quantity,
      };
    });

    const referer = req.headers.referer || '';
    const successUrl = referer.includes('checkout.html')
      ? referer.replace('checkout.html', 'purchases.html?stripe_success=true&session_id={CHECKOUT_SESSION_ID}')
      : `${req.protocol}://${req.get('host')}/purchases.html?stripe_success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = referer.includes('checkout.html')
      ? referer.replace('checkout.html', 'cart.html')
      : `${req.protocol}://${req.get('host')}/cart.html`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: String(userId),
        userName: name || req.user.name,
        userEmail: req.user.email || '',
        address: address || '',
        pincode: pincode || '',
      }
    });

    res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Error creating Stripe Checkout Session:', err);
    res.status(500).json({ success: false, message: 'Stripe transaction initialization failed.' });
  }
});

// Verify Successful Stripe payment & fulfill orders
router.post('/verify-stripe-checkout', protect, async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required.' });
    }

    if (!stripe) {
      return res.status(400).json({ success: false, message: 'Stripe is offline.' });
    }

    // Retrieve session detail
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Payment incomplete or invalid session.' });
    }

    // Prevent duplicate orders for same Stripe session
    const existing = await Purchase.findOne({ transactionId: sessionId });
    if (existing) {
      return res.json({ success: true, message: 'Payment verified.', data: [existing] });
    }

    const { userId, userName, userEmail, address, pincode } = session.metadata;
    const cartItems = await CartItem.find({ user: userId }).populate('book');

    const purchases = [];
    for (const item of cartItems) {
      if (!item.book) continue;
      const purchase = await Purchase.create({
        user: userId,
        userName: userName,
        userEmail: userEmail || null,
        book: item.book._id,
        price: item.book.price * item.quantity,
        address: address || '',
        pincode: pincode || '',
        paymentMethod: 'Stripe Credit/Debit Card',
        transactionId: sessionId
      });
      purchases.push(purchase);
    }

    // Clear shopping cart
    await CartItem.deleteMany({ user: userId });

    res.json({ success: true, message: 'Stripe payment verified. Order completed.', data: purchases });
  } catch (err) {
    console.error('Error in Stripe validation:', err);
    res.status(500).json({ success: false, message: 'Payment validation failed.' });
  }
});

// List purchases for a user
router.get('/mine', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const items = await Purchase.find({ user: userId }).sort({ createdAt: -1 }).populate('book', 'title genre price');
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to list purchases' });
  }
});

// Classic checkout from cart (Cash / UPI)
router.post('/checkout', protect, async (req, res) => {
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
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const purchases = await Purchase.find().sort({ createdAt: -1 }).populate('book', 'title genre price').populate('user', 'name email');
    res.json({ success: true, data: purchases });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch purchases' });
  }
});

module.exports = router;