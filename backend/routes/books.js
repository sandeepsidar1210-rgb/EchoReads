const express = require('express');
const router = express.Router();
const Book = require('../models/Book');

// Get all books with optional genre and sort
router.get('/', async (req, res) => {
  try {
    const { genre, sort } = req.query;
    const books = await Book.getAll(genre, sort);
    res.json({ success: true, data: books });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch books' });
  }
});

// Get available genres
router.get('/genres', (req, res) => {
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

  res.json({ success: true, data: genres });
});

// Get book details by ID
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.getById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({ success: true, data: book });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch book' });
  }
});

// Rate a book
router.post('/:id/rate', async (req, res) => {
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
    res.json({ success: true, message: 'Rating added successfully', data: book });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to rate book' });
  }
});

module.exports = router;
