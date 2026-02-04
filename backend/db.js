const mongoose = require('mongoose');
require('dotenv').config();

let isConnected = false;

async function connectDB() {
  if (isConnected) return mongoose.connection;

  try {
    mongoose.set('strictQuery', true);

  await mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  family: 4, // 👈 ADD THIS
});

    isConnected = true;
    console.log('Connected to MongoDB');

    return mongoose.connection;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
}

module.exports = { connectDB };
