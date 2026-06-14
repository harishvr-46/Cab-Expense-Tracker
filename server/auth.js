const crypto = require('crypto');

const sessions = {};

function hashPassword(password) {
  return crypto.createHash('sha256').update(password || '').digest('hex');
}

function createSession(user) {
  const token = crypto.randomBytes(24).toString('hex');
  sessions[token] = user;
  return token;
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    const user = sessions[token];
    if (user) {
      req.user = user;
      req.authToken = token;
    }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

function requireRole(roleOrRoles) {
  const allowed = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles]
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    // Allow if user's top-level role matches (e.g., 'admin' or 'driver')
    if (allowed.includes(req.user.role)) return next()
    // If user is an admin with an admin_level, allow based on admin_level
    if (req.user.role === 'admin' && req.user.admin_level && allowed.includes(req.user.admin_level)) return next()
    return res.status(403).json({ error: 'Forbidden' });
  };
}

module.exports = {
  sessions,
  hashPassword,
  createSession,
  authMiddleware,
  requireAuth,
  requireRole,
};
