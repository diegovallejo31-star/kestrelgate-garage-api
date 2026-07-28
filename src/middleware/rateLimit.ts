import type { NextFunction, Request, Response } from 'express';
import type { Database } from '../db/client';
import { env } from '../config/env';
import { RateLimitError } from '../lib/AppError';

const WINDOW_SECONDS = 60;

/**
 * Holds a caller to so many requests a minute.
 *
 * Counted in the database rather than in memory so that two processes behind
 * one address cannot each allow the whole allowance. Rows older than the window
 * are cleared on the way past, which keeps the table from growing without
 * anything having to sweep it.
 */
export function rateLimit(db: Database) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const bucket = req.ip ?? 'unknown';
    const now = Date.now();
    const cutoff = new Date(now - WINDOW_SECONDS * 1000).toISOString();

    db.prepare('DELETE FROM rate_limit_hits WHERE at < ?').run(cutoff);
    const row = db
      .prepare(
        'SELECT COUNT(*) as hits FROM rate_limit_hits WHERE bucket = ? AND at >= ?',
      )
      .get(bucket, cutoff) as unknown as { hits: number };

    if (row.hits >= env.rateLimitPerMinute) {
      next(new RateLimitError(WINDOW_SECONDS));
      return;
    }

    db.prepare('INSERT INTO rate_limit_hits (bucket, at) VALUES (?, ?)').run(
      bucket,
      new Date(now).toISOString(),
    );
    next();
  };
}
