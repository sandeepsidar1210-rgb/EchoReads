const { connectDB } = require('../db');
const Book = require('../models/Book');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  try {
    await connectDB();

    // Find all books containing picsum.photos in their cover image URL
    const books = await Book.find({ imageUrl: /picsum\.photos/ });
    console.log(`Found ${books.length} books with placeholder images to update.`);

    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      console.log(`[${i + 1}/${books.length}] Fetching cover for "${book.title}" by "${book.author}"...`);

      let coverId = null;

      // Attempt 1: Search by title AND author
      try {
        const queryUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}&fields=cover_i&limit=1`;
        const res = await fetch(queryUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.docs && data.docs.length > 0 && data.docs[0].cover_i) {
            coverId = data.docs[0].cover_i;
          }
        }
      } catch (err) {
        console.error(`  Error searching with author for "${book.title}":`, err.message);
      }

      // Attempt 2: Fallback to title only if attempt 1 failed
      if (!coverId) {
        try {
          const queryUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(book.title)}&fields=cover_i&limit=1`;
          const res = await fetch(queryUrl);
          if (res.ok) {
            const data = await res.json();
            if (data.docs && data.docs.length > 0 && data.docs[0].cover_i) {
              coverId = data.docs[0].cover_i;
            }
          }
        } catch (err) {
          console.error(`  Error searching title only for "${book.title}":`, err.message);
        }
      }

      if (coverId) {
        const newUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
        book.imageUrl = newUrl;
        await book.save();
        console.log(`  ✔ Updated: ${newUrl}`);
      } else {
        console.log(`  ✕ No cover found for "${book.title}". Keeping placeholder.`);
      }

      // Throttle queries to avoid Open Library rate limits
      await delay(500);
    }

    console.log('Finished updating book covers.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
