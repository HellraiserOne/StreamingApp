import React from 'react';
import { Box, Button, Chip, Container, Stack, Typography } from '@mui/material';
import { PlayArrow, Info, Bolt } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const HeroWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  minHeight: '78vh',
  display: 'flex',
  alignItems: 'flex-end',
  paddingTop: theme.spacing(8),
  color: theme.palette.common.white,
  overflow: 'hidden',
}));

const HeroBackdrop = styled(Box)(() => ({
  position: 'absolute',
  inset: 0,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  transform: 'scale(1.02)',
  filter: 'brightness(0.75)',
}));

const GradientOverlay = styled(Box)(() => ({
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(120deg, rgba(10,10,10,0.9) 20%, rgba(10,10,10,0.4) 60%, rgba(10,10,10,0.85) 100%)',
}));

const HeroContent = styled(Container)(({ theme }) => ({
  position: 'relative',
  zIndex: 2,
  paddingTop: theme.spacing(14),
  paddingBottom: theme.spacing(10),
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 999,
  paddingInline: theme.spacing(3),
  textTransform: 'none',
  fontWeight: 600,
}));

export const HeroSection = ({ featured, onPlay, onInfo }) => {
  if (!featured) {
    return null;
  }

  const metadata = [featured.genre, featured.releaseYear, `${Math.round((featured.duration || 0) / 60)} min`]
    .filter(Boolean)
    .join(' • ');

  return (
    <HeroWrapper>
      <HeroBackdrop sx={{ backgroundImage: `url(${featured.thumbnailUrl})` }} />
      <GradientOverlay />
      <HeroContent maxWidth="lg">
        <Stack spacing={3} sx={{ maxWidth: { xs: '100%', md: '55%' } }}>
          <Chip
            color="primary"
            icon={<Bolt />}
            label="Featured Premiere"
            sx={{ alignSelf: 'flex-start', fontWeight: 600 }}
          />
          <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
            {featured.title}
          </Typography>
          <Typography variant="h6" color="rgba(255,255,255,0.8)" sx={{ fontWeight: 400 }}>
            {featured.description}
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.7)">
            {metadata}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1 }}>
            <ActionButton
              variant="contained"
              color="primary"
              startIcon={<PlayArrow />}
              onClick={() => onPlay?.(featured)}
            >
              Watch Now
            </ActionButton>
            <ActionButton
              variant="outlined"
              color="inherit"
              startIcon={<Info />}
              onClick={() => onInfo?.(featured)}
            >
              View Details
            </ActionButton>
          </Stack>
        </Stack>
      </HeroContent>
    </HeroWrapper>
  );
};






