import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, CircularProgress, Dialog, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import { Header } from '../components/Header';
import { HeroSection } from '../components/HeroSection';
import { VideoCarousel } from '../components/VideoCarousel';
import { VideoPlayer } from '../components/VideoPlayer';
import { VideoDetails } from '../components/VideoDetails';
import { useAuth } from '../contexts/AuthContext';
import { streamingService } from '../services/streaming.service';

const buildGenreGroups = (videos) => {
  const byGenre = videos.reduce((acc, video) => {
    if (!video.genre) {
      return acc;
    }
    acc[video.genre] = acc[video.genre] || [];
    acc[video.genre].push(video);
    return acc;
  }, {});

  return Object.entries(byGenre).map(([genre, genreVideos]) => ({
    genre,
    videos: genreVideos,
  }));
};

export const Browse = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState(null);
  const [videosByGenre, setVideosByGenre] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadVideos = useCallback(async () => {
    try {
      const [featuredVideos, catalogue] = await Promise.all([
        streamingService.getFeaturedVideos(),
        streamingService.getVideos(),
      ]);

      if (featuredVideos.length > 0) {
        setFeatured(featuredVideos[0]);
      }

      setVideosByGenre(buildGenreGroups(catalogue));
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Unable to load videos right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const trendingVideos = useMemo(() => {
    const uniqueMap = new Map();
    videosByGenre.forEach((group) => {
      group.videos.forEach((video) => {
        if (!uniqueMap.has(video._id)) {
          uniqueMap.set(video._id, video);
        }
      });
    });
    return Array.from(uniqueMap.values()).slice(0, 10);
  }, [videosByGenre]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) {
      return videosByGenre;
    }

    const lowerQuery = searchQuery.toLowerCase();

    return videosByGenre
      .map((group) => ({
        genre: group.genre,
        videos: group.videos.filter(
          (video) =>
            video.title.toLowerCase().includes(lowerQuery) ||
            video.description.toLowerCase().includes(lowerQuery),
        ),
      }))
      .filter((group) => group.videos.length > 0);
  }, [videosByGenre, searchQuery]);

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

  if (loading) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const sectionsToRender = filteredGroups;

  const hasFeatured = Boolean(featured);

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        minHeight: '100vh',
        backgroundImage:
          'radial-gradient(1200px circle at 20% 0%, rgba(255,71,87,0.15), transparent 45%), radial-gradient(1000px circle at 85% 5%, rgba(47,128,237,0.12), transparent 45%)',
      }}
    >
      <Header onSearch={setSearchQuery} />
      <Box sx={{ pt: hasFeatured ? 0 : { xs: 10, sm: 11, md: 12 } }}>
        <HeroSection featured={featured} onPlay={handlePlay} onInfo={handleInfo} />
      </Box>

      <Box sx={{ position: 'relative', zIndex: 1, mt: hasFeatured ? 0 : 2 }}>
        <Box sx={{ px: { xs: 2, md: 6 }, pb: 6 }}>
          {searchQuery && sectionsToRender.length === 0 && (
            <Typography variant="h6" color="text.secondary" sx={{ py: 6 }}>
              No titles matched “{searchQuery}”. Try searching for another keyword.
            </Typography>
          )}

          {!searchQuery && trendingVideos.length > 0 && (
            <VideoCarousel
              title={user ? 'Trending For You' : 'Trending Now'}
              videos={trendingVideos}
              onPlay={handlePlay}
              onInfo={handleInfo}
            />
          )}

          {sectionsToRender.map((group) => (
            <VideoCarousel
              key={group.genre}
              title={group.genre}
              videos={group.videos}
              onPlay={handlePlay}
              onInfo={handleInfo}
            />
          ))}
        </Box>
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
