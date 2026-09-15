const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Video } = require('../models/video.model');
const { s3Client, buildPublicUrl } = require('../util/s3');

const bucket = process.env.AWS_S3_BUCKET;

const ensureBucket = () => {
  if (!bucket) {
    throw new Error('AWS_S3_BUCKET is not configured');
  }
};

const formatVideo = (doc) => {
  if (!doc) {
    return null;
  }

  const video = typeof doc.toObject === 'function'
    ? doc.toObject({ versionKey: false })
    : { ...doc };

  if (video.thumbnailKey) {
    video.thumbnailUrl = buildPublicUrl(video.thumbnailKey);
  }

  return video;
};

const resolveThumbnailData = ({ thumbnailKey, thumbnailUrl }) => {
  if (thumbnailKey) {
    return {
      thumbnailKey,
      thumbnailUrl: buildPublicUrl(thumbnailKey),
    };
  }

  if (thumbnailUrl) {
    return { thumbnailUrl };
  }

  return {};
};

const listVideos = async (req, res, next) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      videos: videos.map(formatVideo),
    });
  } catch (error) {
    next(error);
  }
};

const getUploadUrls = async (req, res, next) => {
  try {
    ensureBucket();
    const { videoFileName, thumbnailFileName } = req.body;

    if (!videoFileName || !thumbnailFileName) {
      return res.status(400).json({
        success: false,
        message: 'Both video and thumbnail file names are required',
      });
    }

    const now = Date.now();
    const videoKey = `videos/${now}-${videoFileName}`;
    const thumbnailKey = `thumbnails/${now}-${thumbnailFileName}`;

    const [videoUploadUrl, thumbnailUploadUrl] = await Promise.all([
      getSignedUrl(
        s3Client,
        new PutObjectCommand({ Bucket: bucket, Key: videoKey }),
        { expiresIn: 3600 },
      ),
      getSignedUrl(
        s3Client,
        new PutObjectCommand({ Bucket: bucket, Key: thumbnailKey }),
        { expiresIn: 3600 },
      ),
    ]);

    res.json({
      success: true,
      videoUploadUrl,
      thumbnailUploadUrl,
      videoKey,
      thumbnailKey,
    });
  } catch (error) {
    next(error);
  }
};

const getVideoUploadUrl = async (req, res, next) => {
  try {
    ensureBucket();
    const { videoFileName } = req.body;

    if (!videoFileName) {
      return res.status(400).json({
        success: false,
        message: 'Video file name is required',
      });
    }

    const now = Date.now();
    const videoKey = `videos/${now}-${videoFileName}`;

    const videoUploadUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({ Bucket: bucket, Key: videoKey }),
      { expiresIn: 3600 },
    );

    res.json({
      success: true,
      videoUploadUrl,
      videoKey,
    });
  } catch (error) {
    next(error);
  }
};

const getThumbnailUploadUrl = async (req, res, next) => {
  try {
    ensureBucket();
    const { thumbnailFileName } = req.body;

    if (!thumbnailFileName) {
      return res.status(400).json({
        success: false,
        message: 'Thumbnail file name is required',
      });
    }

    const now = Date.now();
    const thumbnailKey = `thumbnails/${now}-${thumbnailFileName}`;

    const thumbnailUploadUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({ Bucket: bucket, Key: thumbnailKey }),
      { expiresIn: 3600 },
    );

    res.json({
      success: true,
      thumbnailUploadUrl,
      thumbnailKey,
    });
  } catch (error) {
    next(error);
  }
};

const uploadVideoFile = async (req, res, next) => {
  try {
    ensureBucket();
    const { file } = req;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Video file is required',
      });
    }

    const now = Date.now();
    const videoKey = `videos/${now}-${file.originalname}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: videoKey,
        Body: fs.createReadStream(file.path),
        ContentType: file.mimetype,
      }),
    );

    await fs.promises.unlink(file.path);

    res.json({
      success: true,
      videoKey,
    });
  } catch (error) {
    if (req.file?.path) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to cleanup video upload file:', cleanupError);
      }
    }
    next(error);
  }
};

const uploadThumbnailFile = async (req, res, next) => {
  try {
    ensureBucket();
    const { file } = req;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Thumbnail file is required',
      });
    }

    const now = Date.now();
    const thumbnailKey = `thumbnails/${now}-${file.originalname}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: thumbnailKey,
        Body: fs.createReadStream(file.path),
        ContentType: file.mimetype,
      }),
    );

    await fs.promises.unlink(file.path);

    res.json({
      success: true,
      thumbnailKey,
    });
  } catch (error) {
    if (req.file?.path) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to cleanup thumbnail upload file:', cleanupError);
      }
    }
    next(error);
  }
};

const createVideo = async (req, res, next) => {
  try {
    ensureBucket();
    const {
      s3Key,
      duration,
      thumbnailKey,
      thumbnailUrl,
      status,
      ...rest
    } = req.body;

    if (!s3Key) {
      return res.status(400).json({
        success: false,
        message: 's3Key is required',
      });
    }

    if (!duration) {
      return res.status(400).json({
        success: false,
        message: 'Video duration is required',
      });
    }

    if (!thumbnailKey && !thumbnailUrl) {
      return res.status(400).json({
        success: false,
        message: 'A thumbnail must be provided',
      });
    }

    const durationSeconds = Number(duration);
    if (Number.isNaN(durationSeconds) || durationSeconds <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be a positive number',
      });
    }

    const thumbnailData = resolveThumbnailData({ thumbnailKey, thumbnailUrl });

    const video = await Video.create({
      ...rest,
      ...thumbnailData,
      s3Key,
      duration: durationSeconds,
      uploadedBy: req.user._id,
      status: status || 'ready',
    });

    res.status(201).json({
      success: true,
      video: formatVideo(video),
    });
  } catch (error) {
    next(error);
  }
};

const updateVideo = async (req, res, next) => {
  try {
    const {
      thumbnailKey,
      thumbnailUrl,
      ...rest
    } = req.body;

    const thumbnailData = resolveThumbnailData({ thumbnailKey, thumbnailUrl });

    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { ...rest, ...thumbnailData, updatedAt: Date.now() },
      { new: true },
    );

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    res.json({
      success: true,
      video: formatVideo(video),
    });
  } catch (error) {
    next(error);
  }
};

const deleteVideo = async (req, res, next) => {
  try {
    ensureBucket();
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    const operations = [
      s3Client.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: video.s3Key,
      })),
      video.deleteOne(),
    ];

    if (video.thumbnailKey) {
      operations.push(
        s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: video.thumbnailKey,
          }),
        ),
      );
    }

    await Promise.all(operations);

    res.json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const toggleFeatured = async (req, res, next) => {
  try {
    const { isFeatured } = req.body;
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { isFeatured, updatedAt: Date.now() },
      { new: true },
    );

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    res.json({
      success: true,
      video: formatVideo(video),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listVideos,
  getUploadUrls,
  getVideoUploadUrl,
  getThumbnailUploadUrl,
  uploadVideoFile,
  uploadThumbnailFile,
  createVideo,
  updateVideo,
  deleteVideo,
  toggleFeatured,
};
