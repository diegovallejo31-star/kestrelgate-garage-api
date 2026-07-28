import type { NextFunction, Request, Response } from 'express';
import type { Database } from '../db/client';

/**
 * Writes a row per request into the audit table.
 *
 * Like the logger, the path is captured on the way in. Failures to write are
 * swallowed: an audit row is worth having, but not worth turning a request that
 * otherwise succeeded into a 500.
 */
export function auditLog(db: Database) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startedAt = Date.now();
    const path = req.originalUrl.split('?')[0] ?? req.path;

    res.on('finish', () => {
      try {
        db.prepare(
          `INSERT INTO audit_entries (method, path, status_code, actor, took_ms)
           VALUES (?, ?, ?, ?, ?)`,
        ).run(
          req.method,
          path,
          res.statusCode,
          req.header('authorization') ? 'key' : null,
          Date.now() - startedAt,
        );
      } catch {
        // An audit row is not worth failing a served request over.
      }
    });

    next();
  };
}
