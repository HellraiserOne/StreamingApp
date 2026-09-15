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
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const STREAMING_API = 'http://localhost:3002/api';

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

export const VideoUpload = () => {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile || !thumbnailFile) {
      setError('Please select both video and thumbnail files');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // First, get pre-signed URLs for both files
      const urlsResponse = await axios.post(`${STREAMING_API}/admin/videos/upload-urls`, {
        videoFileName: videoFile.name,
        thumbnailFileName: thumbnailFile.name,
      });

      const { videoUploadUrl, thumbnailUploadUrl, videoKey, thumbnailKey } = urlsResponse.data;

      // Upload thumbnail
      await axios.put(thumbnailUploadUrl, thumbnailFile, {
        headers: { 'Content-Type': thumbnailFile.type },
      });

      // Upload video with progress tracking
      await axios.put(videoUploadUrl, videoFile, {
        headers: { 'Content-Type': videoFile.type },
        onUploadProgress: (progressEvent) => {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          setUploadProgress(Math.round(progress));
        },
      });

      // Create video record
      await axios.post(`${STREAMING_API}/admin/videos`, {
        ...formData,
        s3Key: videoKey,
        thumbnailUrl: thumbnailKey,
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        genre: '',
        releaseYear: new Date().getFullYear(),
        isFeatured: false,
      });
      setVideoFile(null);
      setThumbnailFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || 'Error uploading video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Upload New Video
      </Typography>

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

        {error && (
          <Grid item xs={12}>
            <Typography color="error">{error}</Typography>
          </Grid>
        )}

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
            Upload Video
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};






