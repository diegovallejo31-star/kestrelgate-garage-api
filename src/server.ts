import { createApp } from './app';
import { env } from './config/env';
import { openDatabase } from './db/client';
import { logger } from './lib/logger';

const db = openDatabase(env.databasePath);
const app = createApp(db);

app.listen(env.port, () => {
  logger.info('kestrelgate listening', { port: env.port, env: env.nodeEnv });
});
