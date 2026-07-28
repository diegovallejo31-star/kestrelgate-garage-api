type Level = 'info' | 'warn' | 'error';

/**
 * A logger that writes one JSON object per line.
 *
 * Structured rather than pretty: these lines are read by whatever is scraping
 * the container far more often than by a person, and a person can still pipe
 * them through jq.
 */
function write(
  level: Level,
  message: string,
  fields: Record<string, unknown> = {},
): void {
  const line = JSON.stringify({
    at: new Date().toISOString(),
    level,
    message,
    ...fields,
  });
  if (level === 'error') {
    console.error(line);
    return;
  }
  console.warn(line);
}

export const logger = {
  info: (message: string, fields?: Record<string, unknown>) =>
    write('info', message, fields),
  warn: (message: string, fields?: Record<string, unknown>) =>
    write('warn', message, fields),
  error: (message: string, fields?: Record<string, unknown>) =>
    write('error', message, fields),
};
