const mongoose = require('mongoose');

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async (uri) => {
  let mongoURI = uri || process.env.MONGODB_URI;

  if (!mongoURI) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGODB_URI is not set. Please add MONGODB_URI in your Vercel Project Settings > Environment Variables.');
    }
    mongoURI = 'mongodb://127.0.0.1:27017/online_exam_portal';
  }

  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      dbName: process.env.DB_NAME || 'online_exam_portal'
    }).then((m) => {
      console.log(`[Database] MongoDB Connected: ${m.connection.host}`);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error(`[Database Error] Could not connect to MongoDB: ${error.message}`);
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
  } catch (error) {
    console.error(`[Database Error] Error disconnecting: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
