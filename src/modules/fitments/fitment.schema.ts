import { z } from 'zod';

export const createFitmentSchema = z
  .object({
    partId: z.number().int().positive(),
    quantity: z.number().int().min(1).max(999),
  })
  .strict();

export const fitmentIdParamSchema = z.object({ id: z.coerce.number().int().positive() });
export const jobIdParamSchema = z.object({ jobId: z.coerce.number().int().positive() });

export const fitmentQuerySchema = z
  .object({
    partId: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .strict();
