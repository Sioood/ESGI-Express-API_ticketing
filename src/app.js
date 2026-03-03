const express = require('express');
const cors = require('cors');

const { config } = require('./config/env');
const { initDatabase } = require('./config/database');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const ticketRoutes = require('./routes/ticket.routes');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/auth', authRoutes);
  app.use('/users', userRoutes);
  app.use('/tickets', ticketRoutes);

  app.use((err, req, res, next) => {
    // eslint-disable-next-line no-console
    console.error(err);

    const status = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(status).json({ error: message });
  });

  return app;
}

async function bootstrap() {
  await initDatabase();
  return createApp();
}

module.exports = {
  createApp,
  bootstrap,
};

