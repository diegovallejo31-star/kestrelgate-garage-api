import { z } from 'zod';
import { dayString } from '../../lib/schemas';

export const createInvoiceSchema = z
  .object({
    bookingId: z.number().int().positive(),
    number: z.string().min(1).max(120),
    raisedOn: dayString,
  })
  .strict();

export const invoiceIdParamSchema = z.object({ id: z.coerce.number().int().positive() });

export const invoiceQuerySchema = z
  .object({
    bookingId: z.coerce.number().int().positive().optional(),
    number: z.string().min(1).max(120).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .strict();
