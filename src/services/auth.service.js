const { getUserByEmail } = require('./user.service');
const { verifyPassword } = require('../utils/password');
const { signJwt } = require('../utils/jwt');
const { AuthenticationError } = require('../core/errors');

async function login(email, password) {
  const user = await getUserByEmail(email);

  if (!user) {
    throw new AuthenticationError('Invalid credentials');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new AuthenticationError('Invalid credentials');
  }

  const token = signJwt({
    sub: user.id,
    role: user.role,
    managerId: user.managerId,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      managerId: user.managerId,
    },
  };
}

module.exports = {
  login,
};

