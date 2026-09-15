const express = require('express');
const router = express.Router();
const videoController = require('../controllers/video.controller');

router.get('/videos', videoController.getAllVideos);
router.get('/videos/featured', videoController.getFeaturedVideos);
router.get('/videos/by-genre', videoController.getVideosByGenre);
router.get('/videos/:videoId/stream', videoController.streamVideo);
router.get('/videos/:videoId', videoController.getVideoDetails);

module.exports = router;






