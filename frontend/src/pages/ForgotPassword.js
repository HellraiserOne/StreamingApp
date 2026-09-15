import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Link,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { AuthContainer, FormContainer } from '../styles/auth.styles';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('request');
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (step === 'request') {
        const result = await forgotPassword({ email });
        if (result.success) {
          setSuccess(result.message || 'Verification code sent. Check your email.');
          setStep('verify');
        } else {
          setError(result.error);
        }
      } else {
        if (!verificationCode) {
          setError('Verification code is required');
          return;
        }
        if (!password) {
          setError('New password is required');
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters long');
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }

        const result = await forgotPassword({
          email,
          code: verificationCode,
          password,
        });
        if (result.success) {
          setSuccess('Password updated. You can sign in now.');
          setEmail('');
          setVerificationCode('');
          setPassword('');
          setConfirmPassword('');
          setStep('request');
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContainer>
      <Typography component="h1" variant="h5">
        Reset Password
      </Typography>
      <Typography variant="body2" sx={{ mt: 2, mb: 2, textAlign: 'center' }}>
        {step === 'request'
          ? 'Enter your email address and we will send a verification code.'
          : 'Enter the verification code and your new password.'}
      </Typography>
      {success && (
        <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
          {success}
        </Alert>
      )}
      <FormContainer onSubmit={handleSubmit}>
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={!!error}
          helperText={error}
        />
        {step === 'verify' && (
          <>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="verificationCode"
              label="Verification Code"
              name="verificationCode"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="password"
              label="New Password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="confirmPassword"
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </>
        )}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading
            ? <CircularProgress size={24} />
            : step === 'request'
              ? 'Send Verification Code'
              : 'Update Password'}
        </Button>
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Remember your password?{' '}
          <Link component={RouterLink} to="/login">
            Sign In
          </Link>
        </Typography>
      </FormContainer>
    </AuthContainer>
  );
};

