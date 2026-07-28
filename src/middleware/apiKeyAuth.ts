import type { NextFunction, Request, Response } from 'express';
import type { Database } from '../db/client';
import { env } from '../config/env';
import { UnauthorisedError } from '../lib/AppError';
import { hashToken } from '../lib/tokens';

/**
 * Lets a request through only if it carries a key the office issued.
 *
 * The key in the environment is accepted as well as anything in the table, so a
 * fresh install has one working credential before anybody has had a chance to
 * issue another.
 */
export function apiKeyAuth(db: Database) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.header('authorization') ?? '';
    const token = header.startsWith('Bearer ')
      ? header.slice('Bearer '.length).trim()
      : '';
    if (!token) {
      next(new UnauthorisedError('An API key is required'));
      return;
    }

    if (token === env.apiKey) {
      next();
      return;
    }

    const row = db
      .prepare('SELECT id FROM api_keys WHERE token_hash = ? AND revoked_at IS NULL')
      .get(hashToken(token));
    if (!row) {
      next(new UnauthorisedError('That API key is not one of ours'));
      return;
    }

    next();
  };
}
