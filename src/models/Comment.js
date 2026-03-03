const { DataTypes, Model } = require('sequelize');

class Comment extends Model {}

function initCommentModel(sequelize) {
  Comment.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      internal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'Comment',
      tableName: 'comments',
      timestamps: true,
      underscored: true,
    },
  );

  return Comment;
}

module.exports = {
  Comment,
  initCommentModel,
};

