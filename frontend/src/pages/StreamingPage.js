import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  IconButton,
  AppBar,
  Toolbar,
  Button,
  Slider,
  styled,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  ExitToApp,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { streamingService } from '../services/streaming.service';

const VideoContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  backgroundColor: '#000',
  borderRadius: theme.spacing(1),
  overflow: 'hidden',
  '& video': {
    width: '100%',
    height: 'auto',
  },
}));

const Controls = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: theme.spacing(2),
  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

export const StreamingPage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);
  const { logout, user } = useAuth();
  const playbackUrl = currentVideo ? streamingService.getPlaybackUrl(currentVideo) : '';

  useEffect(() => {
    const loadVideo = async () => {
      try {
        const featured = await streamingService.getFeaturedVideos();
        if (featured.length > 0) {
          setCurrentVideo(featured[0]);
        } else {
          const videos = await streamingService.getVideos();
          if (videos.length > 0) {
            setCurrentVideo(videos[0]);
          }
        }
      } catch (error) {
        console.error('Error loading video:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, []);

  useEffect(() => {
    if (!videoRef.current || !playbackUrl) {
      return;
    }
    videoRef.current.load();
    if (isMuted) {
      videoRef.current.muted = true;
    }
  }, [playbackUrl, isMuted]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (event, newValue) => {
    const video = videoRef.current;
    if (video) {
      video.volume = newValue;
      setVolume(newValue);
      setIsMuted(newValue === 0);
    }
  };

  const handleMuteToggle = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (video) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen();
      } else if (video.msRequestFullscreen) {
        video.msRequestFullscreen();
      }
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            HotPrimeFlix
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Welcome, {user?.name}
          </Typography>
          <Button color="inherit" onClick={logout} startIcon={<ExitToApp />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
        <VideoContainer>
          <video
            id="videoPlayer"
            ref={videoRef}
            controls={false}
            autoPlay={false}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            {playbackUrl && <source src={playbackUrl} type="video/mp4" />}
            Your browser does not support the video tag.
          </video>

          <Controls>
            <IconButton onClick={handlePlayPause} color="primary">
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>

            <IconButton onClick={handleMuteToggle} color="primary">
              {isMuted ? <VolumeOff /> : <VolumeUp />}
            </IconButton>

            <Box sx={{ width: 100 }}>
              <Slider
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                min={0}
                max={1}
                step={0.1}
                aria-label="Volume"
              />
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            <IconButton onClick={handleFullscreen} color="primary">
              <Fullscreen />
            </IconButton>
          </Controls>
        </VideoContainer>
        )}

        <Typography variant="h4" sx={{ mt: 4, mb: 2 }}>
          Now Playing
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Experience high-quality streaming with our advanced video player. Enjoy your favorite content
          with custom controls and a sleek interface.
        </Typography>
      </Container>
    </Box>
  );
};

