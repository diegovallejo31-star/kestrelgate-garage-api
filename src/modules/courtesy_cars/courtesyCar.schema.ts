import { z } from 'zod';
import { COURTESY_CAR_STATUSES } from './courtesyCar.types';

export const createCourtesyCarSchema = z
  .object({
    registration: z.string().min(1).max(120),
    model: z.string().min(1).max(120),
    seats: z.number().int().min(2).max(9),
  })
  .strict();

export const updateCourtesyCarSchema = z
  .object({
    seats: z.number().int().min(2).max(9).optional(),
  })
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, 'Say what to change');

export const courtesyCarIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export const siteIdParamSchema = z.object({ siteId: z.coerce.number().int().positive() });

export const courtesyCarQuerySchema = z
  .object({
    status: z.enum(COURTESY_CAR_STATUSES as [string, ...string[]]).optional(),
    registration: z.string().min(1).max(120).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .strict();

export const courtesyCarStatusSchema = z
  .object({ status: z.enum(['available', 'on_loan', 'off_road']) })
  .strict();
