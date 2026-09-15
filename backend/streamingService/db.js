const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/streamingapp';
    if (!mongoose.connection.readyState) {
      console.log('[streaming/db] Connecting to MongoDB at:', uri);
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('[streaming/db] MongoDB connection established');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
  mongoose,
};
