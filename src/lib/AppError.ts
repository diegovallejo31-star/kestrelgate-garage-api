/** An error that already knows what the API should answer with. */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(what: string, id: string | number) {
    super(404, 'not_found', `${what} ${id} not found`);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, 'validation_error', message, details);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(409, 'conflict', message, details);
    this.name = 'ConflictError';
  }
}

export class UnauthorisedError extends AppError {
  constructor(message = 'Credentials are missing or will not do') {
    super(401, 'unauthorised', message);
    this.name = 'UnauthorisedError';
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfterSeconds: number) {
    super(429, 'rate_limited', `Too many requests - try again in ${retryAfterSeconds}s`, {
      retryAfterSeconds,
    });
    this.name = 'RateLimitError';
  }
}
