const { AuthorizationError } = require('../core/errors');

function requireRole(requiredRole) {
  return (req, res, next) => {
    const role = req.user?.role;

    if (role !== requiredRole) {
      next(new AuthorizationError('Insufficient role'));
      return;
    }

    next();
  };
}

function requireAnyRole(roles) {
  return (req, res, next) => {
    const role = req.user?.role;

    if (!role || !roles.includes(role)) {
      next(new AuthorizationError('Insufficient role'));
      return;
    }

    next();
  };
}

module.exports = {
  requireRole,
  requireAnyRole,
};

