const jwt = require('jsonwebtoken');

const verifyToken = (token) => {
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('Chat service token verification failed:', error.message);
    return null;
  }
};

const buildUserContext = (decoded) => {
  if (!decoded) {
    return null;
  }

  return {
    id: decoded.sub,
    email: decoded.email,
    role: decoded.role || 'user',
    name: decoded.name || decoded.email?.split('@')[0] || 'Guest',
  };
};

module.exports = {
  verifyToken,
  buildUserContext,
};
