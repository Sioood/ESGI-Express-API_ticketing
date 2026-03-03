const { Op, Sequelize } = require('sequelize');

function ticketWhereClauseForUser(user) {
  if (user.role === 'support') {
    return {};
  }

  if (user.role === 'collaborator') {
    return { authorId: user.id };
  }

  if (user.role === 'manager') {
    return {
      [Op.or]: [
        { authorId: user.id },
        Sequelize.where(Sequelize.col('author.manager_id'), user.id),
      ],
    };
  }

  return { authorId: user.id };
}

function canViewTicket(user, ticket) {
  if (user.role === 'support') {
    return true;
  }

  if (user.role === 'collaborator') {
    return ticket.authorId === user.id;
  }

  if (user.role === 'manager') {
    if (ticket.authorId === user.id) {
      return true;
    }
    if (ticket.author && ticket.author.managerId === user.id) {
      return true;
    }
  }

  return false;
}

function filterCommentsForUser(user, comments) {
  if (user.role === 'support') {
    return comments;
  }

  return comments.filter((comment) => comment.internal !== true);
}

module.exports = {
  ticketWhereClauseForUser,
  canViewTicket,
  filterCommentsForUser,
};

