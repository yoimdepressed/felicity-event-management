import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`[SUCCESS] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[ERROR] MongoDB Connection Error: ${error.message}`);
    console.error('[INFO] Make sure to update MONGODB_URI in .env file with your MongoDB Atlas connection string');
    process.exit(1);
  }
};

export default connectDB;
