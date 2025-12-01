const express = require('express');
const router = express.Router();
const Book = require('../models/Book');

// Simple AI Assistant placeholder endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message = '' } = req.body || {};

    let reply = "Hello! I'm Novia. Ask me for book suggestions by genre, e.g., 'recommend sci-fi'.";
    const lower = String(message).toLowerCase();

    // If user mentions a genre, suggest top books in that genre
    const genres = ['fiction','non-fiction','mystery','science fiction','sci-fi','fantasy','romance','thriller','horror','biography','history','self-help','children'];
    const matched = genres.find(g => lower.includes(g));

    if (matched) {
      const genreQuery = matched === 'sci-fi' ? 'Science Fiction' : matched.replace(/\b\w/g, c => c.toUpperCase());
      const recs = await Book.find({ genre: genreQuery }).sort({ rating: -1, totalRatings: -1 }).limit(3);
      if (recs.length) {
        reply = `Top picks in ${genreQuery}: ` + recs.map(b => `${b.title} by ${b.author} (★ ${b.rating})`).join('; ') + '. Want more? Try narrowing your taste!';
      } else {
        reply = `I couldn't find books in ${genreQuery} yet. Try another genre!`;
      }
    } else if (lower.includes('recommend') || lower.includes('suggest')) {
      const recs = await Book.find({}).sort({ rating: -1, totalRatings: -1 }).limit(3);
      reply = recs.length
        ? 'You might enjoy: ' + recs.map(b => `${b.title} (${b.genre})`).join(', ') + '.'
        : "I don't have any books yet. Please try again later.";
    }

    res.json({ success: true, message: 'Message received', response: reply });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to process message' });
  }
});

// Book recommendations by preferences (e.g., { genre: 'Fantasy' })
router.post('/recommendations', async (req, res) => {
  try {
    const preferences = req.body?.preferences || {};
    const query = {};
    if (preferences.genre) query.genre = preferences.genre;

    const recs = await Book.find(query).sort({ rating: -1, totalRatings: -1 }).limit(10);
    res.json({ success: true, message: 'Recommendations generated', data: recs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate recommendations' });
  }
});

module.exports = router;
