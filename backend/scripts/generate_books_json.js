const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let geminiModel = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('✅ Gemini client initialized successfully for generator.');
  } catch (err) {
    console.error('⚠️ Gemini client initialization failed:', err);
  }
}

// Robust fetch helper with retry logic and exponential backoff
async function fetchWithRetry(url, options = {}, retries = 3, delay = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429) {
        // Too Many Requests - back off
        console.log(`  ⚠ Rate limited (429) on ${url}. Retrying in ${delay * 2}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay * 2));
        continue;
      }
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`  ⚠ Fetch failed for ${url}: ${err.message}. Retrying in ${delay}ms... (${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.8;
    }
  }
}

async function httpsGetJson(url, timeoutMs = 15000) {
  try {
    const res = await fetchWithRetry(url, {
      headers: { 'User-Agent': 'EchoReads/1.0' },
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!res || !res.ok) return null;
    return await res.json();
  } catch (e) {
    console.log(`  ✕ Fetch JSON failed for ${url}: ${e.message}`);
    return null;
  }
}

async function fetchGutenbergText(purchaseId, timeoutMs = 8000) {
  if (!purchaseId) return '';
  const url = `https://www.gutenberg.org/cache/epub/${purchaseId}/pg${purchaseId}.txt`;
  try {
    const res = await fetchWithRetry(url, {
      headers: { 'User-Agent': 'EchoReads/1.0' },
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!res || !res.ok) return '';
    let text = await res.text();
    
    let cleanText = text;
    const idx = cleanText.indexOf('*** START');
    if (idx !== -1) {
      const lineEnd = cleanText.indexOf('\n', idx);
      if (lineEnd !== -1) cleanText = cleanText.slice(lineEnd).trim();
    }
    const footerIdx = cleanText.indexOf('*** END');
    if (footerIdx !== -1) cleanText = cleanText.slice(0, footerIdx).trim();
    
    return cleanText.slice(0, 3000).trim();
  } catch (e) {
    console.log(`  ✕ Gutenberg text fetch failed for ID ${purchaseId}: ${e.message}`);
    return '';
  }
}

async function generateGeminiSummary(title, author, retries = 3) {
  if (!geminiModel) return '';
  let delay = 2000;
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`  🤖 Asking Gemini to generate immersive detailed summary for "${title}" (attempt ${i + 1}/${retries})...`);
      const prompt = `Write a beautiful, immersive, 3-paragraph detailed summary/preview of the classic book '${title}' by '${author}' for an online e-book reader. Write it in an elegant, captivating style that captures the book's atmosphere, themes, and key characters, suitable to serve as a preview/excerpt. Do not include markdown headers or placeholders. Just return the text paragraphs.`;
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (e) {
      console.error(`  ✕ Gemini summary attempt failed: ${e.message}`);
      if (i < retries - 1) {
        console.log(`  Retrying Gemini generation in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  }
  return '';
}

async function generateGeminiCover(title, author, retries = 2) {
  if (!geminiModel) return '';
  let delay = 2000;
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`  🤖 Asking Gemini to find cover image URL or Open Library cover ID for "${title}"...`);
      const prompt = `For the classic book '${title}' by '${author}', provide the Open Library cover ID (a number) if you know it, OR a stable public domain cover image URL. Return ONLY the number or the URL, with absolutely no other text, markdown formatting, or punctuation.`;
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      if (/^\d+$/.test(text)) {
        return `https://covers.openlibrary.org/b/id/${text}-L.jpg`;
      }
      if (text.startsWith('http')) {
        return text;
      }
    } catch (e) {
      console.error(`  ✕ Gemini cover attempt failed: ${e.message}`);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  }
  return '';
}

function mk(title, author, genre, summary, purchaseId=null){
  const seed = encodeURIComponent(title);
  return {
    title, author, genre,
    description: summary,
    summary,
    content: '',
    imageUrl: '',
    price: Math.round((4.99 + Math.random()*10) * 100)/100,
    rating: Math.round((3.8 + Math.random()*1.2) * 10)/10,
    totalRatings: Math.floor(100 + Math.random()*1000),
    purchaseUrl: purchaseId ? `https://www.gutenberg.org/ebooks/${purchaseId}` : '',
    pdfUrl: purchaseId ? `https://www.gutenberg.org/ebooks/${purchaseId}` : '',
    purchaseId
  };
}

const REALS = [
  mk('Pride and Prejudice','Jane Austen','Romance','A witty and incisive tale of manners, love, and societal expectations in Regency England.',1342),
  mk('Sense and Sensibility','Jane Austen','Romance','Two sisters navigate love and heartbreak, balancing reason with emotion.',161),
  mk('Emma','Jane Austen','Romance','A charming matchmaker learns the limits of her schemes and the truths of her own heart.',158),
  mk('Persuasion','Jane Austen','Romance','Years after a broken engagement, second chances blossom amid regret and maturity.',105),
  mk('Mansfield Park','Jane Austen','Romance','Fanny Price, quiet and steadfast, confronts vanity and virtue in an English estate.',141),
  mk('Wuthering Heights','Emily Brontë','Romance','A fierce, storm-tossed love that haunts the moors and the souls bound to them.',768),
  mk('Jane Eyre','Charlotte Brontë','Romance','An orphan’s resilience leads her to independence, moral conviction, and true love.',1260),
  mk('Agnes Grey','Anne Brontë','Fiction','A governess faces hardship and dignity in a candid portrait of Victorian life.',217),
  mk('Great Expectations','Charles Dickens','Fiction','An orphan’s rise and reckoning with ambition, affection, and self-deception.',1400),
  mk('Oliver Twist','Charles Dickens','Fiction','A boy endures the underbelly of London, seeking kindness and a place to belong.',730),
  mk('A Tale of Two Cities','Charles Dickens','History','Love and sacrifice unfold against the turmoil of the French Revolution.',98),
  mk('David Copperfield','Charles Dickens','Fiction','A richly-drawn journey from troubled boyhood to authorship and self-knowledge.',766),
  mk('Bleak House','Charles Dickens','Fiction','A labyrinthine legal case entangles lives in fog, mystery, and biting satire.',1023),
  mk('Moby-Dick','Herman Melville','Adventure','A whaling voyage becomes an obsessive pursuit of a white whale and destiny.',2701),
  mk('The Scarlet Letter','Nathaniel Hawthorne','Fiction','Sin, stigma, and strength under a harsh theocracy in colonial New England.',33),
  mk('The Last of the Mohicans','James Fenimore Cooper','Adventure','Frontier conflict and cross-cultural bonds amid the French and Indian War.',940),
  mk('The Picture of Dorian Gray','Oscar Wilde','Fiction','A beautiful man’s portrait bears the scars of his corrupt pleasures.',174),
  mk('Dracula','Bram Stoker','Horror','A cunning vampire haunts modernity; a band of friends fights the encroaching dark.',345),
  mk('Frankenstein','Mary Shelley','Horror','An ambitious experiment unleashes a creature seeking understanding and justice.',84),
  mk('The Strange Case of Dr Jekyll and Mr Hyde','Robert Louis Stevenson','Horror','Respectable façades and monstrous urges split a soul in two.',43),
  mk('Treasure Island','Robert Louis Stevenson','Adventure','Pirates, peril, and the lure of buried gold ignite a boy’s coming-of-age.',120),
  mk('Kidnapped','Robert Louis Stevenson','Adventure','Flight, friendship, and honor across the rugged Scottish Highlands.',271),
  mk('The Time Machine','H. G. Wells','Science Fiction','A traveler ventures into distant futures to witness evolution and decay.',35),
  mk('The War of the Worlds','H. G. Wells','Science Fiction','Martian invaders shatter complacency with terrifying, relentless force.',36),
  mk('The Invisible Man','H. G. Wells','Science Fiction','A genius turns invisible—and discovers isolation, power, and ruin.',5230),
  mk('Twenty Thousand Leagues Under the Seas','Jules Verne','Science Fiction','Aboard the Nautilus, wonders and mysteries of the deep unfold.',18857),
  mk('Around the World in 80 Days','Jules Verne','Adventure','A wager sends a precise gentleman on a whirlwind global voyage.',103),
  mk('Journey to the Center of the Earth','Jules Verne','Science Fiction','A daring descent reveals a hidden world beneath our feet.',18857),
  mk('The Count of Monte Cristo','Alexandre Dumas','Adventure','Betrayal gives rise to reinvention, justice, and a masterful revenge.',1184),
  mk('The Three Musketeers','Alexandre Dumas','Adventure','Swashbuckling camaraderie proclaims “All for one, and one for all!”',1257),
  mk('Crime and Punishment','Fyodor Dostoevsky','Fiction','A tormented mind confronts guilt, morality, and the possibility of redemption.',2554),
  mk('The Brothers Karamazov','Fyodor Dostoevsky','Fiction','Faith, doubt, and patricide entangle a family in philosophical drama.',28054),
  mk('Anna Karenina','Leo Tolstoy','Romance','Passion and society collide in a sweeping Russian masterpiece.',1399),
  mk('War and Peace','Leo Tolstoy','History','Napoleonic wars reshape destinies in an intimate epic of life and love.',2600),
  mk('The Adventures of Tom Sawyer','Mark Twain','Children','Mischief and adventure on the Mississippi in sunlit Americana.',74),
  mk('Adventures of Huckleberry Finn','Mark Twain','Fiction','A boy and a runaway man seek freedom on a winding river.',76),
  mk('The Call of the Wild','Jack London','Adventure','A sled dog answers ancient instincts in the brutal North.',215),
  mk('White Fang','Jack London','Adventure','A wild-born creature meets cruelty and compassion on the path to trust.',910),
  mk('The Adventures of Sherlock Holmes','Arthur Conan Doyle','Mystery','A brilliant detective unravels puzzles with logic and panache.',1661),
  mk('The Hound of the Baskervilles','Arthur Conan Doyle','Mystery','A spectral hound stalks a cursed family on the moor.',2852),
  mk('The Sign of the Four','Arthur Conan Doyle','Mystery','A mysterious pact and a stolen treasure test Holmes and Watson.',2097),
  mk('The Metamorphosis','Franz Kafka','Fiction','A man wakes as an insect; alienation and duty gnaw at the human heart.',5200),
  mk('Heart of Darkness','Joseph Conrad','Fiction','A river journey peers into colonial horror and the abyss within.',219),
  mk('The Turn of the Screw','Henry James','Horror','Ambiguous apparitions unsettle a governess and her charges.',209),
  mk('Middlemarch','George Eliot','Fiction','Personal hopes and social webs entwine in a profound provincial study.',145),
  mk('Far from the Madding Crowd','Thomas Hardy','Romance','Love and independence collide across Wessex’s fields and storms.',107),
  mk('Tess of the d’Urbervilles','Thomas Hardy','Romance','Fate and injustice shadow a young woman’s tragic course.',110),
  mk('The Secret Garden','Frances Hodgson Burnett','Children','A hidden garden heals grief, opening hearts to wonder.',113),
  mk('Little Women','Louisa May Alcott','Fiction','Four sisters grow through trials, art, and affection in New England.',514),
  mk('Peter Pan','J. M. Barrie','Children','Neverland invites fearless flights and bittersweet dreams.',16),
  mk('The Wonderful Wizard of Oz','L. Frank Baum','Children','A cyclone carries a girl to a land of courage, heart, and home.',55),
  mk('The Wind in the Willows','Kenneth Grahame','Children','Friendship, folly, and riverbank rambles with Mole, Rat, and Toad.',289),
  mk('A Princess of Mars','Edgar Rice Burroughs','Science Fiction','A Civil War veteran awakens on Mars to battles and romance.',62),
  mk('Tarzan of the Apes','Edgar Rice Burroughs','Adventure','An orphaned lord, raised by apes, discovers his identity.',78),
  mk('The Jungle Book','Rudyard Kipling','Children','Tales of beasts and belonging in the Indian jungle.',236),
  mk('Don Quixote','Miguel de Cervantes','Fiction','A knight-errant’s delusions mirror the power—and peril—of stories.',996),
  mk('Gulliver’s Travels','Jonathan Swift','Fantasy','Voyages to strange lands reveal sharp satire of human follies.',829),
  mk('Robinson Crusoe','Daniel Defoe','Adventure','Shipwrecked survival breeds ingenuity, solitude, and moral reckoning.',521),
  mk('The Odyssey','Homer','Fantasy','Odysseus endures gods, monsters, and temptation in a quest for home.',1727),
  mk('The Iliad','Homer','History','Heroic rage and fate blaze on the fields of Troy.',6130)
];

async function run() {
  console.log(`Starting books generator for ${REALS.length} books...`);
  const results = [];
  
  for (let i = 0; i < REALS.length; i++) {
    const book = REALS[i];
    console.log(`[${i + 1}/${REALS.length}] Processing "${book.title}"...`);
    
    // 1. Resolve text preview (Gutenberg cache first, fallback to Gemini API generation)
    let content = '';
    if (book.purchaseId) {
      content = await fetchGutenbergText(book.purchaseId);
    }
    
    if (content) {
      console.log(`  ✔ Successfully resolved real text excerpt from Project Gutenberg (${content.length} chars).`);
    } else {
      console.log(`  ✕ Gutenberg text resolved empty or failed. Generating using Gemini AI...`);
      content = await generateGeminiSummary(book.title, book.author);
      if (!content) {
        // Hard fallback to static formatted paragraphs if Gemini fails too
        content = `${book.summary}\n\nThis classic work by ${book.author} has captivated readers for generations. Explore the depth of its storytelling and the richness of its characters in this definitive edition.\n\nNow available for online viewing and PDF download.`;
        console.log(`  ✕ Gemini AI failed. Using static fallback content.`);
      } else {
        console.log(`  ✔ Gemini successfully generated detailed summary (${content.length} chars).`);
      }
    }
    book.content = content;

    // 2. Resolve cover image from Open Library Search API
    let coverUrl = '';
    
    // Search with Title and Author
    try {
      const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}&fields=cover_i&limit=1`;
      const data = await httpsGetJson(searchUrl, 15000);
      if (data && data.docs && data.docs.length > 0 && data.docs[0].cover_i) {
        coverUrl = `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-L.jpg`;
      }
    } catch (e) {}

    // Fallback: Search with Title only
    if (!coverUrl) {
      try {
        const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(book.title)}&fields=cover_i&limit=1`;
        const data = await httpsGetJson(searchUrl, 15000);
        if (data && data.docs && data.docs.length > 0 && data.docs[0].cover_i) {
          coverUrl = `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-L.jpg`;
        }
      } catch (e) {}
    }

    // Fallback: Gemini AI cover resolution
    if (!coverUrl) {
      console.log(`  ✕ Open Library cover search failed. Resolving using Gemini AI...`);
      coverUrl = await generateGeminiCover(book.title, book.author);
    }

    // Hard fallback: Picsum images but structured with seed, or static placeholder if Gemini fails
    if (!coverUrl) {
      coverUrl = `https://picsum.photos/seed/${encodeURIComponent(book.title)}/600/800.jpg`;
      console.log(`  ✕ All cover lookups failed. Using seed-locked placeholder image.`);
    } else {
      console.log(`  ✔ Resolved cover image URL: ${coverUrl}`);
    }
    
    book.imageUrl = coverUrl;
    results.push(book);
    
    // Polite throttle delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Create data directory if not exists
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(dataDir, 'books_data.json'),
    JSON.stringify(results, null, 2),
    'utf-8'
  );
  console.log(`\n🎉 Generated books data for all ${results.length} books successfully saved to backend/data/books_data.json`);
}

run().catch(e => { console.error('Fatal generator error:', e); });
