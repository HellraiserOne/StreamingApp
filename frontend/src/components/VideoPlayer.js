import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Stack,
  Fade,
  Button,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  FullscreenExit,
  Close,
  Chat,
  ChatBubbleOutline,
} from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';
import { streamingService } from '../services/streaming.service';
import { ChatPanel } from './chat/ChatPanel';

const PlayerLayout = styled(Box)(() => ({
  display: 'flex',
  backgroundColor: '#050505',
  color: '#fff',
  height: '100vh',
}));

const VideoSurface = styled(Box)(() => ({
  position: 'relative',
  flex: 1,
  backgroundColor: '#000',
  overflow: 'hidden',
}));

const VideoElement = styled('video')(() => ({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  backgroundColor: '#000',
}));

const OverlayTop = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  padding: theme.spacing(3, 4, 6),
  background: 'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.0) 100%)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  pointerEvents: 'none',
}));

const OverlayContent = styled(Box)(({ theme }) => ({
  maxWidth: '55%',
  pointerEvents: 'auto',
  [theme.breakpoints.down('md')]: {
    maxWidth: '80%',
  },
}));

const ControlsBar = styled(Box)(({ theme }) => ({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  padding: theme.spacing(3, 4, 4),
  background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.0) 100%)',
  pointerEvents: 'auto',
}));

const ProgressSlider = styled(Slider)(({ theme }) => ({
  color: theme.palette.primary.main,
  height: 4,
  '& .MuiSlider-thumb': {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    '&:hover': {
      boxShadow: `0 0 0 8px ${theme.palette.primary.main}33`,
    },
  },
  '& .MuiSlider-rail': {
    opacity: 0.25,
  },
}));

const formatTime = (timeInSeconds) => {
  if (!Number.isFinite(timeInSeconds)) {
    return '0:00';
  }
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const formatDuration = (duration) => {
  if (!duration) {
    return '';
  }
  const totalMinutes = Math.round(duration / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const RESUME_KEY_PREFIX = 'streamflix.resume';
const RESUME_INTERVAL_MS = 20000;

const loadResumeState = (videoId) => {
  if (!videoId) {
    return null;
  }
  try {
    const raw = localStorage.getItem(`${RESUME_KEY_PREFIX}.${videoId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

const saveResumeState = (videoId, time) => {
  if (!videoId || !Number.isFinite(time)) {
    return;
  }
  const payload = {
    time,
    updatedAt: Date.now(),
  };
  try {
    localStorage.setItem(`${RESUME_KEY_PREFIX}.${videoId}`, JSON.stringify(payload));
  } catch (error) {
    // ignore storage errors
  }
};

const clearResumeState = (videoId) => {
  if (!videoId) {
    return;
  }
  try {
    localStorage.removeItem(`${RESUME_KEY_PREFIX}.${videoId}`);
  } catch (error) {
    // ignore storage errors
  }
};

export const VideoPlayer = ({ video, onClose }) => {
  const theme = useTheme();
  const isCompactLayout = useMediaQuery(theme.breakpoints.down('lg'));

  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [chatOpen, setChatOpen] = useState(() => !isCompactLayout);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [resumeTime, setResumeTime] = useState(0);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const resumeTimerRef = useRef(null);

  const playbackUrl = useMemo(() => streamingService.getPlaybackUrl(video), [video]);

  useEffect(() => {
    setChatOpen(!isCompactLayout);
  }, [isCompactLayout, video?._id]);

  useEffect(() => {
    if (!showControls || !playing) {
      return undefined;
    }

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, playing]);

  useEffect(() => {
    const player = videoRef.current;
    if (!player || !playbackUrl) {
      return;
    }

    const stored = loadResumeState(video?._id);
    const shouldPrompt = Boolean(stored?.time && stored.time > 5);
    if (shouldPrompt) {
      setResumeTime(stored.time);
      setShowResumePrompt(true);
    } else {
      setResumeTime(0);
      setShowResumePrompt(false);
    }

    player.pause();
    player.currentTime = 0;
    player.src = playbackUrl;
    player.volume = volume;
    player.muted = muted;

    if (!shouldPrompt) {
      player
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    } else {
      setPlaying(false);
    }

    const updateTime = () => setCurrentTime(player.currentTime);
    const updateDuration = () => setDuration(player.duration || video?.duration || 0);
    const handleEnded = () => {
      setPlaying(false);
      clearResumeState(video?._id);
    };

    player.addEventListener('timeupdate', updateTime);
    player.addEventListener('loadedmetadata', updateDuration);
    player.addEventListener('ended', handleEnded);

    return () => {
      player.removeEventListener('timeupdate', updateTime);
      player.removeEventListener('loadedmetadata', updateDuration);
      player.removeEventListener('ended', handleEnded);
    };
  }, [playbackUrl, muted, volume, video?.duration, video?._id]);

  useEffect(() => {
    if (!video?._id) {
      return undefined;
    }

    if (resumeTimerRef.current) {
      clearInterval(resumeTimerRef.current);
    }

    resumeTimerRef.current = setInterval(() => {
      const player = videoRef.current;
      if (!player || player.paused || player.ended) {
        return;
      }
      saveResumeState(video._id, player.currentTime);
    }, RESUME_INTERVAL_MS);

    return () => {
      if (resumeTimerRef.current) {
        clearInterval(resumeTimerRef.current);
      }
    };
  }, [video?._id]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMouseMove = () => {
    if (!showControls) {
      setShowControls(true);
    }
  };

  const togglePlay = () => {
    const player = videoRef.current;
    if (!player) {
      return;
    }
    if (playing) {
      player.pause();
    } else {
      player.play().catch(() => setPlaying(false));
    }
    setPlaying((prev) => !prev);
  };

  const handleSeek = (_, value) => {
    const player = videoRef.current;
    if (!player) {
      return;
    }
    player.currentTime = value;
    setCurrentTime(value);
  };

  const handleVolumeChange = (_, value) => {
    const player = videoRef.current;
    if (!player) {
      return;
    }
    player.volume = value;
    setVolume(value);
    setMuted(value === 0);
  };

  const toggleMute = () => {
    const player = videoRef.current;
    if (!player) {
      return;
    }
    const nextMuted = !muted;
    player.muted = nextMuted;
    setMuted(nextMuted);
    if (!nextMuted && player.volume === 0) {
      player.volume = 0.5;
      setVolume(0.5);
    }
  };

  const toggleFullscreen = () => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    if (!document.fullscreenElement) {
      element.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const toggleChat = () => setChatOpen((prev) => !prev);

  const metadata = useMemo(() => {
    if (!video) {
      return '';
    }
    const parts = [video.releaseYear, formatDuration(video.duration), video.genre];
    return parts.filter(Boolean).join(' • ');
  }, [video]);

  const handleResumePlayback = () => {
    const player = videoRef.current;
    if (!player) {
      return;
    }
    player.currentTime = resumeTime;
    player.play().catch(() => setPlaying(false));
    setPlaying(true);
    setShowResumePrompt(false);
  };

  const handleStartOver = () => {
    clearResumeState(video?._id);
    setResumeTime(0);
    setShowResumePrompt(false);
    const player = videoRef.current;
    if (player) {
      player.currentTime = 0;
      player.play().catch(() => setPlaying(false));
      setPlaying(true);
    }
  };

  return (
    <PlayerLayout>
      <VideoSurface
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onClick={togglePlay}
      >
        <VideoElement ref={videoRef} autoPlay playsInline />

        <OverlayTop>
          <OverlayContent>
            <Typography variant="overline" color="text.secondary">
              Now Streaming
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600 }} gutterBottom>
              {video?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520 }}>
              {video?.description}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              {metadata && (
                <Typography variant="caption" color="text.secondary">
                  {metadata}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Tap to pause/play • Toggle chat from the control bar
              </Typography>
            </Stack>
          </OverlayContent>
          <IconButton
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            sx={{ pointerEvents: 'auto', bgcolor: 'rgba(0,0,0,0.4)' }}
          >
            <Close />
          </IconButton>
        </OverlayTop>

        <Fade in={showControls} timeout={200}>
          <ControlsBar onClick={(event) => event.stopPropagation()}>
            <ProgressSlider value={currentTime} max={duration || currentTime + 1} onChange={handleSeek} />
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
              <IconButton onClick={togglePlay} color="inherit">
                {playing ? <Pause /> : <PlayArrow />}
              </IconButton>

              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton onClick={toggleMute} color="inherit">
                  {muted || volume === 0 ? <VolumeOff /> : <VolumeUp />}
                </IconButton>
                <Slider
                  value={muted ? 0 : volume}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={handleVolumeChange}
                  sx={{ width: 120 }}
                />
              </Stack>

              <Typography variant="body2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </Typography>

              <Box sx={{ flexGrow: 1 }} />

              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrow />}
                onClick={() => {
                  const player = videoRef.current;
                  if (player) {
                    player.currentTime = 0;
                    player.play().catch(() => setPlaying(false));
                    setPlaying(true);
                    setShowControls(true);
                  }
                }}
              >
                Restart
              </Button>

              <IconButton onClick={toggleChat} color={chatOpen ? 'primary' : 'inherit'}>
                {chatOpen ? <Chat /> : <ChatBubbleOutline />}
              </IconButton>

              <IconButton onClick={toggleFullscreen} color="inherit">
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Stack>
          </ControlsBar>
        </Fade>
      </VideoSurface>

      <Dialog open={showResumePrompt} onClose={handleStartOver} maxWidth="xs" fullWidth>
        <DialogTitle>Resume Playback?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Continue from {formatTime(resumeTime)} or start from the beginning?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStartOver}>Start Over</Button>
          <Button onClick={handleResumePlayback} variant="contained">
            Resume
          </Button>
        </DialogActions>
      </Dialog>

      {chatOpen && (
        <ChatPanel
          key={video?._id}
          videoId={video?._id}
          videoTitle={video?.title}
          open={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}
    </PlayerLayout>
  );
};
