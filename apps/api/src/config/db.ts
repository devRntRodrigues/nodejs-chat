import mongoose from 'mongoose';

export async function connectDB(uri: string): Promise<void> {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }

  mongoose.connection.on('error', (error) => {
    console.error('❌ MongoDB error:', error);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });
}

export async function disconnectDB(): Promise<void> {
  await mongoose.connection.close();
}
