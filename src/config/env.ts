import path from 'node:path';

/** Reads a variable, falling back where the fallback is safe outside production. */
function read(name: string, fallback: string): string {
  const value = process.env[name];
  if (value !== undefined && value !== '') return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} must be set in production`);
  }
  return fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(read('PORT', '4120')),
  databasePath: read('DATABASE_PATH', path.join(process.cwd(), 'data', 'kestrelgate.sqlite')),
  /** The key the workshop tablets and the service desk call the API with. */
  apiKey: read('API_KEY', 'kestrelgate-dev-key'),
  sessionTtlHours: Number(read('SESSION_TTL_HOURS', '12')),
  rateLimitPerMinute: Number(read('RATE_LIMIT_PER_MINUTE', '600')),
};
