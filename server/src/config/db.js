const mongoose = require('mongoose');

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async (uri) => {
  const mongoURI = uri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/online_exam_portal';

  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000
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
    console.error('[Database Advice] Please verify MongoDB is running locally or supply a valid MONGODB_URI in server/.env');
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
