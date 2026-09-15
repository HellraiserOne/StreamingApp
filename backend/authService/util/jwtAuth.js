const jwt = require('jsonwebtoken');

const jwtTokenGenerator = (user) => {
  const payload = {
    sub: user._id,
    email: user.email,
    name: user.name,
    role: user.role || 'user',
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

const jwtTokenVerify = (token) => {
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return null;
  }
};

module.exports = { jwtTokenGenerator, jwtTokenVerify };
