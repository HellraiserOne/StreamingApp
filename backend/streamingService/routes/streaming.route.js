const express = require('express');
const router = express.Router();
const {
  streamVideo,
  getVideosByGenre,
  getFeaturedVideos,
  getVideoDetails,
  getThumbnail,
} = require('../controllers/streaming.controller');

// Stream video by ID
router.get('/stream/:videoId', streamVideo);
router.get('/videos/:videoId/stream', streamVideo);

// Get videos by genre
router.get('/videos', getVideosByGenre);

// Get featured videos
router.get('/videos/featured', getFeaturedVideos);

// Get video details
router.get('/videos/:videoId', getVideoDetails);
router.get('/thumbnails/*', getThumbnail);

module.exports = router;
