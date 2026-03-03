const { ValidationError } = require('../core/errors');
const { ALLOWED_PRIORITIES } = require('../core/businessRules/priorityRules');

const ALLOWED_STATUS = [
  'open',
  'assigned',
  'in_progress',
  'resolved',
  'closed',
  'cancelled',
];

const ALLOWED_CATEGORIES = ['bug', 'access', 'hardware', 'other'];

function buildTicketFilters(query) {
  const where = {};

  if (query.status) {
    if (!ALLOWED_STATUS.includes(query.status)) {
      throw new ValidationError('Invalid status filter');
    }
    where.status = query.status;
  }

  if (query.priority) {
    if (!ALLOWED_PRIORITIES.includes(query.priority)) {
      throw new ValidationError('Invalid priority filter');
    }
    where.priority = query.priority;
  }

  if (query.category) {
    if (!ALLOWED_CATEGORIES.includes(query.category)) {
      throw new ValidationError('Invalid category filter');
    }
    where.category = query.category;
  }

  return where;
}

module.exports = {
  buildTicketFilters,
};


