const { bootstrap } = require('../src/app');
const { initDatabase } = require('../src/config/database');

async function createTestApp() {
  process.env.DB_DIALECT = 'sqlite';
  process.env.DB_STORAGE = ':memory:';

  await initDatabase();
  const app = await bootstrap();
  return app;
}

module.exports = {
  createTestApp,
};

