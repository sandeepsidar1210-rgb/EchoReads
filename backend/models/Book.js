const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  genre: { type: String, required: true, trim: true },
  summary: { type: String, required: true },
  content: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0, min: 0 },
  purchaseUrl: { type: String, default: '' },
  pdfUrl: { type: String, default: '' },
  ratings: [
    {
      value: { type: Number, required: true, min: 1, max: 5 },
      date: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

// Get all books with optional genre and sort
bookSchema.statics.getAll = async function (genre = null, sort = 'latest') {
  const query = genre ? { genre } : {};
  let sortObj = { createdAt: -1 };
  switch ((sort || 'latest').toLowerCase()) {
    case 'popular':
      sortObj = { totalRatings: -1, rating: -1, createdAt: -1 };
      break;
    case 'rated':
    case 'highly-rated':
      sortObj = { rating: -1, totalRatings: -1, createdAt: -1 };
      break;
    case 'latest':
    default:
      sortObj = { createdAt: -1 };
  }
  return await this.find(query).sort(sortObj);
};

// Get book by ID (returns Mongoose document)
bookSchema.statics.getById = async function (id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return await this.findById(id);
};

// Add rating
bookSchema.methods.addRating = async function (ratingValue) {
  this.ratings.push({ value: ratingValue });
  const totalValue = this.ratings.reduce((sum, r) => sum + r.value, 0);
  this.rating = Math.round((totalValue / this.ratings.length) * 10) / 10; // one decimal
  this.totalRatings = this.ratings.length;
  return await this.save();
};

const Book = mongoose.model('Book', bookSchema);
module.exports = Book;
