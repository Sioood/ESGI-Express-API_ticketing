const { verifyJwt } = require('../utils/jwt');
const { AuthenticationError } = require('../core/errors');
const { User } = require('../models');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyJwt(token);

    const user = await User.findByPk(decoded.sub);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      managerId: user.managerId,
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
      return;
    }

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new AuthenticationError('Invalid or expired token'));
      return;
    }

    next(error);
  }
}

module.exports = {
  authMiddleware,
};

