const { initUserModel, User } = require('./User');
const { initTicketModel, Ticket } = require('./Ticket');
const { initCommentModel, Comment } = require('./Comment');

function initModels(sequelize) {
  initUserModel(sequelize);
  initTicketModel(sequelize);
  initCommentModel(sequelize);

  User.hasMany(Ticket, {
    foreignKey: 'authorId',
    as: 'createdTickets',
  });
  Ticket.belongsTo(User, {
    foreignKey: 'authorId',
    as: 'author',
  });

  User.hasMany(Ticket, {
    foreignKey: 'assigneeId',
    as: 'assignedTickets',
  });
  Ticket.belongsTo(User, {
    foreignKey: 'assigneeId',
    as: 'assignee',
  });

  User.hasMany(User, {
    foreignKey: 'managerId',
    as: 'teamMembers',
  });
  User.belongsTo(User, {
    foreignKey: 'managerId',
    as: 'manager',
  });

  Ticket.hasMany(Comment, {
    foreignKey: 'ticketId',
    as: 'comments',
  });
  Comment.belongsTo(Ticket, {
    foreignKey: 'ticketId',
    as: 'ticket',
  });

  User.hasMany(Comment, {
    foreignKey: 'authorId',
    as: 'comments',
  });
  Comment.belongsTo(User, {
    foreignKey: 'authorId',
    as: 'author',
  });
}

module.exports = {
  initModels,
  User,
  Ticket,
  Comment,
};

