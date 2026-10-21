import mongoose from 'mongoose';
export async function connectDB(){
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/imovies');
  console.log('MongoDB connected');
}
