const { connectDB } = require('../db');
const Book = require('../models/Book');

async function run() {
  try {
    await connectDB();

    await Book.deleteMany({});

    const PDF = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    const LOREM = (title) => `Chapter 1: Beginnings\n\n${title} opens in a world on the brink of change. Our protagonist faces a choice that will echo through time.\n\nChapter 2: Turning Tides\n\nAlliances shift and secrets surface as the journey deepens.\n\nChapter 3: Revelation\n\nThe truth arrives with a cost—and hope with a promise.`;

    const books = [
      {
        title: 'The Star Wanderer',
        author: 'A. Nova',
        description: 'An odyssey through distant galaxies and forgotten civilizations.',
        genre: 'Science Fiction',
summary: 'Captain Elara ventures beyond known space to uncover a cosmic mystery.',
        content: LOREM('The Star Wanderer'),
        price: 9.99,
        rating: 4.6,
totalRatings: 124,
        purchaseUrl: 'https://example.com/star-wanderer',
        pdfUrl: PDF
      },
      {
        title: 'Whispers of Eldoria',
        author: 'L. Thorne',
        description: 'A sweeping fantasy tale of magic, destiny, and courage.',
        genre: 'Fantasy',
summary: 'A reluctant mage must unite warring kingdoms to stop an ancient evil.',
        content: LOREM('Whispers of Eldoria'),
        price: 12.49,
        rating: 4.8,
totalRatings: 541,
        purchaseUrl: 'https://example.com/eldoria',
        pdfUrl: PDF
      },
      {
        title: 'Shadows in the Alley',
        author: 'M. Cross',
        description: 'A gritty mystery that twists and turns until the final page.',
        genre: 'Mystery',
summary: 'Detective Vale hunts a serial thief who never leaves a trace.',
        content: LOREM('Shadows in the Alley'),
        price: 7.99,
        rating: 4.2,
totalRatings: 213,
        purchaseUrl: 'https://example.com/shadows-alley',
        pdfUrl: PDF
      },
      {
        title: 'Hearts Aflame',
        author: 'C. Everly',
        description: 'A heartwarming romance about rediscovery and second chances.',
        genre: 'Romance',
summary: 'Two former lovers cross paths in a small coastal town.',
        content: LOREM('Hearts Aflame'),
        price: 6.49,
        rating: 4.0,
totalRatings: 89,
        purchaseUrl: 'https://example.com/hearts-aflame',
        pdfUrl: PDF
      },
      {
        title: 'Mind Over Matter',
        author: 'D. Harper',
        description: 'Practical strategies for building focus and resilience.',
        genre: 'Self-Help',
summary: 'A blueprint for habits that unlock creativity and productivity.',
        content: LOREM('Mind Over Matter'),
        price: 5.99,
        rating: 4.4,
totalRatings: 302,
        purchaseUrl: 'https://example.com/mind-over-matter',
        pdfUrl: PDF
      },
      {
        title: 'Echoes of the Past',
        author: 'R. Salim',
        description: 'A sweeping historical journey through revolt and redemption.',
        genre: 'History',
summary: 'A young scholar uncovers secrets that change the course of a nation.',
        content: LOREM('Echoes of the Past'),
        price: 10.99,
        rating: 4.1,
totalRatings: 156,
        purchaseUrl: 'https://example.com/echoes-past',
        pdfUrl: PDF
      },
      {
        title: 'Nightfall Protocol',
        author: 'S. Vega',
        description: 'A relentless thriller where every second counts.',
        genre: 'Thriller',
summary: 'An analyst races to stop a catastrophic cyber-attack.',
        content: LOREM('Nightfall Protocol'),
        price: 8.49,
        rating: 4.3,
totalRatings: 227,
        purchaseUrl: 'https://example.com/nightfall-protocol',
        pdfUrl: PDF
      },
      {
        title: 'Beneath the Floorboards',
        author: 'H. Mire',
        description: 'A chilling horror story that creeps under your skin.',
        genre: 'Horror',
summary: 'Strange noises lead a family to a terrifying discovery.',
        content: LOREM('Beneath the Floorboards'),
        price: 6.99,
        rating: 3.9,
totalRatings: 78,
        purchaseUrl: 'https://example.com/beneath-floorboards',
        pdfUrl: PDF
      }
    ];

    // Add 50 procedurally generated books across genres
    const extraGenres = ['Fantasy','Science Fiction','Mystery','Romance','Thriller','Horror','Biography','History','Self-Help','Non-Fiction'];
    for (let i = 1; i <= 50; i++) {
      const g = extraGenres[i % extraGenres.length];
      books.push({
        title: `EchoReads Collection #${i}`,
        author: `Author ${i}`,
        description: `A curated tale number ${i} in the EchoReads collection.`,
        genre: g,
        summary: `Highlights from collection #${i} in ${g}.`,
        content: LOREM(`EchoReads Collection #${i}`),
        price: Math.round((5 + (i % 10) + (i/10)) * 100) / 100,
        rating: Math.min(5, Math.round(((i % 5) + Math.random()*0.9 + 0.6) * 10) / 10),
        totalRatings: 20 + (i * 3),
        purchaseUrl: `https://example.com/collection-${i}`,
        pdfUrl: PDF
      });
    }

    // ensure every book has a JPEG cover image
    const withImages = books.map(b => ({
      ...b,
      imageUrl: b.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(b.title)}/600/800.jpg`
    }));

    const created = await Book.insertMany(withImages);
    console.log(`Seeded ${created.length} books.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();