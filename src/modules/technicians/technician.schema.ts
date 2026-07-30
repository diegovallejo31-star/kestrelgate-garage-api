import { z } from 'zod';
import { dayString } from '../../lib/schemas';

export const createTechnicianSchema = z
  .object({
    clockNumber: z.string().min(1).max(120),
    name: z.string().min(1).max(120),
    grade: z.enum(['apprentice', 'technician', 'master', 'mot_tester']),
    labourRatePence: z.number().int().min(1000).max(30000),
    startedOn: dayString,
  })
  .strict();

export const updateTechnicianSchema = z
  .object({
    grade: z.enum(['apprentice', 'technician', 'master', 'mot_tester']).optional(),
    labourRatePence: z.number().int().min(1000).max(30000).optional(),
  })
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, 'Say what to change');

export const technicianIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export const siteIdParamSchema = z.object({ siteId: z.coerce.number().int().positive() });

export const technicianQuerySchema = z
  .object({
    clockNumber: z.string().min(1).max(120).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .strict();
