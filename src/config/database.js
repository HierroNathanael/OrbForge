import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export async function connectDatabase(customUri = null) {
  const uri = customUri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/orbforge';
  try {
    await mongoose.connect(uri);
    console.log(`[Database] Successfully connected to MongoDB at ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  } catch (error) {
    console.error('[Database] MongoDB connection error:', error);
    throw error;
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
