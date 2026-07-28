import express, { type Express } from 'express';
import type { Database } from './db/client';
import { apiKeyAuth } from './middleware/apiKeyAuth';
import { auditLog } from './middleware/auditLog';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimit } from './middleware/rateLimit';
import { requestLogger } from './middleware/requestLogger';
import { createApiKeyRouter } from './modules/apikeys/apiKey.routes';
import { createAuditRouter } from './modules/audit/audit.routes';
import { createAuthRouter } from './modules/auth/auth.routes';

export function createApp(db: Database): Express {
  const app = express();
  app.use(express.json());
  app.use(requestLogger);
  app.use(rateLimit(db));
  app.use(auditLog(db));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const { router: authRouter } = createAuthRouter(db);
  app.use('/auth', authRouter);

  const requireApiKey = apiKeyAuth(db);
  app.use('/api-keys', requireApiKey, createApiKeyRouter(db));
  app.use('/audit', requireApiKey, createAuditRouter(db));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
