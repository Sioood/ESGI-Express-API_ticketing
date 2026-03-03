const { User } = require('../models');
const { hashPassword } = require('../utils/password');
const { ValidationError, NotFoundError } = require('../core/errors');

async function createUser(payload) {
  const { name, email, password, role, managerId } = payload;

  if (!name || !email || !password) {
    throw new ValidationError('name, email and password are required');
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new ValidationError('Email already in use');
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: role || 'collaborator',
    managerId: managerId || null,
  });

  return user;
}

async function getUserByEmail(email) {
  return User.findOne({ where: { email } });
}

async function getUserById(id) {
  const user = await User.findByPk(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
};

