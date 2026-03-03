const express = require('express');
const {
  createTicketHandler,
  listTicketsHandler,
  getTicketHandler,
  changeTicketStatusHandler,
  changeTicketPriorityHandler,
  assignTicketHandler,
  addCommentHandler,
} = require('../controllers/ticket.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', createTicketHandler);
router.get('/', listTicketsHandler);
router.get('/:id', getTicketHandler);

router.patch('/:id/status', changeTicketStatusHandler);
router.patch('/:id/priority', changeTicketPriorityHandler);

router.patch('/:id/assign', requireRole('support'), assignTicketHandler);

router.post('/:id/comments', addCommentHandler);

module.exports = router;


