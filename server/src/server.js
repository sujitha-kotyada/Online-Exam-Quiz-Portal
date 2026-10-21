const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`  Online Exam & Quiz Portal API Server`);
      console.log(`  Running on port: http://localhost:${PORT}`);
      console.log(`  Environment:     ${process.env.NODE_ENV || 'development'}`);
      console.log(`===============================================`);
    });

    // Graceful shutdown
    const handleShutdown = () => {
      console.log('\nReceived shutdown signal. Closing HTTP server...');
      server.close(() => {
        console.log('HTTP server closed. Exiting process.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', handleShutdown);
    process.on('SIGINT', handleShutdown);
  } catch (err) {
    console.error('Failed to initialize server:', err.message);
    // Still start listening so health check and descriptive messages can be returned
    app.listen(PORT, () => {
      console.log(`Server started in offline/database-pending mode on port ${PORT}`);
    });
  }
};

startServer();

module.exports = app;
