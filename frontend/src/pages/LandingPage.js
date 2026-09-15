import React, { useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
  PlayArrow,
  DevicesOther,
  Bolt,
  Security,
  Chat,
  MovieFilter,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Hero = styled(Box)(({ theme }) => ({
  minHeight: '85vh',
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  background: 'radial-gradient(circle at top left, rgba(255,71,87,0.35), transparent 55%), radial-gradient(circle at bottom right, rgba(47,128,237,0.45), transparent 45%), #050505',
  color: theme.palette.common.white,
  overflow: 'hidden',
}));

const HeroGlow = styled('div')(() => ({
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(120deg, rgba(5,5,5,0.8) 25%, rgba(5,5,5,0.4) 60%, rgba(5,5,5,0.85) 100%)',
}));

const HeroContent = styled(Container)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  paddingBlock: theme.spacing(10),
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background: 'linear-gradient(180deg, rgba(20,20,20,1) 0%, rgba(12,12,12,1) 100%)',
  border: '1px solid rgba(255,255,255,0.05)',
  boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
  transition: 'transform 0.25s ease',
  '&:hover': {
    transform: 'translateY(-6px)',
  },
}));

const StepCard = styled(Card)(({ theme }) => ({
  height: '100%',
  padding: theme.spacing(3),
  backgroundColor: 'rgba(12,12,12,0.85)',
  border: '1px solid rgba(255,255,255,0.08)',
}));

export const LandingPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/browse', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const features = [
    {
      icon: <MovieFilter fontSize="large" />,
      title: 'Premium Originals',
      description: 'Dive into exclusive series and films produced for StreamFlix members only.',
    },
    {
      icon: <DevicesOther fontSize="large" />,
      title: 'Any Screen, Anywhere',
      description: 'Seamless streaming on TV, mobile, desktop, and tablets with smart syncing.',
    },
    {
      icon: <Bolt fontSize="large" />,
      title: 'Adaptive Quality',
      description: 'Enjoy lightning-fast playback with adaptive bitrate streaming up to 4K HDR.',
    },
    {
      icon: <Chat fontSize="large" />,
      title: 'Live Watch Parties',
      description: 'Start a party, stream together, and chat in real time with friends across the globe.',
    },
    {
      icon: <Security fontSize="large" />,
      title: 'Personalized Profiles',
      description: 'Create kid-safe profiles with curated collections and smart recommendations.',
    },
  ];

  const steps = [
    {
      tag: '01',
      title: 'Create your account',
      description: 'Sign up in seconds and personalize your profile for tailored recommendations.',
    },
    {
      tag: '02',
      title: 'Choose a plan',
      description: 'Pick a flexible plan that matches your binge habits. Cancel anytime, no questions.',
    },
    {
      tag: '03',
      title: 'Start streaming',
      description: 'Press play on blockbuster films, trending shows, and immersive live premieres.',
    },
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Hero>
        <HeroGlow />
        <HeroContent maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography
                variant={isMobile ? 'h3' : 'h1'}
                sx={{ fontWeight: 800, lineHeight: 1.05, mb: 3 }}
              >
                Stream premium cinema from the comfort of anywhere.
              </Typography>
              <Typography variant="h6" color="rgba(255,255,255,0.75)" sx={{ mb: 4 }}>
                Join millions of viewers discovering new worlds, sharing live reactions, and enjoying buffer-free 4K storytelling.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrow />}
                  onClick={() => navigate('/register')}
                  sx={{ borderRadius: 999, px: 4, py: 1.5, fontWeight: 700 }}
                >
                  Start Free Trial
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/browse')}
                  sx={{ borderRadius: 999, px: 4, py: 1.5, fontWeight: 600 }}
                >
                  Explore Catalog
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </HeroContent>
      </Hero>

      <Box sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 6 }}>
            Built for the way you love to watch
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature) => (
              <Grid item xs={12} sm={6} md={4} key={feature.title}>
                <FeatureCard>
                  <CardContent sx={{ py: 4 }}>
                    <Box sx={{ fontSize: 0, color: 'primary.main', mb: 2 }}>{feature.icon}</Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="rgba(255,255,255,0.65)">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </FeatureCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 8, md: 12 }, background: 'linear-gradient(180deg, #090909 0%, #050505 100%)' }}>
        <Container maxWidth="md">
          <Typography variant="h4" align="center" sx={{ fontWeight: 700, mb: 6 }}>
            Start streaming in three easy steps
          </Typography>
          <Grid container spacing={4}>
            {steps.map((step) => (
              <Grid item xs={12} md={4} key={step.tag}>
                <StepCard>
                  <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                    {step.tag}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, mt: 1, mb: 1.5 }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.7)">
                    {step.description}
                  </Typography>
                </StepCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box component="footer" sx={{ py: 6, bgcolor: '#040404', color: 'rgba(255,255,255,0.5)' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" align="center">
            © {new Date().getFullYear()} StreamFlix. Crafted for storytellers and streamers worldwide.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};






