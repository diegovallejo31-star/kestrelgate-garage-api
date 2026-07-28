import { z } from 'zod';
import { dayString } from '../../lib/schemas';

export const createSiteSchema = z
  .object({
    code: z.string().min(1).max(120),
    name: z.string().min(1).max(120),
    town: z.string().min(1).max(120),
    ramps: z.number().int().min(1).max(24),
    openedOn: dayString,
  })
  .strict();

export const updateSiteSchema = z
  .object({
    ramps: z.number().int().min(1).max(24).optional(),
  })
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, 'Say what to change');

export const siteIdParamSchema = z.object({ id: z.coerce.number().int().positive() });

export const siteQuerySchema = z
  .object({
    code: z.string().min(1).max(120).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .strict();
