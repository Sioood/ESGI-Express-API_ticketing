const { Sequelize } = require('sequelize');
const { config } = require('./env');
const { initModels } = require('../models');

let sequelize;

function createSequelizeInstance() {
  if (config.db.dialect === 'sqlite') {
    return new Sequelize({
      dialect: 'sqlite',
      storage: config.db.storage,
      logging: false,
    });
  }

  return new Sequelize(
    config.db.database,
    config.db.username,
    config.db.password,
    {
      host: config.db.host,
      port: config.db.port,
      dialect: 'mysql',
      logging: false,
    },
  );
}

async function initDatabase() {
  if (!sequelize) {
    sequelize = createSequelizeInstance();
    initModels(sequelize);
  }

  await sequelize.authenticate();
  await sequelize.sync();

  return sequelize;
}

function getSequelize() {
  if (!sequelize) {
    throw new Error('Sequelize not initialized. Call initDatabase() first.');
  }
  return sequelize;
}

module.exports = {
  initDatabase,
  getSequelize,
};

