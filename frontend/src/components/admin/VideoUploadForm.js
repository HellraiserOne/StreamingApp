import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Typography,
  Paper,
  Grid,
  Alert,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { adminService } from '../../services/admin.service';

const Input = styled('input')({
  display: 'none',
});

const UploadBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  border: `2px dashed ${theme.palette.divider}`,
  '&:hover': {
    borderColor: theme.palette.primary.main,
  },
}));

const genres = [
  'Action',
  'Comedy',
  'Drama',
  'Horror',
  'Documentary',
  'Thriller',
  'Romance',
  'Sci-Fi',
];

export const VideoUploadForm = ({ onUploadComplete }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    releaseYear: new Date().getFullYear(),
    isFeatured: false,
  });

  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getVideoDuration = (file) =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.src = url;
      tempVideo.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(tempVideo.duration || 0);
      };
      tempVideo.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Unable to read video metadata'));
      };
    });

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleVideoSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setError('');
    } else {
      setError('Please select a valid video file');
    }
  };

  const handleThumbnailSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setThumbnailFile(file);
      setError('');
    } else {
      setError('Please select a valid image file');
    }
  };

  const validateForm = () => {
    if (!formData.title || !formData.description || !formData.genre || !formData.releaseYear) {
      setError('Please fill in all required fields');
      return false;
    }
    if (!videoFile) {
      setError('Please select a video file');
      return false;
    }
    if (!thumbnailFile) {
      setError('Please select a thumbnail image');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    try {
      const durationSeconds = Math.round(await getVideoDuration(videoFile));
      if (!durationSeconds) {
        throw new Error('Unable to determine video duration');
      }

      const { thumbnailKey } = await adminService.uploadThumbnailFile(thumbnailFile);

      const { videoKey } = await adminService.uploadVideoFile(videoFile, {
        onUploadProgress: (event) => {
          if (event.total) {
            const progress = (event.loaded / event.total) * 100;
            setUploadProgress(Math.round(progress));
          }
        },
      });

      await adminService.createVideo({
        title: formData.title,
        description: formData.description,
        genre: formData.genre,
        releaseYear: Number(formData.releaseYear),
        duration: durationSeconds,
        isFeatured: formData.isFeatured,
        s3Key: videoKey,
        thumbnailKey,
        status: 'ready',
      });

      setSuccess('Video uploaded successfully!');
      setFormData({
        title: '',
        description: '',
        genre: '',
        releaseYear: new Date().getFullYear(),
        isFeatured: false,
      });
      setVideoFile(null);
      setThumbnailFile(null);

      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (uploadError) {
      console.error('Error uploading video:', uploadError);
      setError(uploadError.response?.data?.message || 'Error uploading video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Upload New Video
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            label="Genre"
            name="genre"
            value={formData.genre}
            onChange={handleInputChange}
            required
          >
            {genres.map((genre) => (
              <MenuItem key={genre} value={genre}>
                {genre}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Release Year"
            name="releaseYear"
            value={formData.releaseYear}
            onChange={handleInputChange}
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleInputChange}
              />
            }
            label="Feature this video"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Input
            accept="video/*"
            id="video-upload"
            type="file"
            onChange={handleVideoSelect}
          />
          <label htmlFor="video-upload">
            <UploadBox>
              <CloudUpload sx={{ fontSize: 40, mb: 1 }} />
              <Typography>
                {videoFile ? videoFile.name : 'Select Video File'}
              </Typography>
            </UploadBox>
          </label>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Input
            accept="image/*"
            id="thumbnail-upload"
            type="file"
            onChange={handleThumbnailSelect}
          />
          <label htmlFor="thumbnail-upload">
            <UploadBox>
              <CloudUpload sx={{ fontSize: 40, mb: 1 }} />
              <Typography>
                {thumbnailFile ? thumbnailFile.name : 'Select Thumbnail'}
              </Typography>
            </UploadBox>
          </label>
        </Grid>

        {uploading && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress variant="determinate" value={uploadProgress} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Uploading... {uploadProgress}%
              </Typography>
            </Box>
          </Grid>
        )}

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};






