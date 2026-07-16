const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Purchase = require('../models/Purchase');
const cache = require('../utils/cache');
const { protect, optionalProtect } = require('../middleware/auth');

// Helper to clear book list cache
async function clearBookCache() {
  if (cache.isAvailable) {
    await cache.flushPattern('books:*');
  }
}

// Get all books with optional genre, sort, and search
router.get('/', optionalProtect, async (req, res) => {
  try {
    const { genre, sort, search } = req.query;

    // Only cache if it is a regular list retrieval (not a search query)
    const cacheKey = `books:list:${genre || 'all'}:${sort || 'latest'}`;

    if (!search && cache.isAvailable) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.json({ success: true, data: cached, source: 'cache' });
      }
    }

    const books = await Book.getAll(genre, sort, search);

    if (!search && cache.isAvailable) {
      await cache.set(cacheKey, books, 300); // cache list for 5 minutes
    }

    res.json({ success: true, data: books, source: 'database' });
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch books' });
  }
});

// Get available genres
router.get('/genres', optionalProtect, async (req, res) => {
  try {
    const cacheKey = 'books:genres:list';
    if (cache.isAvailable) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.json({ success: true, data: cached, source: 'cache' });
      }
    }

    const genres = [
      'Fiction',
      'Non-Fiction',
      'Mystery',
      'Science Fiction',
      'Fantasy',
      'Romance',
      'Thriller',
      'Horror',
      'Biography',
      'History',
      'Self-Help',
      'Children'
    ];

    if (cache.isAvailable) {
      await cache.set(cacheKey, genres, 86400); // cache genres list for 24 hours
    }

    res.json({ success: true, data: genres, source: 'database' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch genres' });
  }
});

// Get secure book content for reading/listening (only if purchased or admin)
router.get('/:id/read', protect, async (req, res) => {
  try {
    const bookId = req.params.id;
    const userId = req.user._id;

    // Check if the user has purchased the book
    const purchase = await Purchase.findOne({ user: userId, book: bookId });
    const isAdmin = req.user && req.user.role === 'admin';

    if (!purchase && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You must purchase this book to read or listen to it.',
        requiresPurchase: true
      });
    }

    const book = await Book.getById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    res.json({
      success: true,
      data: {
        id: book._id,
        title: book.title,
        author: book.author,
        content: book.content || book.summary || 'No text content available for this book. Enjoy your preview!'
      }
    });
  } catch (err) {
    console.error('Error fetching secure book content:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch book content' });
  }
});

// Get book details by ID
router.get('/:id', optionalProtect, async (req, res) => {
  try {
    const book = await Book.getById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Evaluate if the logged-in user has already purchased the book
    let isPurchased = false;
    if (req.user) {
      const purchase = await Purchase.findOne({ user: req.user._id, book: book._id });
      isPurchased = !!purchase || req.user.role === 'admin';
    }

    const bookJSON = book.toJSON();
    bookJSON.isPurchased = isPurchased;

    res.json({ success: true, data: bookJSON });
  } catch (err) {
    console.error('Error fetching book detail:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch book' });
  }
});

// Rate a book
router.post('/:id/rate', protect, async (req, res) => {
  try {
    const ratingNum = Number(req.body?.rating);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be a number between 1 and 5' });
    }

    const book = await Book.getById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    await book.addRating(ratingNum);
    
    // Clear list cache since ratings have changed
    await clearBookCache();

    res.json({ success: true, message: 'Rating added successfully', data: book });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to rate book' });
  }
});

module.exports = router;

