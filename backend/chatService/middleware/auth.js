const { verifyToken, buildUserContext } = require('../util/auth');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = bearerToken || req.cookies?.token;

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  req.user = buildUserContext(decoded);
  next();
};

module.exports = { authenticate };
