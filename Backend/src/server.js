const dotenv = require('dotenv');
const path = require('path');

// Load environment variables before importing app or db
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Start database and server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(` OPD Mini-Module Backend Server Running `);
      console.log(` Port:    http://localhost:${PORT}      `);
      console.log(` Health:  http://localhost:${PORT}/api/health `);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`========================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
