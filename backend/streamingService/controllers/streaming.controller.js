const { HeadObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Video } = require('../models/video.model');
const { s3Client, buildPublicUrl, buildStreamUrl } = require('../util/s3');

const CHUNK_SIZE = 10 ** 6; // 1 MB

const formatVideoResponse = (doc) => {
  if (!doc) {
    return null;
  }

  const video = typeof doc.toObject === 'function'
    ? doc.toObject({ versionKey: false })
    : { ...doc };

  video.thumbnailUrl = buildPublicUrl(video.thumbnailKey || video.thumbnailUrl);
  video.streamPath = `/api/streaming/stream/${video._id}`;
  video.streamUrl = buildStreamUrl(video._id);
  delete video.thumbnailKey;
  delete video.s3Key;

  return video;
};

const streamVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const range = req.headers.range;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'Video ID is required',
      });
    }

    if (!range) {
      return res.status(400).send('Requires Range header');
    }

    const video = await Video.findById(videoId).select('s3Key status');
    if (!video || video.status !== 'ready') {
      return res.status(404).json({
        success: false,
        message: 'Video not found or not ready',
      });
    }

    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
      return res.status(500).json({
        success: false,
        message: 'S3 bucket is not configured',
      });
    }

    const headObject = await s3Client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: video.s3Key,
      }),
    );
    const videoSize = headObject.ContentLength;

    const parts = range.replace(/bytes=/, '').split('-');
    const start = Number(parts[0]);
    const requestedEnd = parts[1] ? Number(parts[1]) : null;

    if (Number.isNaN(start) || start >= videoSize) {
      return res.status(416).send('Requested range not satisfiable');
    }

    const end = Math.min(
      requestedEnd ?? start + CHUNK_SIZE - 1,
      videoSize - 1,
    );
    const contentLength = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${videoSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': contentLength,
      'Content-Type': headObject.ContentType || 'video/mp4',
    });

    const { Body } = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: video.s3Key,
        Range: `bytes=${start}-${end}`,
      }),
    );

    if (Body?.pipe) {
      Body.pipe(res);
    } else if (Body?.transformToByteArray) {
      const buffer = await Body.transformToByteArray();
      res.end(Buffer.from(buffer));
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Error streaming video:', error);
    res.status(500).json({
      success: false,
      message: 'Error streaming video',
    });
  }
};

const getVideosByGenre = async (req, res) => {
  try {
    const filters = { status: 'ready' };
    const { genre, search } = req.query;

    if (genre) {
      filters.genre = genre;
    }

    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const videos = await Video.find(filters)
      .select('title description thumbnailUrl thumbnailKey genre releaseYear rating duration isFeatured createdAt')
      .sort('-createdAt');

    res.json({
      success: true,
      videos: videos.map(formatVideoResponse),
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching videos'
    });
  }
};

const getFeaturedVideos = async (req, res) => {
  try {
    const videos = await Video.find({ isFeatured: true, status: 'ready' })
      .select('title description thumbnailUrl thumbnailKey genre releaseYear rating duration createdAt')
      .sort('-createdAt')
      .limit(1);

    res.json({
      success: true,
      videos: videos.map(formatVideoResponse),
    });
  } catch (error) {
    console.error('Error fetching featured videos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured videos'
    });
  }
};

const getVideoDetails = async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findById(videoId)
      .select('-__v');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    res.json({
      success: true,
      video: formatVideoResponse(video),
    });
  } catch (error) {
    console.error('Error fetching video details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching video details'
    });
  }
};

const getThumbnail = async (req, res) => {
  try {
    const rawKey = req.params[0];
    const key = rawKey ? decodeURI(rawKey) : null;

    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Thumbnail key is required',
      });
    }

    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
      return res.status(500).json({
        success: false,
        message: 'S3 bucket is not configured',
      });
    }

    const { Body, ContentType, ContentLength } = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

    res.setHeader('Content-Type', ContentType || 'image/jpeg');
    if (ContentLength) {
      res.setHeader('Content-Length', ContentLength.toString());
    }

    if (Body?.pipe) {
      Body.pipe(res);
    } else if (Body?.transformToByteArray) {
      const buffer = await Body.transformToByteArray();
      res.end(Buffer.from(buffer));
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Error fetching thumbnail:', error);
    res.status(404).json({
      success: false,
      message: 'Thumbnail not found',
    });
  }
};

module.exports = {
  streamVideo,
  getVideosByGenre,
  getFeaturedVideos,
  getVideoDetails,
  getThumbnail,
};
