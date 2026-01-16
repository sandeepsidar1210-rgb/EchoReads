const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect('mongodb://127.0.0.1:27017/echoreads')
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

app.use(cors());
app.use(express.json());
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api', require('./routes/books'));
app.use('/api/novia', require('./routes/novia'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cart', require('./routes/cart'));

// Serve frontend statically
const frontendDir = path.resolve(__dirname, '../frontend');
app.use(express.static(frontendDir));

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Fallback: serve index.html for root and known pages
app.get(['/', '/index.html', '/browse.html', '/signin.html', '/preview.html', '/download.html', '/external.html', '/genres.html', '/novia.html', '/admin.html', '/cart.html'], (req, res) => {
    res.sendFile(path.join(frontendDir, req.path === '/' ? 'index.html' : req.path.replace(/^\//, '')));
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
});
