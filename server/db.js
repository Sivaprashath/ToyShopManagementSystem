import mongoose from 'mongoose';
import { config } from './config.js';

export async function connectDatabase() {
  if (mongoose.connection.readyState !== 0) return;

  if (!config.mongoUri || (config.mongoUri.includes('127.0.0.1') && process.env.NODE_ENV === 'production' && !process.env.MONGO_URI)) {
    console.warn('⚠️ No cloud MONGO_URI provided in production. Server will run with resilient fallback.');
    return;
  }

  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('MongoDB connection warning:', error.message);
    console.warn('⚠️ Server continuing execution with in-memory resilient fallback.');
  }
}
