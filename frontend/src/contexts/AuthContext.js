import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { chatService } from '../services/chat.service';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');

        if (storedToken) {
          const verified = await authService.verifyToken();
          if (verified.success) {
            setUser(verified.user);
            setToken(storedToken);
          } else {
            handleLogout();
          }
        } else {
          setToken(null);
          setUser(null);
          chatService.disconnect();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const result = await authService.login(email, password);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Login failed',
        };
      }

      setUser(result.user);
      setToken(result.token || localStorage.getItem('token'));
      navigate('/browse');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const handleRegister = async (userData) => {
    try {
      await authService.register(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const handleForgotPassword = async (payload) => {
    try {
      const result = await authService.forgotPassword(payload);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Password reset request failed'
      };
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    chatService.disconnect();
    navigate('/login');
  };

  const value = {
    user,
    loading,
    login: handleLogin,
    register: handleRegister,
    forgotPassword: handleForgotPassword,
    logout: handleLogout,
    token,
    isAuthenticated: () => Boolean(token),
  };

  if (loading) {
    return <div>Loading...</div>; // You can replace this with a proper loading component
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
