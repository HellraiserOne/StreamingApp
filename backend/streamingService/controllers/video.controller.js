const { Video } = require('../models/video.model');
const fs = require('fs');
const path = require('path');

// Get all videos (with optional filters)
const getAllVideos = async (req, res) => {
  try {
    const { genre, search } = req.query;
    let query = {};

    if (genre) {
      query.genre = genre;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const videos = await Video.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      videos
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching videos'
    });
  }
};

// Get featured videos
const getFeaturedVideos = async (req, res) => {
  try {
    const videos = await Video.find({ isFeatured: true }).sort({ createdAt: -1 });
    res.json({
      success: true,
      videos
    });
  } catch (error) {
    console.error('Error fetching featured videos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured videos'
    });
  }
};

// Get video by genre
const getVideosByGenre = async (req, res) => {
  try {
    const genres = await Video.distinct('genre');
    const videosByGenre = {};

    for (const genre of genres) {
      const videos = await Video.find({ genre }).limit(10);
      if (videos.length > 0) {
        videosByGenre[genre] = videos;
      }
    }

    res.json({
      success: true,
      videosByGenre
    });
  } catch (error) {
    console.error('Error fetching videos by genre:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching videos by genre'
    });
  }
};

// Stream video
const streamVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    const videoPath = path.join(__dirname, '..', 'videos', video.videoUrl);
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming video:', error);
    res.status(500).json({
      success: false,
      message: 'Error streaming video'
    });
  }
};

// Get video details
const getVideoDetails = async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    res.json({
      success: true,
      video
    });
  } catch (error) {
    console.error('Error fetching video details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching video details'
    });
  }
};

module.exports = {
  getAllVideos,
  getFeaturedVideos,
  getVideosByGenre,
  streamVideo,
  getVideoDetails
};






