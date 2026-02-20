import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Support both MONGO_URI and MONGODB_URI for compatibility
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    
    const conn = await mongoose.connect(mongoUri);
    
    console.log(`[SUCCESS] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[ERROR] MongoDB Connection Error: ${error.message}`);
    console.error('[INFO] Make sure to set MONGO_URI or MONGODB_URI in environment variables');
    process.exit(1);
  }
};

export default connectDB;
