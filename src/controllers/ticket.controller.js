const {
  createTicket,
  listTickets,
  getTicketByIdForUser,
  changeTicketStatus,
  changeTicketPriority,
  assignTicket,
  addComment,
} = require('../services/ticket.service');

async function createTicketHandler(req, res, next) {
  try {
    const ticket = await createTicket(req.user, req.body);
    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
}

async function listTicketsHandler(req, res, next) {
  try {
    const tickets = await listTickets(req.user, req.query);
    res.json(tickets);
  } catch (error) {
    next(error);
  }
}

async function getTicketHandler(req, res, next) {
  try {
    const ticketId = Number(req.params.id);
    const ticket = await getTicketByIdForUser(req.user, ticketId);
    res.json(ticket);
  } catch (error) {
    next(error);
  }
}

async function changeTicketStatusHandler(req, res, next) {
  try {
    const ticketId = Number(req.params.id);
    const { status } = req.body;
    const ticket = await changeTicketStatus(req.user, ticketId, status);
    res.json(ticket);
  } catch (error) {
    next(error);
  }
}

async function changeTicketPriorityHandler(req, res, next) {
  try {
    const ticketId = Number(req.params.id);
    const { priority } = req.body;
    const ticket = await changeTicketPriority(req.user, ticketId, priority);
    res.json(ticket);
  } catch (error) {
    next(error);
  }
}

async function assignTicketHandler(req, res, next) {
  try {
    const ticketId = Number(req.params.id);
    const { assigneeId } = req.body;
    const ticket = await assignTicket(req.user, ticketId, assigneeId);
    res.json(ticket);
  } catch (error) {
    next(error);
  }
}

async function addCommentHandler(req, res, next) {
  try {
    const ticketId = Number(req.params.id);
    const comment = await addComment(req.user, ticketId, req.body);
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTicketHandler,
  listTicketsHandler,
  getTicketHandler,
  changeTicketStatusHandler,
  changeTicketPriorityHandler,
  assignTicketHandler,
  addCommentHandler,
};

