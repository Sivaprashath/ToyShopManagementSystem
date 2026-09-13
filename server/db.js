import mongoose from 'mongoose';
import { config } from './config.js';

export async function connectDatabase() {
  if (mongoose.connection.readyState !== 0) return;

  try {
    await mongoose.connect(config.mongoUri);
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}
