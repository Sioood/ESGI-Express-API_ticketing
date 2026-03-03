const { createUser } = require('../services/user.service');

async function createUserHandler(req, res, next) {
  try {
    const user = await createUser(req.body);
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      managerId: user.managerId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createUserHandler,
};

