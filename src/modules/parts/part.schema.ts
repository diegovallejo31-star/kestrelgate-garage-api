import { z } from 'zod';

export const createPartSchema = z
  .object({
    partNumber: z.string().min(1).max(120),
    description: z.string().min(1).max(120),
    tradePricePence: z.number().int().min(0).max(10000000),
    markupBasisPoints: z.number().int().min(0).max(20000),
    onHand: z.number().int().min(0).max(100000),
  })
  .strict();

export const updatePartSchema = z
  .object({
    tradePricePence: z.number().int().min(0).max(10000000).optional(),
    markupBasisPoints: z.number().int().min(0).max(20000).optional(),
    onHand: z.number().int().min(0).max(100000).optional(),
  })
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, 'Say what to change');

export const partIdParamSchema = z.object({ id: z.coerce.number().int().positive() });

export const partQuerySchema = z
  .object({
    partNumber: z.string().min(1).max(120).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .strict();
