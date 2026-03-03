const jwt = require('jsonwebtoken');
const { config } = require('../config/env');

function signJwt(payload, options) {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: '8h',
    ...options,
  });
}

function verifyJwt(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = {
  signJwt,
  verifyJwt,
};

