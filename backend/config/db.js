const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log("MONGO_URI:", process.env.MONGO_URI);

    await mongoose.connect(process.env.MONGO_URI);

    console.log('✅ MongoDB connected successfully');
    console.log('📦 Database:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;