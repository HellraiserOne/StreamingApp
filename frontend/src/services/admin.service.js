import axios from 'axios';
import { ADMIN_API_URL } from '../config/env';

const adminApi = axios.create({
  baseURL: ADMIN_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export const adminService = {
  async listVideos() {
    const { data } = await adminApi.get('/videos');
    return data.videos || [];
  },

  async getUploadUrls(payload) {
    const { data } = await adminApi.post('/videos/upload-urls', payload);
    return data;
  },

  async getVideoUploadUrl(payload) {
    const { data } = await adminApi.post('/videos/upload-urls/video', payload);
    return data;
  },

  async getThumbnailUploadUrl(payload) {
    const { data } = await adminApi.post('/videos/upload-urls/thumbnail', payload);
    return data;
  },

  async uploadVideoFile(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await adminApi.post('/videos/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: options.onUploadProgress,
    });
    return data;
  },

  async uploadThumbnailFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await adminApi.post('/videos/upload/thumbnail', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async createVideo(payload) {
    const { data } = await adminApi.post('/videos', payload);
    return data.video;
  },

  async updateVideo(id, payload) {
    const { data } = await adminApi.put(`/videos/${id}`, payload);
    return data.video;
  },

  async deleteVideo(id) {
    await adminApi.delete(`/videos/${id}`);
  },

  async toggleFeatured(id, isFeatured) {
    const { data } = await adminApi.patch(`/videos/${id}/featured`, { isFeatured });
    return data.video;
  },

  async uploadToSignedUrl(url, file, options = {}) {
    return axios.put(url, file, {
      headers: { 'Content-Type': file.type },
      onUploadProgress: options.onUploadProgress,
    });
  },
};
