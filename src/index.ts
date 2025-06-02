import mongoose from 'mongoose';
import app from './server';

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://aqqutelabs:ZECDRlbG5y25uJp7@cluster0.9ck3gvl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// MongoDB connection options
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s
  socketTimeoutMS: 45000, // Close sockets after 45s
  family: 4 // Use IPv4, skip trying IPv6
};

// Connect to MongoDB
console.log('📡 Connecting to MongoDB...');
mongoose.connect(mongoUri, mongooseOptions)
  .then(() => {
    console.log('📦 Connected to MongoDB successfully');
    startServer();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// MongoDB connection error handling
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('❌ MongoDB disconnected');
});

process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('📦 MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error closing MongoDB connection:', err);
    process.exit(1);
  }
});

// Start server only after MongoDB connects
function startServer() {
  const server = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port} in ${process.env.NODE_ENV} mode`);
    console.log(`👉 Health check: http://localhost:${port}/health`);
    console.log(`👉 API base URL: http://localhost:${port}/api/v1`);
  });

  // Handle server errors
  server.on('error', (error: NodeJS.ErrnoException) => {
    console.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use`);
    }
    process.exit(1);
  });

  // Graceful shutdown
  // process.on('SIGTERM', () => {
  //   console.log('🔄 SIGTERM received. Starting graceful shutdown...');
  //   server.close(() => {
  //     console.log('💤 HTTP server closed');
  //     mongoose.connection.close(false)
  //       .then(() => {
  //         console.log('📦 MongoDB connection closed');
  //         process.exit(0);
  //       })
  //       .catch((err) => {
  //         console.error('❌ Error closing MongoDB connection:', err);
  //         process.exit(1);
  //       });
  //   });
  // });
}
