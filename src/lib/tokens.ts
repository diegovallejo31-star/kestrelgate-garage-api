import crypto from 'node:crypto';

/** A token nobody can guess, url-safe so it survives being pasted anywhere. */
export function newToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

/**
 * The hash an API key is stored under.
 *
 * Plain SHA-256 rather than a slow hash: a key is already 256 bits of entropy,
 * so there is nothing to brute force, and every request has to check one.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
