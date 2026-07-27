import type { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger';

/**
 * Logs one line per request once it has finished.
 *
 * The path is read at the start rather than on finish: routing rewrites req.url
 * as it dispatches, so by the time the response ends req.path is whatever the
 * matched router saw rather than what the caller asked for.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();
  const path = req.originalUrl.split('?')[0] ?? req.path;

  res.on('finish', () => {
    logger.info('request', {
      method: req.method,
      path,
      status: res.statusCode,
      tookMs: Date.now() - startedAt,
    });
  });

  next();
}
