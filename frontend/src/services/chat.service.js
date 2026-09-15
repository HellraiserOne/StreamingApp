import axios from 'axios';
import { io } from 'socket.io-client';
import { CHAT_API_URL, CHAT_SOCKET_URL } from '../config/env';

const normalizeMessage = (message) => {
  if (!message) {
    return null;
  }

  const normalized = {
    id: message.id || message._id || `${message.videoId}-${message.userId}-${message.createdAt}`,
    videoId: message.videoId,
    userId: message.userId,
    userName: message.userName,
    role: message.role || 'user',
    content: message.content,
    createdAt: message.createdAt,
  };

  return normalized;
};

class ChatService {
  constructor() {
    this.socket = null;
    this.token = null;
  }

  getStoredToken() {
    try {
      return localStorage.getItem('token');
    } catch (error) {
      return null;
    }
  }

  ensureSocket(token) {
    const resolvedToken = token || this.getStoredToken();
    if (this.socket && this.token === resolvedToken) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.token = resolvedToken;
    this.socket = io(CHAT_SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: false,
      auth: { token: resolvedToken },
    });

    this.socket.on('connect_error', (error) => {
      console.error('Chat socket connection error:', error.message);
    });

    this.socket.connect();
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.token = null;
    }
  }

  async fetchHistory(videoId, limit = 50, token) {
    if (!videoId) {
      return [];
    }

    const resolvedToken = token || this.getStoredToken();
    const headers = resolvedToken
      ? {
          Authorization: `Bearer ${resolvedToken}`,
        }
      : undefined;

    const { data } = await axios.get(`${CHAT_API_URL}/history/${videoId}`, {
      params: { limit },
      withCredentials: true,
      headers,
    });

    return (data.messages || []).map(normalizeMessage).filter(Boolean);
  }

  joinRoom(videoId, token) {
    const resolvedToken = token || this.getStoredToken();
    if (!resolvedToken) {
      return Promise.reject(new Error('Authentication required'));
    }

    if (!videoId) {
      return Promise.reject(new Error('videoId is required'));
    }

    const socket = this.ensureSocket(resolvedToken);

    return new Promise((resolve, reject) => {
      socket.emit('chat:join', { videoId }, (response) => {
        if (response?.success) {
          const messages = (response.messages || []).map(normalizeMessage).filter(Boolean);
          resolve({ ...response, messages });
        } else {
          reject(new Error(response?.message || 'Unable to join chat'));
        }
      });
    });
  }

  leaveRoom(videoId) {
    if (!this.socket || !videoId) {
      return;
    }
    this.socket.emit('chat:leave', { videoId });
  }

  sendMessage(videoId, content) {
    if (!this.socket) {
      return Promise.reject(new Error('Chat connection not established'));
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('chat:message', { videoId, content }, (response) => {
        if (response?.success) {
          resolve(normalizeMessage(response.message));
        } else {
          reject(new Error(response?.message || 'Failed to send message'));
        }
      });
    });
  }

  on(event, handler) {
    if (!this.socket) {
      return;
    }
    this.socket.on(event, handler);
  }

  off(event, handler) {
    if (!this.socket) {
      return;
    }
    this.socket.off(event, handler);
  }
}

export const chatService = new ChatService();
