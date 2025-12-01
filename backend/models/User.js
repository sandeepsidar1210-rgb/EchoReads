const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, index: true, unique: true, sparse: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
