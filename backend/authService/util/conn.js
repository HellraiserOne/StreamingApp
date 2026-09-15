const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const URL = process.env.MONGO_URI || 'mongodb://localhost:27017/streamingapp';
    console.log('Connecting to MongoDB at:', URL);
    
    await mongoose.connect(URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};

connectDB();

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'DB ERROR: '));
db.once('open', () => console.log('DB connection established'));

module.exports = { db, mongoose };