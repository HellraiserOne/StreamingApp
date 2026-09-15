import React, { useMemo, useState } from 'react';
import { Box, IconButton, Typography, useMediaQuery } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';
import { VideoCard } from './VideoCard';

const SectionWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  paddingInline: theme.spacing(4),
  paddingBlock: theme.spacing(3),
}));

const CarouselViewport = styled(Box)(() => ({
  position: 'relative',
  overflow: 'hidden',
}));

const CarouselTrack = styled(Box)(({ translateX }) => ({
  display: 'flex',
  transform: `translateX(-${translateX}%)`,
  transition: 'transform 420ms ease',
}));

const EdgeFade = styled(Box)(({ theme, position }) => ({
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: '6rem',
  pointerEvents: 'none',
  zIndex: 2,
  [position]: theme.spacing(4),
  background: `linear-gradient(${position === 'left' ? '90deg' : '270deg'}, ${theme.palette.background.default} 0%, rgba(15,15,15,0) 100%)`,
}));

const ControlButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: '40%',
  transform: 'translateY(-50%)',
  zIndex: 3,
  backgroundColor: 'rgba(22, 22, 22, 0.75)',
  backdropFilter: 'blur(6px)',
  color: theme.palette.common.white,
  '&:hover': {
    backgroundColor: 'rgba(22, 22, 22, 0.9)',
  },
}));

export const VideoCarousel = ({ title, videos = [], onPlay, onInfo }) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  const itemsPerPage = useMemo(() => {
    if (isXs) return 1;
    if (isSm) return 2;
    if (isMd) return 4;
    return 5;
  }, [isXs, isSm, isMd]);

  const gapPx = 24;

  const [page, setPage] = useState(0);
  const maxPage = Math.max(0, Math.ceil(videos.length / itemsPerPage) - 1);

  const handlePrevious = () => setPage((prev) => Math.max(0, prev - 1));
  const handleNext = () => setPage((prev) => Math.min(maxPage, prev + 1));

  const translateX = page * 100;

  return (
    <SectionWrapper>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        {title}
      </Typography>

      <CarouselViewport>
        {page > 0 && <EdgeFade position="left" />}
        {page < maxPage && <EdgeFade position="right" />}

        <ControlButton
          onClick={handlePrevious}
          disabled={page === 0}
          sx={{ left: theme.spacing(2), visibility: page === 0 ? 'hidden' : 'visible' }}
        >
          <ChevronLeft />
        </ControlButton>

        <ControlButton
          onClick={handleNext}
          disabled={page >= maxPage}
          sx={{ right: theme.spacing(2), visibility: page >= maxPage ? 'hidden' : 'visible' }}
        >
          <ChevronRight />
        </ControlButton>

        <CarouselTrack translateX={translateX} sx={{ gap: `${gapPx}px` }}>
          {videos.map((video) => (
            <Box
              key={video._id}
              sx={{
                flex: `0 0 calc((100% - ${(itemsPerPage - 1) * gapPx}px) / ${itemsPerPage})`,
                minWidth: 0,
              }}
            >
              <VideoCard video={video} onPlay={onPlay} onInfo={onInfo} />
            </Box>
          ))}
        </CarouselTrack>
      </CarouselViewport>
    </SectionWrapper>
  );
};






