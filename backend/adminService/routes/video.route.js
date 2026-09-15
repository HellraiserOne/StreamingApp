const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { adminAuth } = require('../middleware/adminAuth');
const controller = require('../controllers/video.controller');

const router = express.Router();

const uploadDir = path.join(process.cwd(), 'tmp-uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

router.get('/videos', adminAuth, controller.listVideos);
router.post('/videos/upload-urls', adminAuth, controller.getUploadUrls);
router.post('/videos/upload-urls/video', adminAuth, controller.getVideoUploadUrl);
router.post('/videos/upload-urls/thumbnail', adminAuth, controller.getThumbnailUploadUrl);
router.post('/videos/upload/video', adminAuth, upload.single('file'), controller.uploadVideoFile);
router.post('/videos/upload/thumbnail', adminAuth, upload.single('file'), controller.uploadThumbnailFile);
router.post('/videos', adminAuth, controller.createVideo);
router.put('/videos/:id', adminAuth, controller.updateVideo);
router.delete('/videos/:id', adminAuth, controller.deleteVideo);
router.patch('/videos/:id/featured', adminAuth, controller.toggleFeatured);

module.exports = router;
