import { z } from 'zod';
import { isDay, isStamp } from './clock';

/**
 * The shared field schemas.
 *
 * A day means the same thing in a dozen modules, so it is defined once rather
 * than being imported out of whichever module happened to need it first.
 */
export const dayString = z
  .string()
  .refine(isDay, 'A day is written YYYY-MM-DD and has to be one that happened');

export const stampString = z.string().refine(isStamp, 'A stamp is written YYYY-MM-DDTHH:MM');

/** A window read off the query string, half-open like every window here. */
export const dayWindowSchema = z
  .object({ from: dayString, to: dayString })
  .refine((window) => window.to > window.from, 'A window has to end after it starts');
