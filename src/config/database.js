import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export async function connectDatabase(customUri = null) {
  const uri = customUri || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to your .env file before starting the bot.');
  }

  mongoose.connection.on('error', (error) => {
    console.error('[Database] Connection error:', error.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] ⚠️ Disconnected from MongoDB.');
  });
  mongoose.connection.on('reconnected', () => {
    console.log('[Database] ✅ Reconnected to MongoDB.');
  });

  try {
    console.log('[Database] Connecting to MongoDB...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000
    });
    console.log(`[Database] ✅ Successfully connected to MongoDB at ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  } catch (error) {
    console.error('\n[Database Error] ❌ Could not connect to MongoDB Atlas!');
    console.error('Reason:', error.message);
    console.error('\n👉 How to fix:');
    console.error('1. Go to MongoDB Atlas (cloud.mongodb.com)');
    console.error('2. Navigate to "Security" -> "Network Access"');
    console.error('3. Click "Add IP Address" and select "Allow Access From Anywhere" (0.0.0.0/0)');
    console.error('4. Wait 1 minute and restart the bot.\n');
    throw error;
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
