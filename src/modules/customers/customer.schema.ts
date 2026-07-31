import { z } from 'zod';
import { dayString } from '../../lib/schemas';

export const createCustomerSchema = z
  .object({
    accountRef: z.string().min(1).max(120),
    name: z.string().min(1).max(120),
    phone: z.string().min(1).max(120),
    email: z.string().email().max(200).optional(),
    openedOn: dayString,
    onAccount: z.boolean().optional(),
  })
  .strict();

export const updateCustomerSchema = z
  .object({
    email: z.string().email().max(200).optional(),
    onAccount: z.boolean().optional(),
  })
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, 'Say what to change');

export const customerIdParamSchema = z.object({ id: z.coerce.number().int().positive() });

export const customerQuerySchema = z
  .object({
    accountRef: z.string().min(1).max(120).optional(),
    onAccount: z.coerce.boolean().optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .strict();
