const { connectDB } = require('../db');
const Book = require('../models/Book');

function mk(title, author, genre, summary, purchaseId=null){
  const seed = encodeURIComponent(title);
  return {
    title, author, genre,
    description: summary.slice(0, 160),
    summary,
    content: summary + "\n\n" + summary + "\n\n" + summary,
    // Use a JPEG placeholder so Flutter/web never has to decode SVG
    imageUrl: `https://picsum.photos/seed/${seed}/600/800.jpg`,
    price: Math.round((4.99 + Math.random()*10) * 100)/100,
    rating: Math.round((3.8 + Math.random()*1.2) * 10)/10,
    totalRatings: Math.floor(100 + Math.random()*1000),
    purchaseUrl: purchaseId ? `https://www.gutenberg.org/ebooks/${purchaseId}` : '',
    pdfUrl: ''
  };
}

const REALS = [
  mk('Pride and Prejudice','Jane Austen','Romance','A witty and incisive tale of manners, love, and societal expectations in Regency England.',1342),
  mk('Sense and Sensibility','Jane Austen','Romance','Two sisters navigate love and heartbreak, balancing reason with emotion.'),
  mk('Emma','Jane Austen','Romance','A charming matchmaker learns the limits of her schemes and the truths of her own heart.'),
  mk('Persuasion','Jane Austen','Romance','Years after a broken engagement, second chances blossom amid regret and maturity.'),
  mk('Mansfield Park','Jane Austen','Romance','Fanny Price, quiet and steadfast, confronts vanity and virtue in an English estate.'),
  mk('Wuthering Heights','Emily Brontë','Romance','A fierce, storm-tossed love that haunts the moors and the souls bound to them.'),
  mk('Jane Eyre','Charlotte Brontë','Romance','An orphan’s resilience leads her to independence, moral conviction, and true love.'),
  mk('Agnes Grey','Anne Brontë','Fiction','A governess faces hardship and dignity in a candid portrait of Victorian life.'),
  mk('Great Expectations','Charles Dickens','Fiction','An orphan’s rise and reckoning with ambition, affection, and self-deception.',1400),
  mk('Oliver Twist','Charles Dickens','Fiction','A boy endures the underbelly of London, seeking kindness and a place to belong.',730),
  mk('A Tale of Two Cities','Charles Dickens','History','Love and sacrifice unfold against the turmoil of the French Revolution.',98),
  mk('David Copperfield','Charles Dickens','Fiction','A richly-drawn journey from troubled boyhood to authorship and self-knowledge.'),
  mk('Bleak House','Charles Dickens','Fiction','A labyrinthine legal case entangles lives in fog, mystery, and biting satire.'),
  mk('Moby-Dick','Herman Melville','Adventure','A whaling voyage becomes an obsessive pursuit of a white whale and destiny.',2701),
  mk('The Scarlet Letter','Nathaniel Hawthorne','Fiction','Sin, stigma, and strength under a harsh theocracy in colonial New England.'),
  mk('The Last of the Mohicans','James Fenimore Cooper','Adventure','Frontier conflict and cross-cultural bonds amid the French and Indian War.'),
  mk('The Picture of Dorian Gray','Oscar Wilde','Fiction','A beautiful man’s portrait bears the scars of his corrupt pleasures.',174),
  mk('Dracula','Bram Stoker','Horror','A cunning vampire haunts modernity; a band of friends fights the encroaching dark.',345),
  mk('Frankenstein','Mary Shelley','Horror','An ambitious experiment unleashes a creature seeking understanding and justice.',84),
  mk('The Strange Case of Dr Jekyll and Mr Hyde','Robert Louis Stevenson','Horror','Respectable façades and monstrous urges split a soul in two.',43),
  mk('Treasure Island','Robert Louis Stevenson','Adventure','Pirates, peril, and the lure of buried gold ignite a boy’s coming-of-age.'),
  mk('Kidnapped','Robert Louis Stevenson','Adventure','Flight, friendship, and honor across the rugged Scottish Highlands.'),
  mk('The Time Machine','H. G. Wells','Science Fiction','A traveler ventures into distant futures to witness evolution and decay.',35),
  mk('The War of the Worlds','H. G. Wells','Science Fiction','Martian invaders shatter complacency with terrifying, relentless force.',36),
  mk('The Invisible Man','H. G. Wells','Science Fiction','A genius turns invisible—and discovers isolation, power, and ruin.'),
  mk('Twenty Thousand Leagues Under the Seas','Jules Verne','Science Fiction','Aboard the Nautilus, wonders and mysteries of the deep unfold.'),
  mk('Around the World in 80 Days','Jules Verne','Adventure','A wager sends a precise gentleman on a whirlwind global voyage.'),
  mk('Journey to the Center of the Earth','Jules Verne','Science Fiction','A daring descent reveals a hidden world beneath our feet.'),
  mk('The Count of Monte Cristo','Alexandre Dumas','Adventure','Betrayal gives rise to reinvention, justice, and a masterful revenge.',1184),
  mk('The Three Musketeers','Alexandre Dumas','Adventure','Swashbuckling camaraderie proclaims “All for one, and one for all!”',1257),
  mk('Crime and Punishment','Fyodor Dostoevsky','Fiction','A tormented mind confronts guilt, morality, and the possibility of redemption.',2554),
  mk('The Brothers Karamazov','Fyodor Dostoevsky','Fiction','Faith, doubt, and patricide entangle a family in philosophical drama.'),
  mk('Anna Karenina','Leo Tolstoy','Romance','Passion and society collide in a sweeping Russian masterpiece.',1399),
  mk('War and Peace','Leo Tolstoy','History','Napoleonic wars reshape destinies in an intimate epic of life and love.'),
  mk('The Adventures of Tom Sawyer','Mark Twain','Children','Mischief and adventure on the Mississippi in sunlit Americana.'),
  mk('Adventures of Huckleberry Finn','Mark Twain','Fiction','A boy and a runaway man seek freedom on a winding river.'),
  mk('The Call of the Wild','Jack London','Adventure','A sled dog answers ancient instincts in the brutal North.'),
  mk('White Fang','Jack London','Adventure','A wild-born creature meets cruelty and compassion on the path to trust.'),
  mk('The Adventures of Sherlock Holmes','Arthur Conan Doyle','Mystery','A brilliant detective unravels puzzles with logic and panache.',1661),
  mk('The Hound of the Baskervilles','Arthur Conan Doyle','Mystery','A spectral hound stalks a cursed family on the moor.',2852),
  mk('The Sign of the Four','Arthur Conan Doyle','Mystery','A mysterious pact and a stolen treasure test Holmes and Watson.'),
  mk('The Metamorphosis','Franz Kafka','Fiction','A man wakes as an insect; alienation and duty gnaw at the human heart.',5200),
  mk('Heart of Darkness','Joseph Conrad','Fiction','A river journey peers into colonial horror and the abyss within.'),
  mk('The Turn of the Screw','Henry James','Horror','Ambiguous apparitions unsettle a governess and her charges.'),
  mk('Middlemarch','George Eliot','Fiction','Personal hopes and social webs entwine in a profound provincial study.'),
  mk('Far from the Madding Crowd','Thomas Hardy','Romance','Love and independence collide across Wessex’s fields and storms.'),
  mk('Tess of the d’Urbervilles','Thomas Hardy','Romance','Fate and injustice shadow a young woman’s tragic course.'),
  mk('The Secret Garden','Frances Hodgson Burnett','Children','A hidden garden heals grief, opening hearts to wonder.'),
  mk('Little Women','Louisa May Alcott','Fiction','Four sisters grow through trials, art, and affection in New England.',514),
  mk('Peter Pan','J. M. Barrie','Children','Neverland invites fearless flights and bittersweet dreams.',16),
  mk('The Wonderful Wizard of Oz','L. Frank Baum','Children','A cyclone carries a girl to a land of courage, heart, and home.',55),
  mk('The Wind in the Willows','Kenneth Grahame','Children','Friendship, folly, and riverbank rambles with Mole, Rat, and Toad.'),
  mk('A Princess of Mars','Edgar Rice Burroughs','Science Fiction','A Civil War veteran awakens on Mars to battles and romance.'),
  mk('Tarzan of the Apes','Edgar Rice Burroughs','Adventure','An orphaned lord, raised by apes, discovers his identity.'),
  mk('The Jungle Book','Rudyard Kipling','Children','Tales of beasts and belonging in the Indian jungle.'),
  mk('Don Quixote','Miguel de Cervantes','Fiction','A knight-errant’s delusions mirror the power—and peril—of stories.'),
  mk('Gulliver’s Travels','Jonathan Swift','Fantasy','Voyages to strange lands reveal sharp satire of human follies.'),
  mk('Robinson Crusoe','Daniel Defoe','Adventure','Shipwrecked survival breeds ingenuity, solitude, and moral reckoning.'),
  mk('The Odyssey','Homer','Fantasy','Odysseus endures gods, monsters, and temptation in a quest for home.'),
  mk('The Iliad','Homer','History','Heroic rage and fate blaze on the fields of Troy.')
];

async function run(){
  await connectDB();
  // Replace existing with real classics only
  await Book.deleteMany({});
  const created = await Book.insertMany(REALS);
  console.log(`Seeded ${created.length} real books.`);
  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(1); });
