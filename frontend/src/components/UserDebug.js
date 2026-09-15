import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export const UserDebug = () => {
  const { user } = useAuth();

  return (
    <Paper sx={{ p: 2, m: 2, position: 'fixed', bottom: 0, right: 0, zIndex: 9999 }}>
      <Typography variant="h6">User Debug Info</Typography>
      <Box sx={{ mt: 1 }}>
        <Typography>Role: {user?.role || 'Not set'}</Typography>
        <Typography>Name: {user?.name || 'Not set'}</Typography>
        <Typography>Email: {user?.email || 'Not set'}</Typography>
      </Box>
    </Paper>
  );
};






