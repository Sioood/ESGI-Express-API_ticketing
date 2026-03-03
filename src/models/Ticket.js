const { DataTypes, Model } = require('sequelize');

class Ticket extends Model {}

function initTicketModel(sequelize) {
  Ticket.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      category: {
        type: DataTypes.ENUM('bug', 'access', 'hardware', 'other'),
        allowNull: false,
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium',
      },
      status: {
        type: DataTypes.ENUM(
          'open',
          'assigned',
          'in_progress',
          'resolved',
          'closed',
          'cancelled',
        ),
        allowNull: false,
        defaultValue: 'open',
      },
    },
    {
      sequelize,
      modelName: 'Ticket',
      tableName: 'tickets',
      timestamps: true,
      underscored: true,
    },
  );

  return Ticket;
}

module.exports = {
  Ticket,
  initTicketModel,
};

