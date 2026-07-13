require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;


mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });



const { protect } = require('./middleware/auth');

app.use(cors());
app.use(express.json());
app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', protect, require('./routes/books'));
app.use('/api/novia', protect, require('./routes/novia'));
app.use('/api/purchases', protect, require('./routes/purchases'));
app.use('/api/cart', protect, require('./routes/cart'));

// Serve frontend statically
const frontendDir = path.resolve(__dirname, '../frontend');
app.use(express.static(frontendDir));

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/migrate-covers', async (req, res) => {
    try {
        const Book = require('./models/Book');
        const books = await Book.find({ imageUrl: /picsum\.photos/ });
        let updatedCount = 0;
        const https = require('https');

        const httpsGetJson = (url) => {
            return new Promise((resolve, reject) => {
                https.get(url, { headers: { 'User-Agent': 'EchoReads/1.0' } }, (response) => {
                    let data = '';
                    response.on('data', chunk => { data += chunk; });
                    response.on('end', () => {
                        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
                    });
                }).on('error', reject);
            });
        };

        for (const book of books) {
            let coverId = null;
            // Title + Author search
            try {
                const queryUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}&fields=cover_i&limit=1`;
                const data = await httpsGetJson(queryUrl);
                if (data.docs && data.docs.length > 0 && data.docs[0].cover_i) {
                    coverId = data.docs[0].cover_i;
                }
            } catch (err) {}

            // Title only search
            if (!coverId) {
                try {
                    const queryUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(book.title)}&fields=cover_i&limit=1`;
                    const data = await httpsGetJson(queryUrl);
                    if (data.docs && data.docs.length > 0 && data.docs[0].cover_i) {
                        coverId = data.docs[0].cover_i;
                    }
                } catch (err) {}
            }

            if (coverId) {
                book.imageUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
                await book.save();
                updatedCount++;
            }

            // Wait 250ms to be gentle to API
            await new Promise(resolve => setTimeout(resolve, 250));
        }

        res.json({ success: true, message: `Successfully updated ${updatedCount} books to original Open Library covers.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Fallback: serve index.html for root and known pages
app.get(['/', '/index.html', '/browse.html', '/signin.html', '/preview.html', '/download.html', '/external.html', '/genres.html', '/novia.html', '/admin.html', '/cart.html'], (req, res) => {
    res.sendFile(path.join(frontendDir, req.path === '/' ? 'index.html' : req.path.replace(/^\//, '')));
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
