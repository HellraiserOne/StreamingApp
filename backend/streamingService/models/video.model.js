const { mongoose } = require('../db');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
    required: true,
  },
  thumbnailKey: {
    type: String,
    default: null,
  },
  s3Key: {
    type: String,
    required: true,
    unique: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  genre: {
    type: String,
    required: true,
    enum: ['Action', 'Comedy', 'Drama', 'Horror', 'Documentary', 'Thriller', 'Romance', 'Sci-Fi'],
  },
  releaseYear: {
    type: Number,
    required: true,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['processing', 'ready', 'error'],
    default: 'processing',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

videoSchema.pre('save', function handleTimestamps(next) {
  this.updatedAt = Date.now();
  next();
});

const Video = mongoose.models.Video || mongoose.model('Video', videoSchema);

module.exports = { Video, videoSchema };
