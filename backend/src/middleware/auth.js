const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { AuthenticationError } = require('../utils/errors');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authorization header missing or invalid');
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const tokenRecord = await prisma.loginToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.revoked) {
      throw new AuthenticationError('Token has been revoked');
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new AuthenticationError('Token has expired');
    }

    if (!tokenRecord.user.isActive) {
      throw new AuthenticationError('User account is disabled');
    }

    req.user = {
      id: tokenRecord.user.id,
      username: tokenRecord.user.username,
      name: tokenRecord.user.name,
      role: tokenRecord.role,
      email: tokenRecord.user.email,
    };

    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AuthenticationError('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new AuthenticationError('Token has expired'));
    } else {
      next(error);
    }
  }
};

module.exports = auth;
