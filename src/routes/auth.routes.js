const express = require('express');
const { loginHandler, meHandler } = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login', loginHandler);
router.get('/me', authMiddleware, meHandler);

module.exports = router;

