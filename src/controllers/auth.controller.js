const { login } = require('../services/auth.service');

async function loginHandler(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function meHandler(req, res) {
  res.json({ user: req.user });
}

module.exports = {
  loginHandler,
  meHandler,
};

