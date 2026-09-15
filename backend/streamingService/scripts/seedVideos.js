require('dotenv').config();
const mongoose = require('mongoose');
const { Video } = require('../models/video.model');

// Create a dummy admin user ID
const adminId = new mongoose.Types.ObjectId();

const sampleVideos = [
  {
    title: 'The Last Action Hero',
    description: 'An epic action movie with stunning visual effects and non-stop thrills',
    thumbnailUrl: 'https://picsum.photos/seed/action1/800/450',
    s3Key: 'action-movie-1.mp4',
    duration: 7200,
    genre: 'Action',
    releaseYear: 2024,
    rating: 4.8,
    isFeatured: true,
    status: 'ready',
    uploadedBy: adminId,
  },
  {
    title: 'Urban Warriors',
    description: 'Elite forces face their toughest mission yet',
    thumbnailUrl: 'https://picsum.photos/seed/action2/800/450',
    s3Key: 'action-movie-2.mp4',
    duration: 6900,
    genre: 'Action',
    releaseYear: 2024,
    rating: 4.5,
    isFeatured: false,
    status: 'ready',
    uploadedBy: adminId,
  },
  {
    title: 'Life\'s Moments',
    description: 'A touching drama about family and redemption',
    thumbnailUrl: 'https://picsum.photos/seed/drama1/800/450',
    s3Key: 'drama-movie-1.mp4',
    duration: 6300,
    genre: 'Drama',
    releaseYear: 2024,
    rating: 4.9,
    isFeatured: false,
    status: 'ready',
    uploadedBy: adminId,
  },
  {
    title: 'The Last Letter',
    description: 'A powerful drama that explores human connections',
    thumbnailUrl: 'https://picsum.photos/seed/drama2/800/450',
    s3Key: 'drama-movie-2.mp4',
    duration: 7500,
    genre: 'Drama',
    releaseYear: 2023,
    rating: 4.7,
    isFeatured: false,
    status: 'ready',
    uploadedBy: adminId,
  },
  {
    title: 'Laugh Out Loud',
    description: 'A hilarious comedy that will brighten your day',
    thumbnailUrl: 'https://picsum.photos/seed/comedy1/800/450',
    s3Key: 'comedy-movie-1.mp4',
    duration: 5400,
    genre: 'Comedy',
    releaseYear: 2024,
    rating: 4.3,
    isFeatured: false,
    status: 'ready',
    uploadedBy: adminId,
  },
  {
    title: 'Office Party',
    description: 'When the boss is away, the office will play',
    thumbnailUrl: 'https://picsum.photos/seed/comedy2/800/450',
    s3Key: 'comedy-movie-2.mp4',
    duration: 5700,
    genre: 'Comedy',
    releaseYear: 2024,
    rating: 4.1,
    isFeatured: false,
    status: 'ready',
    uploadedBy: adminId,
  },
  {
    title: 'Space Frontier',
    description: 'Explore the final frontier in this sci-fi epic',
    thumbnailUrl: 'https://picsum.photos/seed/scifi1/800/450',
    s3Key: 'scifi-movie-1.mp4',
    duration: 8100,
    genre: 'Sci-Fi',
    releaseYear: 2024,
    rating: 4.6,
    isFeatured: false,
    status: 'ready',
    uploadedBy: adminId,
  },
  {
    title: 'Time Paradox',
    description: 'When time itself becomes the enemy',
    thumbnailUrl: 'https://picsum.photos/seed/scifi2/800/450',
    s3Key: 'scifi-movie-2.mp4',
    duration: 7800,
    genre: 'Sci-Fi',
    releaseYear: 2024,
    rating: 4.4,
    isFeatured: false,
    status: 'ready',
    uploadedBy: adminId,
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing videos
    await Video.deleteMany({});
    console.log('Cleared existing videos');

    // Insert sample videos
    await Video.insertMany(sampleVideos);
    console.log('Sample videos inserted successfully');

    console.log('Database seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
