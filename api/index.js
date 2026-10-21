const app = require('../server/src/app');
const { connectDB } = require('../server/src/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection error in Vercel function:', err.message);
  }
  return app(req, res);
};
