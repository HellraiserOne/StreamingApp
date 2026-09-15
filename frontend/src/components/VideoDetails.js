import React from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { Close, PlayArrow } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const DetailsWrapper = styled(Box)(() => ({
  position: 'relative',
  minHeight: '100vh',
  color: '#fff',
  backgroundColor: '#050505',
}));

const Background = styled('div')(() => ({
  position: 'absolute',
  inset: 0,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  filter: 'brightness(0.35)',
}));

const Gradient = styled('div')(() => ({
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(120deg, rgba(5,5,5,0.95) 35%, rgba(5,5,5,0.6) 70%, rgba(5,5,5,0.95) 100%)',
}));

const Content = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  maxWidth: 960,
  margin: '0 auto',
  padding: theme.spacing(10, 4, 6),
}));

const MetaRow = styled(Stack)(({ theme }) => ({
  direction: 'row',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  flexWrap: 'wrap',
}));

export const VideoDetails = ({ video, onPlay, onClose }) => {
  if (!video) {
    return null;
  }

  const durationMinutes = Math.round((video.duration || 0) / 60);

  return (
    <DetailsWrapper>
      <Background style={{ backgroundImage: `url(${video.thumbnailUrl})` }} />
      <Gradient />

      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 24,
          right: 24,
          zIndex: 2,
          bgcolor: 'rgba(0,0,0,0.55)',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
        }}
      >
        <Close />
      </IconButton>

      <Content>
        <Typography variant="overline" color="rgba(255,255,255,0.65)">
          {video.genre} • {video.releaseYear}
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
          {video.title}
        </Typography>

        <MetaRow sx={{ mb: 3 }}>
          <Chip
            label={`${durationMinutes} minutes`}
            sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }}
          />
          {video.rating ? (
            <Chip
              label={`Audience Score ${video.rating.toFixed(1)}`}
              sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }}
            />
          ) : null}
        </MetaRow>

        <Typography variant="body1" color="rgba(255,255,255,0.85)" sx={{ mb: 4, maxWidth: 720 }}>
          {video.description}
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mb: 6 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrow />}
            onClick={onPlay}
            sx={{ borderRadius: 999, px: 4, fontWeight: 600 }}
          >
            Resume Playback
          </Button>
        </Stack>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', mb: 4 }} />

        <Stack spacing={1.5}>
          <Typography variant="subtitle2" color="rgba(255,255,255,0.6)">
            Details
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.75)">
            Released in {video.releaseYear}. Genre: {video.genre}. Runtime approximately {durationMinutes} minutes.
          </Typography>
        </Stack>
      </Content>
    </DetailsWrapper>
  );
};






