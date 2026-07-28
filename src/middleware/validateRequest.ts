import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { ValidationError } from '../lib/AppError';

interface Schemas {
  params?: ZodTypeAny;
  query?: ZodTypeAny;
  body?: ZodTypeAny;
}

/**
 * Checks a request against its schemas before the handler ever sees it.
 *
 * Parsed values are written back over the raw ones, so a handler reading
 * req.query gets the numbers and enums the schema produced rather than the
 * strings Express handed over.
 */
export function validateRequest(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) Object.assign(req.query, schemas.query.parse(req.query));
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (err) {
      next(
        new ValidationError(
          'The request does not match what this route accepts',
          err instanceof Error
            ? { issues: (err as { issues?: unknown }).issues }
            : undefined,
        ),
      );
    }
  };
}
