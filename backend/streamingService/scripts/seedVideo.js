require('dotenv').config();
const mongoose = require('mongoose');
const { Video } = require('../models/video.model');

const seedVideo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/streamingapp');
    console.log('Connected to MongoDB');

    // Create a dummy admin ID
    const adminId = new mongoose.Types.ObjectId();

    const video = {
      title: 'The Nights',
      description: 'Official music video for "The Nights"',
      thumbnailUrl: 'https://picsum.photos/seed/nights/800/450', // Placeholder thumbnail
      s3Key: 'theNights.mp4',
      duration: 180, // 3 minutes
      genre: 'Music',
      releaseYear: 2024,
      rating: 4.8,
      isFeatured: true,
      status: 'ready',
      uploadedBy: adminId,
    };

    // Clear existing videos and add the new one
    await Video.deleteMany({});
    await Video.create(video);

    console.log('Video seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding video:', error);
    process.exit(1);
  }
};

seedVideo();






