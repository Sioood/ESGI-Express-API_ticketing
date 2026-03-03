const { Op } = require('sequelize');
const { Ticket, Comment, User } = require('../models');
const {
  ValidationError,
  AuthorizationError,
  NotFoundError,
} = require('../core/errors');
const {
  assertCanSetPriorityOnCreate,
  assertCanChangePriority,
} = require('../core/businessRules/priorityRules');
const { assertCanChangeStatus } = require('../core/businessRules/ticketStatusRules');
const {
  ticketWhereClauseForUser,
  canViewTicket,
  filterCommentsForUser,
} = require('../core/businessRules/visibilityRules');
const { buildTicketFilters } = require('../utils/filters');

async function createTicket(user, payload) {
  const {
    title,
    description,
    category,
    priority,
  } = payload;

  if (!title || !description || !category) {
    throw new ValidationError('title, description and category are required');
  }

  const effectivePriority = priority || 'medium';
  assertCanSetPriorityOnCreate(user, effectivePriority);

  const ticket = await Ticket.create({
    title,
    description,
    category,
    priority: effectivePriority,
    status: 'open',
    authorId: user.id,
    assigneeId: null,
  });

  return ticket;
}

async function listTickets(user, query) {
  const visibilityWhere = ticketWhereClauseForUser(user);
  const filtersWhere = buildTicketFilters(query);

  const where = {
    ...visibilityWhere,
    ...filtersWhere,
  };

  const tickets = await Ticket.findAll({
    where,
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email', 'role', 'managerId'],
      },
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'name', 'email', 'role', 'managerId'],
      },
      {
        model: Comment,
        as: 'comments',
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  const plain = tickets.map((ticket) => {
    const data = ticket.toJSON();
    data.comments = filterCommentsForUser(user, data.comments || []);
    return data;
  });

  return plain;
}

async function getTicketByIdForUser(user, ticketId) {
  const ticket = await Ticket.findByPk(ticketId, {
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email', 'role', 'managerId'],
      },
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'name', 'email', 'role', 'managerId'],
      },
      {
        model: Comment,
        as: 'comments',
      },
    ],
  });

  if (!ticket) {
    throw new NotFoundError('Ticket not found');
  }

  if (!canViewTicket(user, ticket)) {
    throw new AuthorizationError('You cannot view this ticket');
  }

  const data = ticket.toJSON();
  data.comments = filterCommentsForUser(user, data.comments || []);
  return data;
}

async function changeTicketStatus(user, ticketId, newStatus) {
  const ticket = await Ticket.findByPk(ticketId, {
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'managerId'],
      },
    ],
  });

  if (!ticket) {
    throw new NotFoundError('Ticket not found');
  }

  if (!canViewTicket(user, ticket)) {
    throw new AuthorizationError('You cannot modify this ticket');
  }

  assertCanChangeStatus(user, ticket, newStatus);

  ticket.status = newStatus;
  await ticket.save();

  return getTicketByIdForUser(user, ticket.id);
}

async function changeTicketPriority(user, ticketId, newPriority) {
  const ticket = await Ticket.findByPk(ticketId, {
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'managerId'],
      },
    ],
  });

  if (!ticket) {
    throw new NotFoundError('Ticket not found');
  }

  if (!canViewTicket(user, ticket)) {
    throw new AuthorizationError('You cannot modify this ticket');
  }

  assertCanChangePriority(user, ticket.priority, newPriority);

  ticket.priority = newPriority;
  await ticket.save();

  return getTicketByIdForUser(user, ticket.id);
}

async function assignTicket(user, ticketId, assigneeId) {
  if (user.role !== 'support') {
    throw new AuthorizationError('Only support can assign tickets');
  }

  if (!assigneeId) {
    throw new ValidationError('assigneeId is required');
  }

  const [ticket, assignee] = await Promise.all([
    Ticket.findByPk(ticketId, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'managerId'],
        },
      ],
    }),
    User.findByPk(assigneeId),
  ]);

  if (!ticket) {
    throw new NotFoundError('Ticket not found');
  }

  if (!assignee) {
    throw new NotFoundError('Assignee user not found');
  }

  if (assignee.role !== 'support') {
    throw new ValidationError('Assignee must have support role');
  }

  assertCanChangeStatus(user, ticket, 'assigned');

  ticket.assigneeId = assigneeId;
  ticket.status = 'assigned';
  await ticket.save();

  return getTicketByIdForUser(user, ticket.id);
}

async function addComment(user, ticketId, payload) {
  const { content, internal } = payload;

  if (!content) {
    throw new ValidationError('content is required');
  }

  const ticket = await Ticket.findByPk(ticketId, {
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'managerId'],
      },
    ],
  });

  if (!ticket) {
    throw new NotFoundError('Ticket not found');
  }

  if (!canViewTicket(user, ticket)) {
    throw new AuthorizationError('You cannot comment on this ticket');
  }

  const isInternal = internal === true;

  if (isInternal && user.role !== 'support') {
    throw new AuthorizationError('Only support can add internal comments');
  }

  const comment = await Comment.create({
    content,
    internal: isInternal,
    ticketId: ticket.id,
    authorId: user.id,
  });

  return comment;
}

module.exports = {
  createTicket,
  listTickets,
  getTicketByIdForUser,
  changeTicketStatus,
  changeTicketPriority,
  assignTicket,
  addComment,
};

