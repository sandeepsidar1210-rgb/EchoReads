const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini client if key is configured
let genAI = null;
let geminiModel = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use gemini-1.5-flash as it is highly efficient and suitable for chat recommendations
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('✅ Gemini AI Engine loaded successfully.');
  } catch (err) {
    console.error('⚠️ Error initializing Gemini AI client:', err);
  }
} else {
  console.warn('⚠️ GEMINI_API_KEY not configured. Novia will run in offline rule-based mode.');
}

// Conversational RAG chatbot endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message = '' } = req.body || {};
    const lower = String(message).toLowerCase();
    
    // 1. RAG Context: Extract keywords and query matching books in MongoDB
    const stopWords = ['recommend', 'suggest', 'book', 'please', 'like', 'want', 'about', 'find', 'show', 'give', 'reads', 'read'];
    const keywords = lower
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
    
    let matchingBooks = [];
    if (keywords.length > 0) {
      matchingBooks = await Book.find({
        $or: [
          { title: { $regex: keywords.join('|'), $options: 'i' } },
          { author: { $regex: keywords.join('|'), $options: 'i' } },
          { genre: { $regex: keywords.join('|'), $options: 'i' } },
          { summary: { $regex: keywords.join('|'), $options: 'i' } }
        ]
      }).limit(5);
    }
    
    // Fallback context if no keywords matched
    if (matchingBooks.length === 0) {
      matchingBooks = await Book.find({}).sort({ rating: -1, totalRatings: -1 }).limit(3);
    }

    const context = matchingBooks.map(b => 
      `ID: ${b._id}\nTitle: ${b.title}\nAuthor: ${b.author}\nGenre: ${b.genre}\nRating: ${b.rating} (${b.totalRatings} ratings)\nSummary: ${b.summary}\nPrice: $${b.price}\n---`
    ).join('\n');

    // 2. Generate Response
    if (geminiModel) {
      const prompt = `System Prompt: You are Novia, a warm, helpful, and highly intelligent AI literary assistant for EchoReads digital bookstore. 
Your goal is to recommend books, describe plots, answer questions, and assist users with their book catalog inquiries.
Here is the dynamic context from the EchoReads catalog matching the user's request:
${context}

Instructions:
- Suggest books from the EchoReads catalog context provided above.
- Explain why you are recommending them based on the user's message.
- Format book titles in bold.
- CRITICAL: If you mention a book that is in the EchoReads catalog context, always include its ID in brackets like this: [BookID: <id>] immediately after the book title (e.g., "**Dracula** [BookID: 64b8aef...] by Bram Stoker..."). This will let our frontend render it as a rich card. Do not invent IDs or include this notation for books not listed in the context.

User Message: "${message}"`;

      const result = await geminiModel.generateContent(prompt);
      const responseText = result.response.text();
      return res.json({ success: true, message: 'Message received', response: responseText });
    }

    // 3. Mock Fallback Response if Gemini Key is missing
    let reply = `*(Offline Mode: Set GEMINI_API_KEY in backend .env to enable Gemini chatbot)*\n\n`;
    reply += `Hi! I'm Novia. I searched the EchoReads catalog for your request: "${message}".\n\n`;
    
    if (matchingBooks.length > 0) {
      reply += `Here are some recommendations from our catalog:\n\n` + 
        matchingBooks.map(b => `• **${b.title}** [BookID: ${b._id}] by ${b.author} (${b.genre}, Rating: ★${b.rating})\n*Summary: ${b.summary}*`).join('\n\n');
    } else {
      reply += `I couldn't find any specific matches. Feel free to browse our categories like Fantasy, Horror, Science Fiction, or Romance.`;
    }

    res.json({ success: true, message: 'Message received', response: reply });
  } catch (err) {
    console.error('Error in novia chatbot:', err);
    res.status(500).json({ success: false, message: 'Failed to process message' });
  }
});

// Book recommendations by preferences
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

