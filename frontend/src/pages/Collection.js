import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, CircularProgress, Dialog, Grid, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import { Header } from '../components/Header';
import { VideoCard } from '../components/VideoCard';
import { VideoDetails } from '../components/VideoDetails';
import { VideoPlayer } from '../components/VideoPlayer';
import { streamingService } from '../services/streaming.service';

const RESUME_PREFIX = 'streamflix.resume.';

const loadResumeEntries = () => {
  try {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith(RESUME_PREFIX))
      .map((key) => {
        const raw = localStorage.getItem(key);
        const payload = raw ? JSON.parse(raw) : null;
        return {
          videoId: key.replace(RESUME_PREFIX, ''),
          time: payload?.time || 0,
          updatedAt: payload?.updatedAt || 0,
        };
      })
      .filter((entry) => entry.videoId);
  } catch (error) {
    return [];
  }
};

const formatResume = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '';
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
};

export const Collection = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const loadCollection = useCallback(async () => {
    setLoading(true);
    try {
      const entries = loadResumeEntries().sort((a, b) => b.updatedAt - a.updatedAt);
      if (entries.length === 0) {
        setItems([]);
        return;
      }

      const results = await Promise.all(
        entries.map(async (entry) => {
          try {
            const video = await streamingService.getVideoDetails(entry.videoId);
            return { ...entry, video };
          } catch (error) {
            return null;
          }
        }),
      );

      setItems(results.filter(Boolean));
    } catch (error) {
      console.error('Failed to load collection:', error);
      toast.error('Unable to load your collection right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  const handlePlay = (video) => {
    setSelectedVideo(video);
    setIsPlaying(true);
  };

  const handleInfo = (video) => {
    setSelectedVideo(video);
    setIsPlaying(false);
  };

  const handleCloseDialog = () => {
    setSelectedVideo(null);
    setIsPlaying(false);
  };

  const emptyState = useMemo(
    () => (
      <Box sx={{ textAlign: 'center', py: 12 }}>
        <Typography variant="h4" gutterBottom>
          Your collection is empty
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Start watching a title to see it here with a resume point.
        </Typography>
      </Box>
    ),
    [],
  );

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Header />

      <Box sx={{ pt: { xs: 10, sm: 11, md: 12 }, px: { xs: 2, md: 6 }, pb: 8 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
          My Collection
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          emptyState
        ) : (
          <Grid container spacing={3}>
            {items.map((item) => (
              <Grid item key={item.video._id} xs={12} sm={6} md={4} lg={3}>
                <Box sx={{ position: 'relative' }}>
                  <VideoCard video={item.video} onPlay={handlePlay} onInfo={handleInfo} />
                  {item.time > 0 && (
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        left: 12,
                        bottom: 12,
                        px: 1.2,
                        py: 0.3,
                        borderRadius: 999,
                        bgcolor: 'rgba(0,0,0,0.65)',
                        color: '#fff',
                      }}
                    >
                      Resume at {formatResume(item.time)}
                    </Typography>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Dialog
        fullScreen
        open={Boolean(selectedVideo)}
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(5,5,5,0.95)',
          },
        }}
      >
        {selectedVideo && (
          isPlaying ? (
            <VideoPlayer video={selectedVideo} onClose={handleCloseDialog} />
          ) : (
            <VideoDetails
              video={selectedVideo}
              onPlay={() => setIsPlaying(true)}
              onClose={handleCloseDialog}
            />
          )
        )}
      </Dialog>
    </Box>
  );
};
