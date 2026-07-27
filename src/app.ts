import express, { type Express } from 'express';
import type { Database } from './db/client';
import { auditLog } from './middleware/auditLog';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimit } from './middleware/rateLimit';
import { requestLogger } from './middleware/requestLogger';

export function createApp(db: Database): Express {
  const app = express();
  app.use(express.json());
  app.use(requestLogger);
  app.use(rateLimit(db));
  app.use(auditLog(db));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
