require('dotenv').config();

const { config } = require('./config/env');
const { bootstrap } = require('./app');

async function start() {
  try {
    const app = await bootstrap();
    const port = config.port;

    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`API Ticketing listening on port ${port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

start();

