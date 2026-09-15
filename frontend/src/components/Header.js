import React, { useEffect, useMemo, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Button,
  InputBase,
  alpha,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  Logout,
  Settings,
  Person,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: 'transparent',
  backgroundImage: 'none',
  boxShadow: 'none',
  transition: 'all 0.3s ease',
  padding: theme.spacing(0, 2),
  '&.solid': {
    backgroundColor: alpha(theme.palette.background.paper, 0.9),
    backdropFilter: 'blur(14px)',
    boxShadow: theme.shadows[6],
  },
}));

const Brand = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.5rem',
  cursor: 'pointer',
  background: 'linear-gradient(135deg, #ff7a18 0%, #af002d 50%, #319197 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}));

const NavLink = styled(Button)(({ theme, active }) => ({
  color: active ? theme.palette.primary.main : theme.palette.grey[300],
  textTransform: 'none',
  fontWeight: active ? 600 : 500,
  fontSize: '0.95rem',
  paddingInline: theme.spacing(1.5),
  '&:hover': {
    color: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
  },
}));

const SearchContainer = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha('#ffffff', 0.1),
  transition: 'all 0.3s ease',
  width: '100%',
  maxWidth: 320,
  '&:hover, &:focus-within': {
    backgroundColor: alpha('#ffffff', 0.18),
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInput = styled(InputBase)(({ theme }) => ({
  color: '#fff',
  width: '100%',
  paddingLeft: `calc(1em + ${theme.spacing(4)})`,
  paddingRight: theme.spacing(1.5),
  '& .MuiInputBase-input': {
    padding: theme.spacing(1.3, 0),
  },
}));

export const Header = ({ onSearch }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isSolid, setIsSolid] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsSolid(window.scrollY > 60);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (onSearch) {
      onSearch(query);
    }
  }, [query, onSearch]);

  const navItems = useMemo(
    () => [
      { label: 'Home', path: '/' },
      { label: 'Browse', path: '/browse' },
      { label: 'My Collection', path: '/collection' },
    ],
    [],
  );

  const initials = useMemo(() => {
    if (!user) {
      return 'U';
    }
    const source = user.name || user.email || '';
    return source.charAt(0).toUpperCase();
  }, [user]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    handleCloseMenu();
  };

  const handleNavigate = (path) => {
    navigate(path);
    handleCloseMenu();
  };

  return (
    <StyledAppBar position="fixed" className={isSolid ? 'solid' : ''}>
      <Toolbar disableGutters sx={{ px: { xs: 2, md: 4 }, minHeight: 72 }}>
        <Stack direction="row" alignItems="center" spacing={3} sx={{ mr: 4 }}>
          <Brand onClick={() => navigate('/')}>StreamFlix</Brand>
          <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                active={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </NavLink>
            ))}
          </Stack>
        </Stack>

        <Box sx={{ flexGrow: 1 }} />

        <SearchContainer>
          <SearchIconWrapper>
            <SearchIcon fontSize="small" />
          </SearchIconWrapper>
          <StyledInput
            placeholder="Search titles, people, genres…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            inputProps={{ 'aria-label': 'search' }}
          />
        </SearchContainer>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ ml: 3 }}>
          {user?.role === 'admin' && (
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate('/admin')}
              sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
            >
              Admin Studio
            </Button>
          )}

          <Stack direction="column" spacing={0} alignItems="flex-end" sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {user?.name || 'Guest'}
            </Typography>
          </Stack>

          <IconButton onClick={handleMenu} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>{initials}</Avatar>
          </IconButton>
        </Stack>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={() => handleNavigate('/profile')}>
            <Person fontSize="small" sx={{ mr: 2 }} />
            Profile
          </MenuItem>
          <MenuItem onClick={() => handleNavigate('/settings')}>
            <Settings fontSize="small" sx={{ mr: 2 }} />
            Settings
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <Logout fontSize="small" sx={{ mr: 2 }} />
            Sign out
          </MenuItem>
        </Menu>
      </Toolbar>
    </StyledAppBar>
  );
};
