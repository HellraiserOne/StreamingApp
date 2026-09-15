import { api } from './api';

const persistUser = (user, token) => {
  if (token) {
    localStorage.setItem('token', token);
  }
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export const authService = {
  async login(email, password) {
    try {
      const response = await api.post('/login', { email, password });
      if (!response.data.success) {
        return { success: false, error: response.data.message || 'Login failed' };
      }

      const userData = {
        ...response.data.user,
        role: response.data.user?.role || 'user',
      };

      persistUser(userData, response.data.token);
      return {
        success: true,
        user: userData,
        token: response.data.token,
        message: response.data.message,
      };
    } catch (error) {
      const message = error.response?.data?.message || 'An error occurred during login';
      return { success: false, error: message };
    }
  },

  async register(userData) {
    try {
      const response = await api.post('/register', userData);
      if (response.data.success) {
        return { success: true, message: response.data.message };
      }

      return {
        success: false,
        error: response.data.message || 'Registration failed',
      };
    } catch (error) {
      const message = error.response?.data?.message || 'An error occurred during registration';
      return { success: false, error: message };
    }
  },

  async forgotPassword(payload) {
    try {
      const body = typeof payload === 'string' ? { email: payload } : payload;
      const response = await api.post('/forgetPassword', body);
      return {
        success: response.data.success,
        message: response.data.message,
        error: response.data.success ? null : response.data.message,
      };
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to process request';
      return { success: false, error: message };
    }
  },

  async verifyToken() {
    try {
      const response = await api.get('/verify');
      if (response.data.success && response.data.user) {
        const userData = {
          ...response.data.user,
          role: response.data.user?.role || 'user',
        };
        persistUser(userData);
        return { success: true, user: userData };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
};
