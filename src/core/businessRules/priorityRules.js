const { AuthorizationError, ValidationError } = require('../errors');

const ALLOWED_PRIORITIES = ['low', 'medium', 'high', 'critical'];

function assertValidPriority(priority) {
  if (!ALLOWED_PRIORITIES.includes(priority)) {
    throw new ValidationError('Invalid priority value');
  }
}

function assertCanSetPriorityOnCreate(user, desiredPriority) {
  assertValidPriority(desiredPriority);

  if (user.role === 'collaborator' && desiredPriority === 'critical') {
    throw new AuthorizationError('Collaborator cannot create a ticket with critical priority');
  }
}

function assertCanChangePriority(user, oldPriority, newPriority) {
  assertValidPriority(newPriority);

  if (user.role === 'support') {
    throw new AuthorizationError('Support cannot change ticket priority');
  }

  if (user.role === 'collaborator') {
    if (newPriority === 'critical') {
      throw new AuthorizationError('Collaborator cannot set priority to critical');
    }
  }
}

module.exports = {
  assertCanSetPriorityOnCreate,
  assertCanChangePriority,
  ALLOWED_PRIORITIES,
};

