import { z } from 'zod';
import { JOB_STATUSES } from './job.types';

export const createJobSchema = z
  .object({
    technicianId: z.number().int().positive(),
    description: z.string().min(1).max(120),
    labourTenths: z.number().int().min(1).max(400),
  })
  .strict();

export const jobIdParamSchema = z.object({ id: z.coerce.number().int().positive() });
export const bookingIdParamSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
});

export const jobQuerySchema = z
  .object({
    status: z.enum(JOB_STATUSES as [string, ...string[]]).optional(),
    technicianId: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .strict();

export const jobStatusSchema = z.object({ status: z.enum(['open', 'done']) }).strict();
