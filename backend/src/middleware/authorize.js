const { hasPermission } = require('../utils/permissions');
const { AuthorizationError } = require('../utils/errors');

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthorizationError('User not authenticated'));
    }

    if (!hasPermission(req.user.role, permission)) {
      return next(new AuthorizationError(`Permission denied: ${permission}`));
    }

    next();
  };
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthorizationError('User not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AuthorizationError(`Role required: ${roles.join(', ')}`));
    }

    next();
  };
};

const requireSelfOrPermission = (userIdField, permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthorizationError('User not authenticated'));
    }

    const targetUserId = req.params[userIdField] || req.body[userIdField];

    if (targetUserId === req.user.id) {
      return next();
    }

    if (hasPermission(req.user.role, permission)) {
      return next();
    }

    return next(new AuthorizationError('Permission denied'));
  };
};

module.exports = {
  requirePermission,
  requireRole,
  requireSelfOrPermission,
};
