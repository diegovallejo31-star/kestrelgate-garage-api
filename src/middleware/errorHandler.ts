import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/AppError';
import { logger } from '../lib/logger';

/** Anything that reaches the end of the stack was a route nobody wrote. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'not_found',
      message: `Nothing is served at ${req.method} ${req.path}`,
    },
  });
}

/**
 * Turns a thrown error into the response it always meant.
 *
 * An AppError carries its own status and code. Anything else is a bug, and is
 * logged in full but answered with a flat 500: the caller has no use for a
 * stack trace and an attacker has every use for one.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // A body express itself could not parse never reaches a schema, so it is
  // turned into the same validation error a schema would have raised.
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: { code: 'validation_error', message: 'That body is not JSON we can read' },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  logger.error('unhandled error', {
    message: err instanceof Error ? err.message : String(err),
  });
  res
    .status(500)
    .json({ error: { code: 'internal_error', message: 'Something went wrong' } });
}
