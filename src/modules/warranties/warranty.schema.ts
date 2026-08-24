import { z } from 'zod';
import { dayString } from '../../lib/schemas';
import { WARRANTY_STATUSES } from './warranty.types';

export const createWarrantySchema = z
  .object({
    reference: z.string().min(1).max(120),
    givenOn: dayString,
    expiresOn: dayString,
    coversParts: z.boolean(),
    coversLabour: z.boolean(),
  })
  .strict();

export const warrantyIdParamSchema = z.object({ id: z.coerce.number().int().positive() });
export const jobIdParamSchema = z.object({ jobId: z.coerce.number().int().positive() });

export const warrantyQuerySchema = z
  .object({
    status: z.enum(WARRANTY_STATUSES as [string, ...string[]]).optional(),
    reference: z.string().min(1).max(120).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .strict();

export const warrantyClaimSchema = z.object({ claimedOn: dayString }).strict();
