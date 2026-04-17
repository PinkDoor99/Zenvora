const jwt = require('jsonwebtoken');
const db = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'zenvora-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class Auth {
  // Generate JWT token
  generateToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  // Middleware to authenticate requests
  authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = this.verifyToken(token);
    if (!decoded) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
  }

  // Middleware to check admin role
  requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  }

  // Middleware to check if user owns resource or is admin
  requireOwnership(resourceOwnerId) {
    return (req, res, next) => {
      if (req.user.role !== 'admin' && req.user.userId !== resourceOwnerId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      next();
    };
  }

  // Optional authentication (doesn't fail if no token)
  optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = this.verifyToken(token);
      if (decoded) {
        req.user = decoded;
      }
    }
    next();
  }

  // Rate limiting helper
  createRateLimit(windowMs, maxRequests, message = 'Too many requests') {
    const requests = new Map();

    return (req, res, next) => {
      const key = req.ip;
      const now = Date.now();
      const windowStart = now - windowMs;

      if (!requests.has(key)) {
        requests.set(key, []);
      }

      const userRequests = requests.get(key);
      // Remove old requests
      const validRequests = userRequests.filter(time => time > windowStart);

      if (validRequests.length >= maxRequests) {
        return res.status(429).json({ error: message });
      }

      validRequests.push(now);
      requests.set(key, validRequests);
      next();
    };
  }
}

module.exports = new Auth();