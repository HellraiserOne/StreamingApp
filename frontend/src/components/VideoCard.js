import React from 'react';
import { Box, Chip, IconButton, Stack, Typography } from '@mui/material';
import { PlayArrow, InfoOutlined } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const CardContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius * 1.5,
  overflow: 'hidden',
  cursor: 'pointer',
  transformOrigin: 'center',
  transition: 'transform 240ms ease, box-shadow 240ms ease',
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: theme.shadows[8],
  },
}));

const Thumbnail = styled('div')(() => ({
  paddingTop: '56.25%',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}));

const Overlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.7) 80%)',
  color: theme.palette.common.white,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  padding: theme.spacing(2),
  gap: theme.spacing(1.5),
}));

const ActionRow = styled(Stack)(({ theme }) => ({
  direction: 'row',
  gap: theme.spacing(1),
  flexWrap: 'wrap',
  alignItems: 'center',
}));

export const VideoCard = ({ video, onPlay, onInfo }) => {
  return (
    <CardContainer onClick={() => onInfo?.(video)}>
      <Thumbnail style={{ backgroundImage: `url(${video.thumbnailUrl})` }} />
      <Overlay>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }} noWrap>
            {video.title}
          </Typography>
          <IconButton
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }}
            onClick={(event) => {
              event.stopPropagation();
              onPlay?.(video);
            }}
          >
            <PlayArrow />
          </IconButton>
        </Stack>

        <ActionRow>
          <Chip
            label={video.genre}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }}
          />
          <Typography variant="caption" color="rgba(255,255,255,0.75)">
            {video.releaseYear}
          </Typography>
          {video.rating ? (
            <Typography variant="caption" color="rgba(255,255,255,0.75)">
              ⭐ {video.rating.toFixed(1)}
            </Typography>
          ) : null}
          <Box sx={{ flexGrow: 1 }} />
          <IconButton
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }}
            onClick={(event) => {
              event.stopPropagation();
              onInfo?.(video);
            }}
          >
            <InfoOutlined fontSize="small" />
          </IconButton>
        </ActionRow>
      </Overlay>
    </CardContainer>
  );
};






