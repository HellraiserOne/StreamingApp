const getEnv = (key, fallback) => {
  const value = process.env[key];
  return value === undefined || value === '' ? fallback : value;
};

export const AUTH_API_URL = getEnv('REACT_APP_AUTH_API_URL', 'http://localhost:3001/api');
export const STREAMING_API_URL = getEnv('REACT_APP_STREAMING_API_URL', 'http://localhost:3002/api');
export const STREAMING_PUBLIC_URL = getEnv('REACT_APP_STREAMING_PUBLIC_URL', 'http://localhost:3002');
export const ADMIN_API_URL = getEnv('REACT_APP_ADMIN_API_URL', 'http://localhost:3003/api/admin');
export const CHAT_API_URL = getEnv('REACT_APP_CHAT_API_URL', 'http://localhost:3004/api/chat');
export const CHAT_SOCKET_URL = getEnv('REACT_APP_CHAT_SOCKET_URL', 'http://localhost:3004');
