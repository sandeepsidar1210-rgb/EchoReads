/*
 Import real public-domain novels from Project Gutenberg (via Gutendex API)
 Fills Book collection with real metadata and long summaries (first 2000 chars of text).
*/
const { connectDB } = require('../db');
const Book = require('../models/Book');

const GENRE_MAP = {
  'Science Fiction': ['Science fiction', 'Science Fiction', 'Sci-Fi'],
  'Fantasy': ['Fantasy'],
  'Mystery': ['Mystery', 'Detective and mystery stories'],
  'Romance': ['Romance'],
  'Thriller': ['Thriller', 'Suspense'],
  'Horror': ['Horror', 'Ghost stories'],
  'Biography': ['Biography', 'Biographies'],
  'History': ['History'],
  'Self-Help': ['Conduct of life', 'Self-Help'],
  'Non-Fiction': ['Nonfiction'],
  'Fiction': ['Fiction'],
  'Children': ['Children', "Children's literature"]
};

function mapSubjectsToGenre(subjects = []){
  const s = subjects.map(String);
  for (const [genre, needles] of Object.entries(GENRE_MAP)){
    if (s.some(x => needles.some(n => x.toLowerCase().includes(n.toLowerCase())))) return genre;
  }
  // fallback
  return 'Fiction';
}

async function getBooksFromGutendex(topic, limit = 10){
  const url = new URL('https://gutendex.com/books');
  url.searchParams.set('search', topic);
  url.searchParams.set('languages', 'en');
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Gutendex failed');
  const data = await resp.json();
  return (data.results || []).slice(0, limit);
}

function pickFormat(formats, type){
  return Object.entries(formats||{}).find(([k]) => k.toLowerCase().startsWith(type))?.[1] || null;
}

async function fetchExcerpt(textUrl, maxChars = 2000){
  if (!textUrl) return '';
  try {
    const r = await fetch(textUrl);
    let t = await r.text();
    // strip header/license noise heuristically (Gutenberg headers end around *** START OF THE PROJECT GUTENBERG EBOOK)
    const idx = t.indexOf('*** START');
    if (idx !== -1) t = t.slice(idx + 7*5); // crude skip
    return t.slice(0, maxChars).trim();
  } catch {
    return '';
  }
}

async function run(){
  await connectDB();

  // optional: clear existing
  await Book.deleteMany({});

  const topics = [
    'Science Fiction','Fantasy','Mystery','Romance','Thriller','Horror','Biography','History','Conduct of life','Nonfiction','Fiction',"Children's literature"
  ];

  const toInsert = [];

  for (const topic of topics){
    const results = await getBooksFromGutendex(topic, 12);
    for (const b of results){
      const author = (b.authors && b.authors[0]?.name) || 'Unknown';
      let imageUrl = pickFormat(b.formats, 'image/jpeg') || pickFormat(b.formats, 'image/png');
      // If no suitable raster image is available or we only have SVG, fall back to a JPEG placeholder
      if (!imageUrl || /\.svg($|\?)/i.test(String(imageUrl))) {
        imageUrl = `https://picsum.photos/seed/${encodeURIComponent(b.title)}/600/800.jpg`;
      }
      const pdfUrl = pickFormat(b.formats, 'application/pdf');
      const textUrl = pickFormat(b.formats, 'text/plain');
      const content = await fetchExcerpt(textUrl, 2000);
      const summary = content ? content.slice(0, 350) + (content.length>350?'…':'') : `A classic ${topic} work from Project Gutenberg.`;
      const genre = mapSubjectsToGenre(b.subjects);
      const price = Math.round((4.99 + Math.random()*10) * 100) / 100;
      const rating = Math.round((3.8 + Math.random()*1.2) * 10) / 10;
      const totalRatings = Math.floor(50 + Math.random()*500);
      const purchaseUrl = b.url || `https://www.gutenberg.org/ebooks/${b.id}`;

      toInsert.push({
        title: b.title,
        author,
        description: `Project Gutenberg public-domain book. Subjects: ${(b.subjects||[]).slice(0,5).join('; ')}`,
        imageUrl,
        genre,
        summary,
        content,
        price,
        rating,
        totalRatings,
        purchaseUrl,
        pdfUrl: pdfUrl || ''
      });
    }
  }

  const created = await Book.insertMany(toInsert);
  console.log(`Imported ${created.length} real books.`);
  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(1); });
