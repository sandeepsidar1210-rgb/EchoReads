const mongoose = require('mongoose');
const configs = require('./config.json');

const env = process.env.NODE_ENV || 'development';
const config = configs[env] || configs.development;

let isConnected = false;

async function connectDB() {
  if (isConnected) return mongoose.connection;
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.database.url, {
      serverSelectionTimeoutMS: 5000
    });
    isConnected = true;
    console.log('Connected to MongoDB');
    return mongoose.connection;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
}

module.exports = { connectDB, config };