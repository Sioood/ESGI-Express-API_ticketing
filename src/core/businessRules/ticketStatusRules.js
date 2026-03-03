const { AuthorizationError, ValidationError } = require('../errors');

const ALLOWED_STATUS = [
  'open',
  'assigned',
  'in_progress',
  'resolved',
  'closed',
  'cancelled',
];

function assertValidStatus(status) {
  if (!ALLOWED_STATUS.includes(status)) {
    throw new ValidationError('Invalid status value');
  }
}

function assertCanChangeStatus(user, ticket, newStatus) {
  assertValidStatus(newStatus);

  const current = ticket.status;
  const role = user.role;
  const isAuthor = ticket.authorId === user.id;

  if (current === 'open' && newStatus === 'assigned') {
    if (role !== 'support') {
      throw new AuthorizationError('Only support can assign an open ticket');
    }
    return;
  }

  if (current === 'assigned' && newStatus === 'in_progress') {
    if (role !== 'support') {
      throw new AuthorizationError('Only support can start working on an assigned ticket');
    }
    return;
  }

  if (current === 'in_progress' && newStatus === 'resolved') {
    if (role !== 'support') {
      throw new AuthorizationError('Only support can resolve a ticket in progress');
    }
    return;
  }

  if (current === 'resolved' && newStatus === 'closed') {
    if (!(role === 'support' || (role === 'collaborator' && isAuthor))) {
      throw new AuthorizationError('Only support or the author collaborator can close a resolved ticket');
    }
    return;
  }

  if (current === 'open' && newStatus === 'cancelled') {
    if (!isAuthor) {
      throw new AuthorizationError('Only the author can cancel an open ticket');
    }
    return;
  }

  throw new ValidationError('This status transition is not allowed');
}

module.exports = {
  assertCanChangeStatus,
};

